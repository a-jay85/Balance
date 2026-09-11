# Balance — fix-up handoff

Written 2026-09-11. Two files were changed:

- `/Users/ajaynicolas/GitHub/Balance/Balance — Prototype.html` (em dash)
- `/Users/ajaynicolas/GitHub/Balance/Balance – Website.html` (en dash)

`LevelUp/` and `Older Prototype/` were not touched.

Every change is its own git commit on `main`, so any single one can be reverted
alone. Run `git log --oneline` to see them.

No user-facing words were written or rewritten. Where new words are needed there
is a visible `[COPY]` placeholder. The renames (Recs/Rex → Smart Balance,
Redirect → Nudge Logic) were **not** done — a human is doing those.

---

## 1 · Every `[COPY]` spot

Line numbers are from the current commit. If you edit the file the numbers move,
so search for the literal string `[COPY]` instead.

### `Balance — Prototype.html`

| Line | Screen | What it is |
|---|---|---|
| 2763 | D0-00 | First-report card · label |
| 2764 | D0-00 | First-report card · body. This is the "your first report arrives at 2am" card. |
| 2871 | WIN-D | Win detail · topbar title |
| 2875 | WIN-D | Win detail · section label |
| 2876 | WIN-D | Win detail · body |
| 2877 | WIN-D | Win detail · button |
| 3083 | HR-01 | House rules gate 1 · eyebrow (the `· Name, age` after it is generated) |
| 3084 | HR-01 | House rules gate 1 · headline |
| 3085 | HR-01 | House rules gate 1 · subhead |
| 3089 | HR-01 | Day band · label |
| 3090 | HR-01 | Day band · title |
| 3101 | HR-01 | Section label above the rules that stop the screen |
| 3103 | HR-01 | Section label above the rules that only change gear |
| 3106 | HR-01 | Continue button |
| 3138 | HR-02 | House rules gate 2 · eyebrow |
| 3139 | HR-02 | House rules gate 2 · headline |
| 3140 | HR-02 | House rules gate 2 · subhead |
| 3143 | HR-02 | Section label above the threshold list |
| 3146 | HR-02 | Finish button |
| 4384 | `home` module | Overall score value and its delta. The old hard-coded `74 /100 · ↑ 6 pts · Good` was removed here. |

Lines 2865, 3061 and 3115 are code comments that mention `[COPY]`, not slots.

There is a good source for the HR-01 / HR-02 words already in the file: the
STAGE narration at lines **3808** (`'HR-01'`) and **3809** (`'HR-02'`). It was
left alone on purpose — promoting narration into product copy is a writing
decision.

### `Balance – Website.html`

| Line | What it is |
|---|---|
| 207 | `title` on the hero iframe (`<iframe class="proto-frame" … title="[COPY]">`) |

---

## 2 · Wording gaps found while checking flags A / B / C

Flags now come from one source (`CASES` + `flagsFor()`) on all four surfaces:
Home (`D0-02`), Flagged (`FLAG`), Watch View (`WATCH`) and Talking Points
(`TALK`). Before this, Home had its own hand-typed copy of the three flags and
had drifted. **The wiring is fixed. The wording below is not — that is yours.**

1. **Flag A subline got longer on Home.** Home used to say
   *"Two videos of the same challenge. Kids in them, not adults."*
   `CASES` says *"Two videos of the same challenge this week. Kids in them, not
   adults."* Home now shows the longer one. Decide which is right.

2. **Flag B subline got a third sentence on Home.** Home used to stop at
   *"Three body and beauty videos this week. {name} is {age}."*
   `CASES` adds *"{They} did not search for them."* That extra sentence now
   appears on Home. It may be too long for a summary row.

3. **Flag titles keep their full stop in `CASES` but not in the lists.** The
   list surfaces strip a trailing `.` with `.replace(/\.$/,'')`, so the same
   string reads *"Two hauls"* in a list and *"Two hauls."* on Watch View. It
   works, but it means the copy has two shapes.

4. **Home shows no name or age on its flag rows; Flagged does.** Flagged rows
   carry a `Name · age` line above the flag. Home does not, because Home is
   already scoped to one child. Fine as-is, worth a look.

5. **A child under 10 now sees two flags on Home, not three.** `flagsFor()`
   only gives flag B to a child aged 10+. Home used to always show three rows
   and label the second one B regardless of age — that was wrong. The section
   heading "Needs attention" does not say how many, so nothing reads oddly, but
   confirm that a two-row section is acceptable.

---

## 3 · The two open picks

1. **Where the Discover tab lives.** Left exactly where it is. The bottom-nav
   Discover tab currently targets the screen `INV-01` ("Your circle"), which is
   the family-invite screen, not a discovery surface. This was deliberately not
   changed — where Discover belongs is a product call. See `bottomNav()` at
   line 2124.

2. **Which palette.** Nothing is chosen. Four options sit behind a switch in the
   left rail footer:
   - **Default** — the palette that shipped.
   - **Bold white** — Apple Health rings on white.
   - **Warm coral** — coral / navy / cream from the LevelUp handoff, mint
     `#5EC4A7`, plum `#8B7EC8`.
   - **Navy dark** — dark navy surfaces, light ink.

   Each one only re-points the CSS custom properties in `:root`. No screen
   markup depends on a palette. To make one the default, copy its block over
   `:root` and delete the switch.

   The website CTA colour is a placeholder too: `--btnbg` is set to the existing
   `--coral` token in `:root` in `Balance – Website.html`. Change it there once a
   palette is picked.

---

## 4 · Things left alone on purpose

These are all user-facing words, so they were not touched. Each one is now
slightly stale or worth a second look.

| File · line | What |
|---|---|
| Prototype · 878 | Notes panel: *"Claim a quest on **Maya's** phone and Sam's…"* — names a hard-coded child that no longer exists by default. |
| Prototype · 904 | Notes panel: *"**points vs XP.** … The marketing site says XP throughout."* — the app now says points everywhere, so this note is out of date. |
| Prototype · 1976–1983, 3206–3219, 3244–3268 | The abbreviation **`pts`** is still used on the child screens, while the rest of the app says **points**. Only the word XP/Loot was swapped; `pts` was left as a copy decision. |
| Prototype · 3805 | STAGE note for `P-08` names *Sam* and *Maya* in prose. |
| Prototype · 3822 | STAGE note for `K-02` names *Maya*. |
| Prototype · 3823 | STAGE note for `K-DISC`. |
| Prototype · 3346, 3355, 3774, 3836, 3872 | *Natasha* is hard-coded as the family-circle invitee. Not driven by typed data. |

### Rail-footer labels

The developer controls in the rail footer use plain functional labels rather
than `[COPY]`: **"Developer · demo family"**, and the palette buttons
**"Default" / "Bold white" / "Warm coral" / "Navy dark"**. The reasoning: the
rail footer is prototype chrome, not product — it already reads "What's real vs.
mocked", "Skip ahead — family set up", "Reset — start over". If you want these
to be `[COPY]` too, they are all in one place: search for `pal-row` and
`devFixture`.

---

## 5 · Known behaviour that is not a bug

- **A fresh page load has an empty family.** Family data now reads from what the
  parent types on "Who's in your family" (`P-04`). The seed family is two blank
  slots named "New child" with no age. If you rail-jump straight into a later
  screen without typing anything, you will see `New child · null`. That is the
  blank state showing through, not a crash — nothing throws and no screen is
  empty. Use one of the two shortcuts below to get a working family.
- **Two ways to load a demo family.** The **Developer · demo family** toggle in
  the rail footer, and **Skip ahead — family set up**. Both load the same
  fixture: Maya (14) and Jake (8). The toggle is off by default.
- **Maya is 14.** Her date of birth is `2012-03-14`. She is out of COPPA range,
  which changes which screens she sees.
- **The `home` module is unreachable.** There is a whole second home-screen
  implementation in an IIFE near the end of the file that nothing mounts — the
  mount map at line 3859 only knows `HR`, `MIX` and `RDR`. The `74` score that
  was removed lived in there. It is dead code; deleting it is a separate call.
- **`scoreOnline` / `scoreOff` / `scoreOverall` are defined but never called.**
- **The demo clock is fixed.** `const TODAY = new Date(2026,7,24)`.

---

## 6 · Deep links

The prototype reads a hash on load, so the website can open a named screen:

```
Balance%20%E2%80%94%20Prototype.html#P-03
```

opens *Create account · SSO*. Any screen ID in `SCREENS` works. An unknown hash
is ignored. Both **Get started** buttons on the website point at `#P-03`.

The website hero no longer has a "How it works" button. In its place the hero
slot runs the live prototype in an iframe, scaled to fit. That is a stand-in for
the 30 second video that does not exist yet — replace the whole `.hero-embed`
block with the video when there is one.
