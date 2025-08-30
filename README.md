# Platformer Game (p5.js)

A side‑scrolling mini platformer built with vanilla p5.js + ES modules. The codebase focuses on clear separation of concerns, lightweight entity classes, and a factory pattern to centralize object creation.

## High‑Level Architecture

Modules:
- `constants.js` – Core numeric constants and a single shared mutable `state` object (wind, camera, arrays of entities, flags for start screen & music, etc.).
- `entities.js` – Lightweight data classes plus the `factory` (central creation point for all game objects & simple value objects).
- `world.js` – Pure rendering helpers for ground / scenery / hazards / platforms / critters. Contains no progression logic.
- `character.js` – Pose rendering (animation variants) for the player character.
- `gameplay.js` – Input mapping, physics integration (gravity, jump, drop‑through platforms), scoring, win/lose checks, particle spawning on win.
- `hud.js` – Screen‑space UI (lives, score, music toggle button, start screen overlay, win/lose banners).
- `main.js` – p5 lifecycle (`setup`, `draw`), procedural generation pipeline, camera update, and orchestration of per‑frame steps.

See `TECH_NOTES.md` for deeper implementation details.

Data Flow (Frame Loop):
1. `main.js` (on restart / setup) generates content via `factory.*` and stores it in `state` arrays.
2. Each `draw()` frame updates ambient wind + camera, then draws: ground -> translated world scenery -> interactive elements -> particles -> pops translation -> HUD (pure screen coordinates).
3. Gameplay logic (collect / canyon / worm collision / death / win) mutates `state`. Rendering reads `state` only (no side effects in draw helpers).
4. Audio: music volume toggled (mute strategy) without stopping playback for instant resume.

## Factory Pattern Usage

The factory pattern is implemented through a single exported `factory` object in `entities.js`:
```js
export const factory = {
  platform: (x, y, w, h, level) => new Platform(x, y, w, h, level),
  canyon: (x, w) => new Canyon(x, w),
  collectible: (x, y, size) => new Collectible(x, y, size),
  flagPole: (x, y) => new FlagPole(x, y),
  gameChar: (floorY) => new GameCharacter(width / 2, floorY),
  tree: (x) => ({ x }),
  rock: (x, size) => ({ x, size }),
  flower: (x, height, colorIndex) => ({ x, height, colorIndex }),
  grassTuft: (x, height) => ({ x, height }),
  worm: (x, y, segmentCount, dir, speed, phase) => ({ x, y, segmentCount, dir, speed, phase }),
  mountain: (x_pos, width) => ({ x_pos, width }),
  clouds: (coords) => generateClouds(coords)
};
```
Benefits:
- Central construction point: if a constructor signature changes (e.g. adding friction to `Platform`), only the factory changes.
- Encapsulates randomness (e.g. `randomCollectible`) to keep level generation code concise.
- Simplifies testing: generation code can be stubbed by replacing selected factory functions.
- Uniform naming: all creation uses `factory.*` to improve searchability.

### Platforms Via Factory
Platforms were originally created with `new Platform(...)`. They now use:
```js
state.platforms.push(factory.platform(pX, firstLayerY, pWidth, 12, 0));
```
Every platform (including additional random ones) uses this factory call. No direct `new Platform` calls remain outside `entities.js`.

## Notable Implementation Details

Physics:
- Gravity integration via vertical velocity (`vy`) + constant `GRAVITY_ACCEL`.
- Jump sets `vy` negative; falling state toggled when `vy > 0` while above floor.
- Platform landing: O(n) scan with horizontal overlap & small vertical tolerance; a short `dropThroughFrames` window lets the player intentionally fall through.
- Canyon plummet: only triggers when horizontally over a canyon AND on/near floor, avoiding false triggers mid‑jump.

Platforms (Generation Rules):
- Layer 0: bridge wide canyons first to guarantee traversability, then add sparse extras with minimum spacing & spawn/flag exclusion zones.
- Layer 1: optional side platforms placed adjacent (left OR right) to a base platform, never horizontally overlapping any existing platform, and only if horizontally reachable (<= safe jump reach constant). This keeps silhouettes clean and navigation readable.

Worms:
- Small ground critters with sinusoidal segmented bodies. If the player runs over one on the ground, the worm is squished: splash particles + sound + player loses a life (the start screen warns: "Don't kill the worms!"). Accidental kills add tension to ground traversal.

Start Screen & Music:
- Game begins paused behind a start overlay (instructions + warning) until first key press / click.
- Music loads silently; unmuted playback starts after dismissing screen if enabled.
- Music toggle (button or M key) mutes/unmutes by volume (does not stop) for seamless resume.

Wind & Parallax:
- A noise‑driven `windValue` animates scenery sway (trees, flowers, grass) + subtle cloud bobbing.
- Mountains & hills apply low parallax factors for depth; clouds wrap horizontally relative to camera for continuous sky.
 - Three tree layers for depth:
   - Layer 3 (far): sparse, smallest scale, slow parallax (≈0.06), drawn behind mountains & clouds.
   - Layer 2 (mid): moderate count, medium scale, parallax (≈0.10), in front of mountains, behind foreground.
   - Layer 1 (foreground): dense, full detail, no parallax (locked to ground).
   Each distant tree stores a per‑tree `scale` controlling height & sway (reduced sway at distance). X offset = `cameraPosX * factor`.

Particles:
- Win: initial celebratory burst + periodic dribble effect until end screen.
- Worm splash: expanding ring + radial particles with fade & lifespan.

Camera:
- Simple horizontal follow: centers on the character but clamps to world bounds.

Parallax & Wind:
- Subtle parallax factor for mountains; clouds & decorations sway using a noise‑evolved `windValue` stored in `state`.

HUD:
- Drawn after camera translation is popped (true screen space). This prevents input hitbox mismatches (e.g., music toggle reliability fix) and avoids repeated camera offsets.

Procedural Generation Highlights:
- Canyons: rejection sampling with minimum gap + flag safety margin.
- Platforms: deterministic bridging first; extras & secondary layer respect spacing / reach invariants.
 - Trees: foreground layer uses soft clustering with hard/soft radii; mid & far layers generated separately at fractional counts (e.g. ~35% & ~18% of foreground) with wider spacing + per‑tree scale.
- Decoration (rocks, flowers, grass): density scales with world width using capped attempt loops to avoid infinite retries.
- Worms: random ground spawn excluding safe zones & canyon spans; parameter randomization for movement variety.
- Collectibles: chance on platforms + limited ground collectibles pre‑flag to encourage forward motion.

## Controls
Keyboard (WASD & Arrows supported):
- Left / A: move left
- Right / D: move right
- Up / W / Space: jump
- Down / S: drop through platform (briefly disables landing collisions)
- M: toggle music mute/unmute
- R: restart after win / game over

Mouse:
- Click music button (top‑right) to mute/unmute.
- Click restart button on win / game over banners.

## Skills Practiced (first‑person, as the developer)
- Modular ES module architecture & separation of concerns.
- Factory pattern for consistent object creation & future extensibility.
- Procedural generation with layered constraints (reachability, spacing, exclusion zones).
- Physics & collision simplification (tolerant landing, drop‑through mechanic, plummet state).
- Audio UX: non‑destructive mute strategy to avoid restart latencies.
- Particle & small animation systems (win burst, worm splash, wind sway) optimizing for readability.
- State centralization + minimal object churn for performance.
- Documentation: progressive commenting + deep dive in `TECH_NOTES.md`.

## Running
Open `index.html` via a local static server (recommended so audio loads reliably). All p5 libraries are bundled under `libraries/`.

Optional quick static server examples:
- VS Code Live Server extension
- Python: `python -m http.server` (then browse to http://localhost:8000)

## Further Technical Details
For deeper explanations (generation algorithm step order, particle lifecycle, wind math, performance considerations, and extension ideas) see `TECH_NOTES.md`.