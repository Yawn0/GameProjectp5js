# TECH_NOTES

Deep‑dive into systems, algorithms, and extension points.

## 1. State Object Shape
`state` (from `constants.js`) centralizes ALL mutable runtime data:
- Scalar: `cameraPosX`, `windPhase`, `windValue`, `gameScore`, `lives`, `startScreenFade`.
- Flags: `showStartScreen`, `musicEnabled`.
- References: `gameChar`, `flagPole`, `sound` (sound buffers), `_musicBtn` (HUD hitbox cache).
 - Collections: `canyons`, `platforms`, `collectables`, `trees` (fg), `trees2` (mid), `trees3` (far), `rocks`, `flowers`, `grassTufts`, `worms`, `splashes`, `particles`, `clouds`, `mountains`, `hills`.
- Win / Lose staging: `winFrame`, `loseFrame` (frame indices stamping timeline events).

Rationale: a single mutable bag simplifies debug (inspect in console) and avoids circular imports.

## 2. Procedural Generation Pipeline (`main.js`)
Order matters to enforce invariants:
1. Clear arrays.
2. Derive spawn safe zone + flag safety margins.
3. WORLD WIDTH: randomly chosen each start: `WORLD_WIDTH = CANVAS_WIDTH * randomInt[2,5]`.
4. CANYONS: rejection sampling with spacing + flag exclusion.
4. PLATFORMS Layer 0: mandatory canyon bridges → sparse extras (respect safe/flag + spacing).
5. PLATFORMS Layer 1: adjacency placement. Constraints:
   - Choose random base L0 platform.
   - Random side (left/right) + gap in [MIN_GAP_ADJ, MIN_GAP_ADJ+60].
   - Clamp into world; compute min horizontal separation to ANY first-layer platform (reachability test).
   - Reject if unreachable (`nearestFirst.dist > MAX_REACH_HORIZONTAL`).
   - Reject if overlaps any existing platform horizontally (strict non-overlap -> cleaner silhouettes).
6. COLLECTIBLES: probabilistic (25%) on platforms + limited ground ones (avoid canyons + safe zone) before flag.
7. TREES (Layer 1 foreground): probabilistic soft clustering; density scaled down (higher divisor) for clearer playfield; two-tier rejection (hard radius < 0.5*gap, soft radius with probability) creates organic clumps.
   Mid (Layer 2) & Far (Layer 3) Trees: generated afterward using fractional target counts (e.g. ~0.35 & ~0.18 of foreground total). Each stores `{ x, scale }` (scale adjusts trunk & canopy size and further damps wind sway). Wider spacing & simpler acceptance (no soft clustering) keeps distant silhouettes readable.
   Layer ordering tweak: far layer (3) now rendered after mountains/clouds so silhouettes sit visually closer.
8. ROCKS / FLOWERS / GRASS: simple spacing & exclusion zones. Attempt limits scale with target count.
9. WORMS: ground critters (avoid canyons, safe zone) with randomized per‑worm parameters.
   Additional exclusion: finish flag safe band both at spawn and during movement (movement code clamps & reverses when entering band) so end-game area remains hazard‑free.

Attempt Counters: each while loop is bounded (e.g. `* 20` multiplier) preventing infinite loops when space saturates.

## 3. Platform Collision (Simplified)
- Character treated as vertical point (y) + horizontal half-width.
- Landing condition: horizontal overlap && |y - platformTop| < tolerance && character above platform.
- Pros: simple & fast.
- Cons: no edge forgiveness when moving up into platform undersides (acceptable for this game).

Potential Extension: introduce capsule (circle) collision for smoother edge slides.

## 4. Jump & Gravity
Physics integration keeps only vertical velocity `vy`:
```
vy += GRAVITY_ACCEL;
y  += vy;
```
Jump sets `vy = -JUMP_VELOCITY` and sets `isFalling = true` until vy crosses zero and the character starts descending.

## 5. Drop-Through Platforms
`dropThroughFrames` countdown disables landing checks temporarily, allowing intentional descent by pressing Down. A slight +y nudges below platform on activation.

## 6. Canyon Plummet
Checks only if character is both:
- Horizontally within canyon span.
- Standing on (or at) floor Y.
This prevents triggering mid‑air. Once plummeting: horizontal movement halts; constant `PLUMMET_SPEED` applied.

## 7. Worm System
Data: `{ x, y, segmentCount, dir, speed, phase }`.
Render: each frame `phase += 0.15`; segments spaced by constant; `sin(phase - index * 0.6)` yields traveling wave.
Collision: simple proximity when player near ground (`abs(y - floor) < threshold`) + horizontal distance < 20 → life penalty + splash + sound.
Design Intent: Encourage careful jumping; ground rushing risks accidental worm kills.

Possible Enhancements:
- Temporary invulnerability after worm squish.
- Bonus for avoiding worms entirely.
- Flee response: worms reverse or dive underground when player close.

## 8. Splash & Win Particles
Splash: 10 radial particles (precomputed lazily) + expanding ring. Life normalized param `t` drives radius + fade.
Win: initial burst (120) + periodic spawn every 5 frames; simple Euler integration with mild gravity.

Optimization: particle arrays shrink in-place (reverse iteration) avoiding churn of new arrays.

## 9. Wind System
`windPhase` evolves with small delta. Sample either `noise()` (if present) or fallback sine. Mapped to [-1,1] then smoothed via `lerp` into `windValue`.
Consumers (trees, flowers, grass, clouds) multiply by differing scalars for varied movement amplitude. Mid & far tree layers additionally damp sway (e.g. *0.5 or scale‑weighted) to emphasize depth. Parallax X offset applied during draw: `x - cameraPosX * layerFactor` (layerFactor 0 for foreground, ~0.10 mid, ~0.06 far). Far trees drawn in front of mountains/clouds.

## 10. Camera
`cameraPosX = clamp(player.x - canvasW/2, 0, WORLD_WIDTH - canvasW)` except on start screen (locked to 0 to avoid pre‑scroll reveal).
All world drawing occurs inside a `translate(-cameraPosX, 0)`; HUD drawn afterward outside translation.

## 11. Audio Strategy
- All sounds loaded in `setup` with base volume applied.
- MUSIC: volume set to 0 when muted instead of stopping. Keeps decoding & playback active → instant resume.
- Worm death uses slight playback rate variance for organic feel.

Possible Improvement: cross‑fade music changes or dynamic volume scaling with game state.

## 12. Start Screen Fade
`showStartScreen` gate halts gameplay logic; on first key/mouse input → `showStartScreen=false`, `startScreenFade=1`. HUD draws overlay with alpha decaying each frame (handled in `hud.js`).

## 13. Performance Considerations
- Avoid per-frame allocation of arrays / objects inside tight loops (particles & splash reuse simple push/splice strategy).
- Procedural generation only runs on start/reset.
- Light math operations; no expensive per-segment pathfinding.

## 14. Extension Ideas
- Add enemies with patrol + detection cones (reuse worm structure w/ AI state machine).
- Power-ups: double jump (augment jump logic), shield (ignore first worm penalty), magnet (grow collectible pickup radius).
- Time trials: track frameCount deltas between start & finish; scoreboard overlay.
- Dynamic difficulty: scale platform density / canyon width with player performance.

## 15. Testing Hooks
Because creation funnel goes through `factory`, tests could monkey‑patch e.g. `factory.platform` to record parameters or inject deterministic values.

## 16. Asset Considerations
Local audio kept small (WAV for SFX, MP3 for music). Preload ensures ready before first interaction. For large worlds consider lazy streaming or sprite sheets.

---
Last updated: (auto) current feature set including worm penalty + start screen warning.
