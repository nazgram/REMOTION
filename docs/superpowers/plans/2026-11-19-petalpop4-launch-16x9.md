# Petal Pop Drop 4 LED Teaser 16:9 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A 26.5 s 1920x1080 60 fps Remotion video: 6 Drop 4 designs in shaped panels with flower-bloom transitions, climax, animated COMING SOON, animated Petal Pop 4 logo, NAFESA fade.

**Architecture:** New folder `petalpop4-launch-16x9/`, a copy of `joyclub-launch-16x9/` (panels, beats, validator, stills, storyboard). Dots are replaced by flower units cut from the Drop 4 SVGs with the Drop 3 teaser pipeline (`scripts/drop3t_assets.py` on branch `claude/project-thread-fzl97f`). Footage = graded full-resolution cuts of only the chosen raw ranges, made on Nas's Mac.

**Tech Stack:** Remotion 4, TypeScript, vitest, Python (librosa, numpy, scipy, PIL), ffmpeg on the Mac.

**Spec:** `/mnt/project-files/petal-pop-4/teaser-16x9/2026-11-19-design-teaser-drop4-16x9.md` (copy in `petalpop4-launch-16x9/docs/design.md`).

## Global Constraints
- 1920x1080, 60 fps, length 26.5 s = song 165.5 s to 192.0 s of "April Rain Rhythm - Funky Groove Town.mp3"; 0.1 s fade in, 0.5 s fade out at the end.
- 103 BPM; beats from librosa on the FULL song minus 165.5.
- Text: only design names and "COMING SOON". No other copy.
- Order: Pearl Grey, Dusty Rose, Lilac Mist, Sage Petal, Powder Blue, Black Dahlia.
- Grade baked into footage: `eq=contrast=1.08:brightness=0.015:saturation=1.15:gamma=1.04,curves=all='0/0 0.25/0.26 0.5/0.53 0.75/0.77 0.9/0.87 1/0.94'`.
- Shots: nobody blocking the model, model ready, not shaky, never the start of a raw clip (skip first 2.0 s), no raw second used twice, speed >= 0.5, crop zoom <= 1.4.
- Every design has one detail (print close-up) panel.
- No full render until Nas says "render". Storyboard PNG first.

## Review Focus
- A bloom sweep that leaves a 1-frame gap showing the previous shot: reveal starts 3 frames early (Joy Club fix). Test: timeline sweep cover end >= next block start.
- A panel clip running past the end of its raw cut file: validator checks `t + life*speed <= clipDur - 0.2`.
- Name card or flower accent over a face: stills check per design (card bottom-left, faces at panel centre).
- Song cut on a non-beat: beat 0 must be within 30 ms of 0.0 s after the offset. Test in beats test.
- Black Dahlia print on dark ground hides dark flower units in the sweep into COMING SOON: use the print's lighter units (lightness > 0.35) for that sweep.

---

### Task 1: Scaffold + timeline

**Files:**
- Create: `petalpop4-launch-16x9/` (copy of `joyclub-launch-16x9/` minus `src/v3` designs/shots/logo and `public/v3`), `src/pp4/timeline.ts`, `src/pp4/beats.ts` (copied), `src/pp4/__tests__/timeline.test.ts`, `public/pp4/song.m4a`, `public/pp4/beats.json`
- Modify: `src/Root.tsx` (composition `PetalPop4Launch`, 1920x1080, 60 fps, `f(26.5)` frames)

**Interfaces:**
- Produces: `buildTimeline(beats: number[]): Segment[]` with `Segment = {kind: 'intro'|'design'|'climax'|'coming'|'nafesa'; design?: DesignId; start: number; end: number; beat0: number}`; `END = 26.5`; constants `INTRO_BEATS = 2`, `DESIGN_BEATS = 5`, `CLIMAX_BEATS = 4`, `COMING_BEATS = 5`.

- [ ] Step 1: tests: segments in order intro, 6 x design, climax, coming, nafesa; intro beats 0-2; design i beats `2+5i` to `7+5i`; climax 32-36; coming 36-41; nafesa 41 to END; `beatAt(0)` within 0.03 s of 0.
- [ ] Step 2: `npx vitest run` fails.
- [ ] Step 3: cut song (`ffmpeg -ss 165.5 -t 26.5`, aac), run `scripts/beats.py` with offset 165.5, implement `buildTimeline`.
- [ ] Step 4: `npx vitest run` and `npx tsc --noEmit` pass.
- [ ] Step 5: commit `pp4: scaffold, song cut, beat timeline`.

### Task 2: Print units, palettes, logo

**Files:**
- Create: `scripts/pp4_assets.py` (from `drop3t_assets.py`, WAYS = the 6 Drop 4 names), `src/pp4/pattern.json`, `src/pp4/logo.json`, `public/pp4/<way>.jpg`, `src/pp4/designs.ts`, test `src/pp4/__tests__/assets.test.ts`

**Interfaces:**
- Produces: `DesignId = 'pearl'|'dusty'|'lilac'|'sage'|'powder'|'dahlia'`; `DESIGNS: Record<DesignId, {name: string; bg: string; accent: string; raws: string[]}>` (name uppercase from catalog, bg = SVG background rect, raws from spec mapping); `ORDER`; `units(d): {d: string; fill: string; cx: number; cy: number; r: number}[]` from pattern.json; `LOGO: {part: string; d: string; fill: string}[]`.
- If the 6 SVGs do not share one artwork, fall back to per-way unit lists (assert in script).

- [ ] Step 1: tests: 6 designs, each bg is a hex colour, each has >= 40 flower units with r > 20; LOGO has >= 5 distinct letter parts.
- [ ] Step 2: run, fails.
- [ ] Step 3: stage the 6 SVGs + logo SVG from `PETAL POP 4/TEASER VIDEO/`, run `python3 scripts/pp4_assets.py <dir>`; check catalog PDFs `Drop 4/*.pdf` page 1 for name lettering (save a PNG per name to `public/pp4/name_<id>.png` if it is artwork; else names are text in Fraunces).
- [ ] Step 4: tests pass; contact image of the units of one design looks like whole flowers.
- [ ] Step 5: commit `pp4: Drop 4 print units, palettes, logo`.

### Task 3: Shot picking and graded footage

**Files:**
- Create: `scripts/pp4_sheets.sh` (Mac), `scripts/pp4_shake.py`, `scripts/pp4_cut.sh` (Mac), `src/pp4/shots.ts`, test `src/pp4/__tests__/shots.test.ts`, `public/pp4/clips/<raw>_<t>.mp4`

**Interfaces:**
- Produces: `Shot = {raw: string; t: number; speed?: number; zoom?: number; focusX?: number; focusY?: number; detail?: boolean; file: string}`; `SHOTS: Record<DesignId, {shape: ShapeId; panels: [Shot, Shot, Shot]}>`; `CLIMAX: Shot[]` (6, ORDER); `validateShots(): string[]`.

- [ ] Step 1: on the Mac, per raw: stamped contact sheet every 0.5 s from 2.0 s; shake score = median absolute frame difference of a centred 25 % crop per 0.25 s window. Stage sheets + scores; pick per design 2 model shots + 1 detail + 1 climax face shot obeying Global Constraints (look at the sheets).
- [ ] Step 2: tests: `validateShots()` returns [] ; a fabricated shot at t=1.0 returns an error; overlap of two shots in one raw returns an error; `zoom 1.5` returns an error; each design has exactly one `detail: true`.
- [ ] Step 3: implement `shots.ts` + validator (life per panel from the timeline: panel k lives `DESIGN_BEATS - k` beats + sweep overlap 1.5 beats).
- [ ] Step 4: on the Mac cut each shot range (t-0.1 to end+0.3) at 1080x1920 60 fps with the grade, `-c:v libx264 -crf 14`, one per call; stage to `public/pp4/clips/`. Tests pass.
- [ ] Step 5: commit `pp4: shots, validator, graded clip list` (clips gitignored).

### Task 4: Design block with flower transitions

**Files:**
- Create: `src/pp4/components/Bloom.tsx` (`BloomSweep`, `BloomAccent`), `src/pp4/components/NameCard.tsx`, `src/pp4/layout.ts` (Joy Club shapes A, B, C, H, I + one more 3-panel shape `K` mirrored C), `src/pp4/DesignBlock.tsx`

**Interfaces:**
- Consumes: `units(d)`, `SHOTS`, `ShapePanels` (copied from Joy Club `Panels.tsx`, src from `shot.file`).
- Produces: `<BloomSweep design={DesignId} origin={'center'|'bl'|'tr'|'bottom'} dur={number} mode={'cover'|'reveal'} />` (incoming design's units bloom to 2.1x from origin, fill the frame with the design bg behind them at cover; reveal shrinks to 0); `<BloomAccent design corner={'tr'|'bl'} />` (5 units spring in 8 f apart, sway, shrink out); `<NameCard design />` (white rounded card bottom-left, 520x200, radius 36, soft shadow, name in design accent colour).
- Block: panels enter beats 0, 1, 2; name card at beat 0.5; accent at beat 1.5 in the corner away from faces; sweep cover over the last 1.5 beats, reveal starts 3 frames early.

- [ ] Step 1: stills test script `node scripts/stills.mjs out/t4 PetalPop4Launch pearl3:<f> dusty-sweep:<f>` renders without error.
- [ ] Step 2-3: implement components; origins rotate per transition (bottom, centre, bl, tr, centre, bottom).
- [ ] Step 4: look at stills: faces inside panels, card not on a face, sweep covers 100 % of the frame at its peak (check the cover frame has no footage pixels).
- [ ] Step 5: commit `pp4: design blocks, bloom sweep, name card`.

### Task 5: Intro, climax, end cards, SFX

**Files:**
- Create: `src/pp4/components/EndCards.tsx` (`ComingSoon`, `PetalPopLogo`, `NafesaFade`), `src/pp4/PetalPop4Launch.tsx`, `scripts/sfx.py` (copied), `public/pp4/sfx-*.wav`, `public/pp4/logo-nafesa-putih.png`

**Interfaces:**
- Intro: Pearl Grey units bloom from the centre on its bg (0-2 beats), then become the first sweep reveal.
- Climax: 6 vertical strips (`stripPanels(6)`), entering every half beat, frontal faces same level.
- `ComingSoon`: Black Dahlia bg, letters C O M I N G / S O O N pop one per half beat (scale 0->1 + rise 30 px + fade, `transform-box: fill-box`), small light Black Dahlia blooms open around; 2.5 beats then the flower circle (ring of mixed Drop 4 units, diameter ~760) blooms and the logo letters pop one per half beat inside it (logo white).
- `NafesaFade`: black bg, white NAFESA logo opacity 0->1 over 0.8 s, nothing else; song fades out in the last 0.5 s.
- SFX at -18 dB: pop-kecil per panel entry and per letter, pop per name card, whoosh per sweep.

- [ ] Step 1-3: implement; `npx tsc --noEmit`, `npx vitest run` pass.
- [ ] Step 4: still at every segment; audio peak check of a 3 s preview render < -1 dB.
- [ ] Step 5: commit `pp4: intro, climax, coming soon, logo, NAFESA, sfx`.

### Task 6: Storyboard for Nas

- [ ] Step 1: ~20 stills (intro, each design 3-panel full, name card, each sweep at cover, climax, coming soon mid/full, logo mid/full, NAFESA) via `scripts/stills.mjs`.
- [ ] Step 2: `python3 scripts/storyboard.py` -> `storyboard-pp4-v1.png` with Malay captions + times; copy to `/mnt/project-files/petal-pop-4/teaser-16x9/` and Nas's Mac `PETAL POP 4/`.
- [ ] Step 3: push branch, draft PR, send storyboard. Stop and wait for "render".
