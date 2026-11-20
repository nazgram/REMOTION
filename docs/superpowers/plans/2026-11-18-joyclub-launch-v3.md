# Joy Club Launch v3 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Joy Club v3 launch video (1920x1080, 45s, Snap Back) in Remotion. Milestone 1 is a storyboard of still frames for Nas. Milestone 2 is the full render after Nas picks the footage.

**Architecture:** This is a new composition `JoyClubV3` in the existing Remotion project `joyclub-launch-16x9/`, under `src/v3/`; draft 2 stays untouched. All timing comes from detected beats in `public/v3/beats.json`. Shot choices live in one data file (`shots.ts`), so Nas's picks change data and not code. Pure logic (beat lookup, panel rects, timeline) is unit tested with vitest. Visuals are checked with `remotion still` frames.

**Tech Stack:** Remotion 4.0.300, React 18.3.1, TypeScript 5.6.3, vitest 2.1.8 (dev), Python librosa (beat detection), ffmpeg, Chromium at /opt/pw-browsers (already set in remotion.config.ts).

**Spec:** `docs/superpowers/specs/2026-11-18-joyclub-launch-v3-design.md`

## Global Constraints
- Output 1920x1080, 60fps, max 45.0s. Song = Snap Back 2:05.556–2:50.556 (ends naturally).
- Design order: PEARL → SKY → BLUSH → RUBY → SILVER. Names in Poppins Bold, uppercase, plus "JOY CLUB COLLECTION" small below.
- Colours: PEARL #ffffff/#a0c4e1 · SKY #a0c4e1/#b11f24 · BLUSH #d1bdc1/#738476 · RUBY #b11f24/#a0c4e1 · SILVER #d8d8d8/#5c484d · olive #545e3a · cream #f5f0e6.
- No zoom pulse or heartbeat on footage. Motion (scale) on circles only. Slow motion no slower than 50%.
- Panels fill the screen edge to edge, with a 4px white divider. 3 panels = 640 wide, 2 panels = 960 wide, climax 5 panels = 384 wide.
- Text and logos stay inside the central 90% (54px margin top and bottom).
- JOY CLUB logo on the SILVER pattern background with "AVAILABLE NOW" below. NAFESA card = olive logo (Logo_Nafesa-02) on cream, plus olive/tan circles and a fine dot pattern.
- No AI generation. No tagline other than "AVAILABLE NOW". Strip the NAFESA wordmark from the SVG patterns.
- Media is gitignored (`public/v3/`).

## Review Focus
- A beat list with jitter (108–111 BPM): cuts must snap to the nearest detected beat, not to a fixed grid. Test `nearestBeat` handles times before the first beat and after the last one.
- A shot timestamp past the end of a design's raw block (e.g. SILVER ends at 64.2s): it would show the black gap or the next design. Test `validateShots` rejects any shot whose `t + duration` leaves its design's block.
- Slow motion below 50%: test `validateShots` rejects `speed < 0.5`.
- Text near the bottom edge on the LED: the still check for the name frame confirms the name's bounding box sits inside y∈[54,1026].
- The SVG wordmark leaking into the dot sweep: the still check for the sweep frame shows no "NAFESA" text.

---

### Task 1: Assets and beats

**Files:**
- Create: `joyclub-launch-16x9/scripts/fetch_v3.sh`, `joyclub-launch-16x9/scripts/beats.py`, `joyclub-launch-16x9/scripts/patterns.mjs`
- Modify: `joyclub-launch-16x9/.gitignore` (add `public/v3/`)
- Output: `public/v3/{vertical.mp4,landscape.mp4,song.m4a,beats.json,typo1.png,typo2.png,nafesa-olive.png,Poppins-Bold.ttf,pattern-<design>.png}`

**Interfaces:**
- Produces: `beats.json` = `{ "bpm": number, "beats": number[] }`, where beats are seconds on the **video** timeline (song time − 1.0), restricted to 0–45. Pattern PNGs are 1920x1920 tiles cropped from the centre of each SVG (no corner wordmark), named `pattern-pearl.png`, `pattern-sky.png`, `pattern-blush.png`, `pattern-ruby.png`, `pattern-silver.png`.

- [ ] **Step 1:** Write `fetch_v3.sh`, which curls each Drive ID (from the spec's §8 source list and the folder listing) into `public/v3/`. The song is trimmed with `ffmpeg -ss 1 -t 45 -c:a aac`. Run it. Expected: every file listed above exists and is non-empty.
- [ ] **Step 2:** Write `beats.py` (librosa `beat_track` on song.m4a), which writes `beats.json`. Run it. Expected: a monotonic list with gaps of 0.50–0.60s.
- [ ] **Step 3:** Write `patterns.mjs`, which uses Playwright Chromium to render each SVG's centre region (viewBox crop 640–2600) to a 1920 PNG. Run it and view one PNG. Expected: dots only, no wordmark.
- [ ] **Step 4:** Confirm the camera sync: grab vertical and landscape frames at 30.0s and 95.0s and view them side by side. Expected: same pose. Record the offset in `src/v3/designs.ts` as `CAMERA_OFFSET = 0` (or the measured value).
- [ ] **Step 5:** Commit the scripts and .gitignore.

### Task 2: Timing and layout logic (TDD)

**Files:**
- Create: `src/v3/designs.ts`, `src/v3/beats.ts`, `src/v3/layout.ts`, `src/v3/timeline.ts`, `src/v3/shots.ts`
- Test: `src/v3/__tests__/logic.test.ts`
- Modify: `package.json` (devDep vitest 2.1.8, script `"test": "vitest run"`)

**Interfaces:**
- `designs.ts`: `type DesignId = 'pearl'|'sky'|'blush'|'ruby'|'silver'`. `DESIGNS: Record<DesignId,{name:string; bg:string; dot:string; accents:string[]; block:[number,number]}>`, with blocks from the spec §3 (pearl [90.3,107.9], sky [0,20.4], blush [24.1,47.4], ruby [67.0,87.7], silver [50.1,64.2]). `ORDER: DesignId[]`.
- `beats.ts`: `nearestBeat(t:number, beats:number[]):number` and `beatAt(i:number, beats:number[]):number` (extrapolates with the median gap past either end).
- `layout.ts`: `panelRects(n:2|3|5, gap=4): {x:number;w:number}[]`, which covers exactly 0–1920.
- `timeline.ts`: `buildTimeline(beats:number[]): Segment[]`, where `Segment = {kind:'intro'|'design'|'climax'|'joyclub'|'nafesa'; design?:DesignId; start:number; end:number; bars:{start:number;end:number}[]}`. Uses bar = 4 beats; intro 2 bars, 5 designs × 3 bars, climax 1 bar, joyclub 1 bar, nafesa to 45.0.
- `shots.ts`: `type Shot = {cam:'v'|'l'; t:number; dur:number; speed?:number; focusY?:number}`. `SHOTS: Record<DesignId,{grid3:Shot[]; grid2:Shot[]; detail:Shot}>` (placeholder picks), `CLIMAX: Shot[]`. `validateShots(): string[]` returns the error messages.

- [ ] **Step 1: Write failing tests**
```ts
test('panelRects covers frame', ()=>{ for (const n of [2,3,5] as const){ const r=panelRects(n); expect(r[0].x).toBe(0); expect(r.at(-1)!.x+r.at(-1)!.w).toBe(1920); }});
test('panelRects 3 gaps are 4px', ()=>{ const r=panelRects(3); expect(r[1].x-(r[0].x+r[0].w)).toBe(4); expect(Math.abs(r[0].w-r[2].w)).toBeLessThanOrEqual(1); });
test('nearestBeat clamps', ()=>{ const b=[0.5,1.05,1.6]; expect(nearestBeat(0,b)).toBe(0.5); expect(nearestBeat(1.3,b)).toBe(1.05); expect(nearestBeat(9,b)).toBe(1.6); });
test('timeline order and end', ()=>{ const tl=buildTimeline(fakeBeats(0.55)); expect(tl.filter(s=>s.kind==='design').map(s=>s.design)).toEqual(['pearl','sky','blush','ruby','silver']); expect(tl.at(-1)!.end).toBe(45); });
test('validateShots rejects out-of-block and slow', ()=>{ /* inject a bad shot: silver t=63,dur=3 and speed 0.4 → two errors */ });
test('placeholder shots valid', ()=>{ expect(validateShots()).toEqual([]); });
```
- [ ] **Step 2:** Run `npx vitest run`. Expected: FAIL (modules missing).
- [ ] **Step 3:** Implement the five files with the signatures above. `validateShots` takes an optional shots argument so the test can inject bad data. Placeholder shots are picked from the contact sheets inside each block.
- [ ] **Step 4:** Run `npx vitest run`. Expected: all pass.
- [ ] **Step 5:** Commit.

### Task 3: Visual components

**Files:** Create `src/v3/components/{Panels.tsx,Circles.tsx,DotSweep.tsx,Cutout.tsx,NameCard.tsx,EndCards.tsx}`

**Interfaces (all consume `designs.ts`, `layout.ts`, `shots.ts`):**
- `<Panels n={2|3|5} shots={Shot[]} />`: vertical clips cover each rect, using `focusY` and `speed` (playbackRate). No scale animation apart from a ≤3% drift.
- `<FullLandscape shot={Shot} />`: the B match-cut frame.
- `<Circles items={{x,y,d,color,inBeat,outBeat}[]} beats />`: each circle scales 0→1.1→1 at `inBeat`, breathes 0.9–1.15, and scales to 0 at `outBeat`.
- `<DotSweep design progress />`: the pattern tile revealed by growing dot clusters from the frame edges until it covers the screen, then opening onto the next grid. It must not be a single centred circle.
- `<Cutout shapes progress>`: shapes aligned to panel lines (draft 2 approach: `clip-path: path()` union).
- `<NameCard design />`: name + "JOY CLUB COLLECTION", inside the safe area.
- `<JoyClubEnd />` (silver pattern bg softened to ~35% contrast, the typo1 logo, "AVAILABLE NOW") and `<NafesaEnd />` (cream, olive logo, olive/tan circles, fine dots).

- [ ] **Step 1:** Implement the components.
- [ ] **Step 2:** Run `npx tsc --noEmit`. Expected: no errors.
- [ ] **Step 3:** Commit.

### Task 4: Composition and storyboard stills (Milestone 1)

**Files:** Create `src/v3/JoyClubV3.tsx`, `scripts/storyboard.py`. Modify `src/Root.tsx` (add `<Composition id="JoyClubV3" fps={60} … />`).

- [ ] **Step 1:** Assemble the timeline from `buildTimeline` with the components, plus the audio and SFX placeholders (silent until Milestone 2).
- [ ] **Step 2:** Render about 14 stills with `npx remotion still src/index.ts JoyClubV3 out/v3/st_<label>.jpg --frame=<f>`, one per key moment: intro circles, sweep mid, 3-panel, name moment, cutout mid, 2-panel, landscape detail, speed-ramp point, the next design's sweep, climax, JOY CLUB end, NAFESA end.
- [ ] **Step 3:** `storyboard.py` tiles them with labels (time, bar, what happens) into `/mnt/project-files/joy-club/launch-16x9/storyboard-v3.png`. View it and check the Review Focus items (safe area, no wordmark).
- [ ] **Step 4:** Make the numbered contact sheets per design (vertical + landscape, 1 thumbnail/s with timestamps) at `/mnt/project-files/joy-club/launch-16x9/v3-contact/`.
- [ ] **Step 5:** Commit and push. Send the storyboard and contact sheets to Nas.

### Task 5: Full render (Milestone 2, after Nas's picks)

- [ ] **Step 1:** Put Nas's picks into `shots.ts` and run `npx vitest run` (validateShots must pass).
- [ ] **Step 2:** Generate the SFX (pop and whoosh, low level) and mix them at −18 dB below the song.
- [ ] **Step 3:** Render 60fps to `out/joyclub-launch-v3.mp4` in the background, with a timeout ≥ 60 min. Verify with ffprobe (1920x1080, 60fps, ≤45.05s, audio present).
- [ ] **Step 4:** Copy to project files, commit, push, and send to Nas.
