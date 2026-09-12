// Balance · 30 second website video.
// Records the prototype phone beat by beat with Playwright, then composes
// 1920x1080 with ffmpeg. Caption words and timing come from captions.srt.
//
//   node video/build.mjs            record + compose
//   node video/build.mjs --compose  reuse the clips in video/clips, only compose
//
import { chromium } from '/Users/ajaynicolas/GitHub/IBL5/ibl5/node_modules/playwright/index.mjs';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT  = path.resolve(path.dirname(new URL(import.meta.url).pathname));
const PROTO = 'file://' + path.join(path.dirname(ROOT), 'Prototype.html');
const CLIPS = path.join(ROOT, 'clips');
const OUT   = path.join(ROOT, 'out');
const FRAMES= path.join(OUT, 'frames');
for (const d of [CLIPS, OUT, FRAMES]) fs.mkdirSync(d, { recursive: true });

const W = 1920, H = 1080, FPS = 30;
const CREAM = '#FFFDF8', INK = '#1D1D1F', CORAL = '#FF5A36', MUTED = '#6E6E73';
const PW = 720, PH = 1480;                       // recorded phone clip size
const composeOnly = process.argv.includes('--compose');

/* ── captions: the SRT is the single source for words and cue times ── */
function parseSrt(txt) {
  const t = s => { const m = s.match(/(\d+):(\d+):(\d+),(\d+)/); return +m[1]*3600 + +m[2]*60 + +m[3] + +m[4]/1000; };
  return txt.trim().split(/\n\s*\n/).map(b => {
    const l = b.split('\n'); const [a, z] = l[1].split('-->');
    return { start: t(a), end: t(z), text: l.slice(2).join('\n') };
  });
}
const cues = parseSrt(fs.readFileSync(path.join(ROOT, 'captions.srt'), 'utf8'));
const cueAt = s => (cues.find(c => s >= c.start && s < c.end) || { text: '' }).text;

/* ── the phone-only view of the prototype ── */
const PHONE_CSS = `
.rail,.stage-copy{display:none!important}
html,body{margin:0;background:${CREAM};overflow:hidden}
.stage{display:block!important;padding:0!important;margin:0!important}
.phone-wrap{position:fixed!important;left:0;top:0;margin:0!important;padding:0!important;zoom:2;width:360px}
.phone{box-shadow:none!important;width:360px!important;height:740px!important}   /* pin: the <900px media query would otherwise shrink-to-fit */
.toast,.note{display:none!important}   /* no dev/prototype notes or toasts in the video */`;

const sleep = (page, ms) => page.waitForTimeout(ms);
const run   = (page, js) => page.evaluate(js);
// skipSetup() fires a "jumped to Day 1" toast; demo chrome, so silence it.
const setup = (page, js) => run(page, `skipSetup(); clearTimeout(window._tt); document.getElementById('toast').classList.remove('on'); ${js}`);
const scroll= (page, top) => run(page, `document.getElementById('body').scrollTo({top:${top},behavior:'smooth'})`);

/* ── beats. dur in seconds. Each records one clip (split records two). ── */
const BEATS = [
  { id: 'signup', dur: 5, async act(p) {
      await setup(p, `S.signedInWith=null; save(); goTo('P-01')`); await sleep(p, 1300);
      await run(p, `goTo('P-03')`); await sleep(p, 900);
      await run(p, `signIn('Apple')`); await sleep(p, 1100);
      await run(p, `goTo('P-06b')`); await sleep(p, 1000);
      await run(p, `goTo('P-10')`); await sleep(p, 1200); } },
  { id: 'goals', dur: 4.5, async act(p) {
      await setup(p, `S.hrDone={}; S.goalKid=0; S.diet={}; save(); goTo('PR-01')`); await sleep(p, 1300);
      await run(p, `goTo('G-01')`); await sleep(p, 900);
      await run(p, `pickDiet(DIETS[1].k)`); await sleep(p, 1100);
      await run(p, `goTo('D0-02')`); await sleep(p, 1400); } },
  { id: 'split-parent', dur: 5, async act(p) {
      await setup(p, `goTo('D0-02')`); await sleep(p, 2200);
      await run(p, `S.claimed[0]=S.claimed[0]||[]; S.claimed[0].push(QUESTS[1].k); S.points[0]+=QUESTS[1].v; save(); render()`);
      await sleep(p, 3000); } },
  { id: 'split-child', dur: 5, async act(p) {
      await setup(p, `S.kid=0; S.flow='child'; S.seenDisclosure[0]=true; save(); goTo('K-04')`); await sleep(p, 2200);
      await run(p, `claimQuest(1)`); await sleep(p, 3000); } },
  { id: 'watch', dur: 5, async act(p) {
      await setup(p, `goTo('FLAG')`); await sleep(p, 1400);
      await run(p, `openFlag(0,'A')`); await sleep(p, 1600);
      await scroll(p, 420); await sleep(p, 2200); } },
  { id: 'talk', dur: 4.5, async act(p) {
      await setup(p, `goTo('TALK',[0,'A'])`); await sleep(p, 2000);
      await scroll(p, 380); await sleep(p, 2700); } },
  { id: 'plan', dur: 4, async act(p) {
      await setup(p, `S.goalKid=0; S.cal={0:{mode:null,items:[],skip:false},1:{mode:null,items:[],skip:false}}; save(); goTo('CAL-01')`); await sleep(p, 800);
      await run(p, `syncCal('phone')`); await sleep(p, 1400);
      await run(p, `S.sharmasIn=true; save(); goTo('INV-04')`); await sleep(p, 2000); } },
];
const END_DUR = 2;

/* ── record ── */
async function record(browser) {
  for (const f of fs.readdirSync(CLIPS)) fs.rmSync(path.join(CLIPS, f));
  const leads = {};
  for (const b of BEATS) {
    const t0 = Date.now();                       // recording starts with the context
    const ctx = await browser.newContext({ viewport: { width: PW, height: PH }, recordVideo: { dir: CLIPS, size: { width: PW, height: PH } } });
    // apply the phone-only CSS before first paint so the rail never flashes
    await ctx.addInitScript(css => { const st = document.createElement('style'); st.textContent = css; document.documentElement.appendChild(st); }, PHONE_CSS);
    const page = await ctx.newPage();
    await page.goto(PROTO);
    await page.addStyleTag({ content: PHONE_CSS });
    await page.evaluate(() => document.fonts.ready);
    await sleep(page, 300);
    leads[b.id] = (Date.now() - t0) / 1000;      // seconds of setup to trim off the front
    await b.act(page);
    const v = page.video();
    await ctx.close();
    fs.renameSync(await v.path(), path.join(CLIPS, b.id + '.webm'));
    console.log('recorded', b.id, 'lead', leads[b.id].toFixed(2) + 's');
  }
  fs.writeFileSync(path.join(CLIPS, 'leads.json'), JSON.stringify(leads, null, 1));
}

/* ── caption frames, rendered in the browser so Manrope matches the app ── */
function frameHtml({ caption, labels, end }) {
  const split = !!labels;
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const lab = labels ? labels.map(l => `<div class="lab" style="left:${l.x}px;top:${l.y}px;width:${l.w}px">${esc(l.t)}</div>`).join('') : '';
  return `<!doctype html><html><head><link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap" rel="stylesheet">
<style>
html,body{margin:0;width:${W}px;height:${H}px;background:${CREAM};font-family:Manrope,-apple-system,sans-serif;color:${INK};overflow:hidden}
.wm{position:absolute;left:140px;top:84px;font-size:34px;font-weight:700;letter-spacing:-.01em;display:flex;align-items:center;gap:12px}
.wm i{width:16px;height:16px;border-radius:50%;background:${CORAL};display:block}
.cap{position:absolute;left:140px;top:0;height:${H}px;display:flex;align-items:center;width:${end ? 1640 : split ? 700 : 1120}px}
.cap div{font-size:${end ? 76 : 66}px;line-height:1.16;font-weight:800;letter-spacing:-.02em;white-space:pre-line}
.lab{position:absolute;text-align:center;font-size:24px;font-weight:700;color:${MUTED}}
</style></head><body>
<div class="wm"><i></i>Balance</div>
<div class="cap"><div>${esc(caption)}</div></div>${lab}
</body></html>`;
}
async function renderFrames(browser) {
  const ctx = await browser.newContext({ viewport: { width: W, height: H } });
  const page = await ctx.newPage();
  let t = 0;
  const jobs = [];
  for (const b of BEATS) {
    if (b.id === 'split-child') continue;
    const split = b.id === 'split-parent';
    jobs.push({ name: split ? 'split' : b.id, caption: cueAt(t), labels: split ? SPLIT.labels : null });
    t += b.dur;
  }
  jobs.push({ name: 'end', caption: cueAt(t), end: true });
  // phone-shaped mask: the clip is cut to this so nothing shows outside the rounded bezel
  const r = Math.round(44 * 2 * PH_W / PW) + 2;                // .phone border-radius, scaled, +2px to bite into the bezel
  await page.setContent(`<body style="margin:0;background:#000"><div style="width:${PH_W}px;height:${PH_H}px;border-radius:${r}px;background:#fff"></div></body>`);
  await page.screenshot({ path: path.join(FRAMES, 'mask.png'), clip: { x: 0, y: 0, width: PH_W, height: PH_H } });
  for (const j of jobs) {
    await page.setContent(frameHtml(j));
    await page.evaluate(() => document.fonts.ready);
    await sleep(page, 200);
    await page.screenshot({ path: path.join(FRAMES, j.name + '.png') });
  }
  await ctx.close();
}

/* ── layout ── */
const PH_H = 960, PH_W = Math.round(PH_H * PW / PH);           // one phone size everywhere (467x960)
const SINGLE = { h: PH_H, w: PH_W, x: 1313, y: 60 };            // one phone, right side
const SPLIT  = { h: PH_H, w: PH_W, x1: 886, x2: 1393, y: 60,     // two phones, same size, 40px gap
  labels: [{ t: 'Sam', x: 886, y: 18, w: PH_W }, { t: 'Maya', x: 1393, y: 18, w: PH_W }] };

function ff(args) { execFileSync('ffmpeg', ['-v', 'error', '-y', ...args], { stdio: 'inherit' }); }
function compose() {
  const leads = JSON.parse(fs.readFileSync(path.join(CLIPS, 'leads.json'), 'utf8'));
  const cut = id => `trim=start=${(leads[id] + 0.05).toFixed(2)},setpts=PTS-STARTPTS`;
  const mask = path.join(FRAMES, 'mask.png');
  // every caption change fades through the cream background; the first beat and the end card keep the global black fades
  const XF = 0.3;
  const xfade = (dur, start, fadeOut) => (start > 0 ? `,fade=t=in:st=0:d=${XF}:color=0x${CREAM.slice(1)}` : '') +
                                        (fadeOut ? `,fade=t=out:st=${(dur - XF).toFixed(2)}:d=${XF}:color=0x${CREAM.slice(1)}` : '');
  const segs = [];
  let t = 0;
  for (const b of BEATS) {
    if (b.id === 'split-child') continue;
    const out = path.join(OUT, 'seg-' + b.id + '.mp4');
    if (b.id === 'split-parent') {
      const w = SPLIT.w, h = SPLIT.h;
      ff(['-loop', '1', '-i', path.join(FRAMES, 'split.png'),
          '-i', path.join(CLIPS, 'split-parent.webm'), '-i', path.join(CLIPS, 'split-child.webm'), '-i', mask,
          '-filter_complex', `[3:v]format=gray,split[m1][m2];[1:v]${cut('split-parent')},scale=${w}:${h}[a0];[a0][m1]alphamerge[a];[2:v]${cut('split-child')},scale=${w}:${h}[b0];[b0][m2]alphamerge[b];[0:v][a]overlay=${SPLIT.x1}:${SPLIT.y}[t];[t][b]overlay=${SPLIT.x2}:${SPLIT.y}${xfade(b.dur, t, true)}`,
          '-t', String(b.dur), '-r', String(FPS), '-pix_fmt', 'yuv420p', '-an', out]);
    } else {
      const h = SINGLE.h, w = SINGLE.w;
      ff(['-loop', '1', '-i', path.join(FRAMES, b.id + '.png'), '-i', path.join(CLIPS, b.id + '.webm'), '-i', mask,
          '-filter_complex', `[2:v]format=gray[m];[1:v]${cut(b.id)},scale=${w}:${h}[p0];[p0][m]alphamerge[p];[0:v][p]overlay=${SINGLE.x}:${SINGLE.y}${xfade(b.dur, t, true)}`,
          '-t', String(b.dur), '-r', String(FPS), '-pix_fmt', 'yuv420p', '-an', out]);
    }
    segs.push(out); t += b.dur;
  }
  const end = path.join(OUT, 'seg-end.mp4');
  ff(['-loop', '1', '-i', path.join(FRAMES, 'end.png'), '-vf', xfade(END_DUR, t, false).slice(1) || 'null',
      '-t', String(END_DUR), '-r', String(FPS), '-pix_fmt', 'yuv420p', end]);
  segs.push(end); t += END_DUR;

  const list = path.join(OUT, 'segs.txt');
  fs.writeFileSync(list, segs.map(s => `file '${s}'`).join('\n'));
  const joined = path.join(OUT, 'joined.mp4');
  ff(['-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', joined]);

  const final = path.join(OUT, 'balance-30s.mp4');
  ff(['-i', joined, '-i', path.join(ROOT, 'captions.srt'),
      '-vf', `fade=t=in:st=0:d=0.4,fade=t=out:st=${t - 0.5}:d=0.5`,
      '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-movflags', '+faststart',
      '-c:s', 'mov_text', '-metadata:s:s:0', 'language=eng', final]);
  fs.copyFileSync(path.join(ROOT, 'captions.srt'), path.join(OUT, 'balance-30s.srt'));
  for (const s of [...segs, joined, list]) fs.rmSync(s);
  console.log('wrote', final, `(${t}s)`);
}

const browser = await chromium.launch();
if (!composeOnly) await record(browser);
await renderFrames(browser);
await browser.close();
compose();
