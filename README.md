# Platformer Game (p5.js)

A side‑scrolling mini platformer built with vanilla p5.js + ES modules. The codebase focuses on clear separation of concerns, lightweight entity classes, and a factory pattern to centralize object creation.

## High‑Level Architecture

Modules:
- `constants.js` – Core numeric constants and a single shared mutable `state` object.
- `entities.js` – Simple data classes (`GameCharacter`, `Collectible`, `Canyon`, `Platform`, `FlagPole`) plus the `factory` object that constructs entities and plain value objects (trees, rocks, flowers, grass, worms, mountains, clouds wrapper).
- `world.js` – Pure rendering helpers for background & decorative elements. No game logic; it reads from `state` to draw.
- `character.js` – Pose / sprite rendering functions (no state mutation beyond reading `state.gameChar`).
- `gameplay.js` – Input handling, physics (gravity & collision), scoring, HUD, death / win sequences.
- `main.js` – p5 lifecycle (`setup`, `draw`), procedural level generation, and high‑level orchestration.

Data Flow:
1. `main.js` seeds / regenerates world content via `factory` helpers and populates arrays inside `state`.
2. Each animation frame: `draw()` updates camera & wind, delegates rendering to world + character + HUD functions.
3. Interaction (collecting, falling, winning) mutates `state`, which subsequent frames read.

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
- Gravity integration uses a vertical velocity (`vy`) accumulated by `GRAVITY_ACCEL` each frame.
- Platform landing detection uses horizontal overlap + vertical proximity tolerance, with a drop‑through window (`dropThroughFrames`).

Camera:
- Simple horizontal follow: centers on the character but clamps to world bounds.

Parallax & Wind:
- Subtle parallax factor for mountains; clouds & decorations sway using a noise‑evolved `windValue` stored in `state`.

HUD:
- Lives and score drawn in world space with camera compensation. (Could be moved post-translation as a future simplification.)

Procedural Generation Highlights:
- Spacing rules ensure canyons don't crowd each other or the flag area.
- Optional second platform layer with probability weighting.
- Environmental decoration (trees, rocks, flowers, grass, worms) uses probabilistic placement + minimal spacing heuristics.

## Skills Practiced (first‑person, as the developer)
- Modular ES6 design: Broke the game into cohesive modules with clear responsibilities.
- Factory pattern: Centralized entity creation to reduce coupling and prepare for scaling (e.g., adding new entity attributes without touching generation code everywhere).
- Procedural generation: Implemented spacing heuristics, probabilistic placements, and avoidance regions (safe spawn, flag pole exclusion, canyon overlap constraints).
- Basic physics integration: Replaced ad‑hoc jump with velocity + acceleration model for smoother motion.
- State management: Consolidated mutable game state into a single exported `state` object to simplify debugging.
- Rendering layering & parallax: Ordered draw calls to achieve depth while keeping code straightforward.
- Micro performance considerations: Avoided unnecessary object allocations inside frame loops (e.g., pre-existing arrays mutated in place, small value objects for scenery).
- Code readability & maintainability: Added descriptive comments, consistent naming, and removed implicit logic duplication.

## Running
Open `index.html` in a local static server (or directly if your browser allows local audio). The p5 scripts are included locally under `libraries/`.