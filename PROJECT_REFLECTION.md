## Project summary - Blobby adventure 

This platformer expanded beyond a basic p5.js exercise into a miniature systems project. 
### Key extensions implemented: 
Added all 3 extensions cited in the assignment
1. Added sounds effects and looping music
2. Used the factory pattern to create platforms 
3. Created enemies in the form of worms that when crushed makes the character loose a life

### Most complex / difficult parts:

There are a lot of different parts and algorithms in this codebase that i found difficult to implement.
1. By far the most difficult feature to implement was the algorithm/s to procedurally generate teh world and almost all its entities (every game is different) using procedural world resizing (2-5× canvas) with density scaling.
2. The multi‑layer parallax ecosystem (hills, clouds, three tree depths, mountains) tied to a noise‑smoothed wind effect that gently moves trees and the other flora.
3. Platform generation with reachability & spacing constraints
4. Worm critter hazard with life penalty and splash effect
5. HUD elements

##### also ...

- Rejection‑sampling platform & canyon placement without overlaps while preserving jump reach.
- Balancing decorative density (trees / grass / flowers) to avoid visual noise yet keep the world alive.
- Precise yet forgiving platform collision (vertical snap tolerance, drop-through countdown) and canyon plummet gating only when grounded.
- Maintaining deterministic feel while injecting subtle variation (per‑worm parameters, coin pulse, particle fades) (took a long time to perfect it).

### Skills learned / practiced:
I've been working for years as a software developer so the key concepts were already part of my skills, that said i centered my effort to apply more complex algorithms and math i am now learing in the school math module

- Procedural content generation heuristics (spacing, exclusion zones, probabilistic soft rejections) and performance guarding with bounded attempt loops.
- Lightweight physics integration (velocity + gravity) and stateful animation posing.
- Parallax layering & environmental motion for depth.
- Particle system design (lifespans, normalized progress, reverse iteration pruning).


Leonardo Tocchet