# Project Reflection

This platformer expanded beyond a basic p5.js exercise into a miniature systems project. Key extensions implemented: procedural world resizing (2–5× canvas) with density scaling; multi‑layer parallax ecosystem (hills, clouds, three tree depths, mountains) tied to a noise‑smoothed wind field; platform generation with reachability & spacing constraints (bridge-first strategy + layered adjacency); worm critter hazard with life penalty and splash effect; celebratory particle bursts & drip-feed confetti; non-blocking music toggle (volume mute strategy) plus start screen fade sequencing; and a factory pattern unifying construction of all entities for future extensibility.

Most complex / difficult parts:
- Rejection‑sampling platform & canyon placement without overlaps while preserving jump reach.
- Balancing decorative density (trees / grass / flowers) to avoid visual noise yet keep the world alive.
- Wind system influencing heterogeneous elements (cloud bob, foliage sway, grass lean) without jitter (lerp smoothing + per‑element scaling).
- Precise yet forgiving platform collision (vertical snap tolerance, drop-through countdown) and canyon plummet gating only when grounded.
- Maintaining deterministic feel while injecting subtle variation (per‑worm parameters, coin pulse, particle fades).

Skills learned / practiced:
- Modular ES module architecture & centralized mutable state design.
- Factory pattern for decoupling generation logic from constructors and enabling test stubbing.
- Procedural content generation heuristics (spacing, exclusion zones, probabilistic soft rejections) and performance guarding with bounded attempt loops.
- Lightweight physics integration (velocity + gravity) and stateful animation posing.
- Parallax layering & environmental motion for depth.
- Audio UX (non-destructive mute, varied SFX rate) and UI feedback (fades, pulses, hover states).
- Particle system design (lifespans, normalized progress, reverse iteration pruning).
- Progressive documentation and refactoring for readability (descriptive variable renames, commentary alignment with `README.md` & `TECH_NOTES.md`).
