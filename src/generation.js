/* Mutates state arrays / WORLD_WIDTH. No rendering here. */
import { CANVAS_WIDTH, FLOOR_HEIGHT_RATIO, WORLD_WIDTH, state, setWorldWidth } from './constants.js';
import { factory } from './entities.js';

/** Build clouds / mountains / hills based on current WORLD_WIDTH */
export function generateBackdrop() {
    state.cloudsCoordinates = [];
    const cloudCount = floor(12 * (WORLD_WIDTH / (CANVAS_WIDTH * 1.5))) + 8;
    for (let i = 0; i < cloudCount; i++) {
        state.cloudsCoordinates.push({ x_pos: random(WORLD_WIDTH), y_pos: random(70, 130) });
    }
    state.clouds = factory.clouds(state.cloudsCoordinates);

    state.mountains = [];
    const mountainCount = floor(8 * (WORLD_WIDTH / (CANVAS_WIDTH * 1.5))) + 4;
    for (let i = 0; i < mountainCount; i++) {
        state.mountains.push(factory.mountain(random(WORLD_WIDTH), random(0.6, 1.3)));
    }

    state.hills = [];
    const hillCount = floor(6 * (WORLD_WIDTH / (CANVAS_WIDTH * 1.5))) + 3;
    for (let i = 0; i < hillCount; i++) {
        state.hills.push(factory.hill(random(WORLD_WIDTH), random(180, 320)));
    }
}

/**
 * Procedurally populate gameplay entities (terrain + interactables)
 * Inputs:
 *   numCollectibles  - baseline collectible count (scaled by world width for ground ones)
 *   numCanyons       - target canyon count (subject to attempt cap & spacing rules)
 *   flagPoleX        - X position reserved for goal; used to keep safe gaps
 * Strategy: rejection sampling with attempt caps, multiple passes per feature layer
 * Invariants enforced:
 *   - Spawn safe zone around player start kept clear of hazards/obstacles
 *   - Canyons & platforms avoid flag area margins
 *   - Spacing / density scales with WORLD_WIDTH via worldScale
 */
export function generateLevelContent({
    numCollectibles = 3,
    numCanyons = 8,
    flagPoleX = WORLD_WIDTH - 150
} = {}) {
    // Reset containers (full rebuild on restart)
    state.collectables = [];
    state.canyons = [];
    state.platforms = [];
    state.rocks = [];
    state.flowers = [];
    state.grassTufts = [];
    state.trees = [];
    state.trees2 = [];
    state.trees3 = [];
    state.worms = [];

    const playerStartX = CANVAS_WIDTH / 2; // visible spawn center
    const SAFE_RADIUS = 150;               // keep this clear of hazards / clutter
    const safeLeft = playerStartX - SAFE_RADIUS;
    const safeRight = playerStartX + SAFE_RADIUS;

    // Canyon generation --------------------------------------------------
    const MIN_CANYON_GAP = 140;
    const MIN_CANYON_WIDTH = 60;
    const MAX_CANYON_WIDTH = 140;
    let attempts = 0;
    const worldScale = WORLD_WIDTH / (CANVAS_WIDTH * 1.5); // density scaling factor
    const MAX_ATTEMPTS = 1200 * worldScale; // soft cap to prevent infinite loops
    const FLAG_SAFE_MARGIN = 120;
    while (state.canyons.length < numCanyons && attempts < MAX_ATTEMPTS) {
        attempts++;
        const width = random(MIN_CANYON_WIDTH, MAX_CANYON_WIDTH);
        const x = random(0, WORLD_WIDTH - width);
        const left = x, right = x + width;
        if (right >= safeLeft && left <= safeRight) continue; // spawn safe
        const flagMin = flagPoleX - FLAG_SAFE_MARGIN;
        const flagMax = flagPoleX + FLAG_SAFE_MARGIN;
        const canyonDrawLeft = left - 20;
        const canyonDrawRight = right + 40;
        if (canyonDrawRight >= flagMin && canyonDrawLeft <= flagMax) continue; // near flag
        let tooClose = false;
        for (const existing of state.canyons) {
            const eLeft = existing.x_pos;
            const eRight = existing.x_pos + existing.width;
            if (!(right + MIN_CANYON_GAP <= eLeft || eRight + MIN_CANYON_GAP <= left)) { tooClose = true; break; }
        }
        if (tooClose) continue;
        state.canyons.push(factory.canyon(x, width));
    }

    // Platform layout ----------------------------------------------------
    const firstLayerY = state.floorPosY - 90;
    const secondLayerY = firstLayerY - 70;

    // Fill above large canyons so they become crossings
    for (const can of state.canyons) {
        if (can.width < 90) continue;
        const margin = 20;
        const pX = max(0, can.x_pos - margin);
        const pWidth = min(WORLD_WIDTH - pX, can.width + margin * 2);
        state.platforms.push(factory.platform(pX, firstLayerY, pWidth, 12, 0));
    }

    // Additional first-layer platforms (spacing rules vs. canyons & each other)
    const FIRST_LAYER_EXTRA_TARGET = floor((2 * worldScale) + 3);
    const FIRST_LAYER_MIN_GAP = 140;
    let firstExtrasAttempts = 0;
    while (state.platforms.filter(p => p.level === 0).length < FIRST_LAYER_EXTRA_TARGET + state.canyons.filter(c => c.width >= 110).length && firstExtrasAttempts < 500) {
        firstExtrasAttempts++;
        const w = random(90, 170);
        const x = random(0, WORLD_WIDTH - w);
        if (!(x + w < safeLeft || x > safeRight)) continue;
        const FLAG_PLATFORM_SAFE = 120;
        if (!(x + w < flagPoleX - FLAG_PLATFORM_SAFE || x > flagPoleX + FLAG_PLATFORM_SAFE)) continue;
        let invalid = false;
        for (const can of state.canyons) {
            if (can.width < 90) {
                const cLeft = can.x_pos;
                const cRight = can.x_pos + can.width;
                if (x < cRight && x + w > cLeft) { invalid = true; break; }
            }
        }
        if (invalid) continue;
        for (const platform of state.platforms) {
            if (platform.level !== 0) continue;
            const gap = (x + w) < platform.x_pos ? platform.x_pos - (x + w) : x - (platform.x_pos + platform.width);
            if (gap < FIRST_LAYER_MIN_GAP && gap > -FIRST_LAYER_MIN_GAP) { invalid = true; break; }
        }
        if (invalid) continue;
        state.platforms.push(factory.platform(x, firstLayerY, w, 12, 0));
    }

    // Second-layer platforms: offset from first layer to create simple jumps
    const SECOND_LAYER_TARGET = floor(state.platforms.filter(p => p.level === 0).length * 0.3);
    let secondAttempts = 0;
    const firstLayerPlatforms = () => state.platforms.filter(p => p.level === 0);
    const MAX_REACH_HORIZONTAL = 110;
    const MIN_GAP_ADJ = 20;
    while (state.platforms.filter(p => p.level === 1).length < SECOND_LAYER_TARGET && secondAttempts < 800) {
        secondAttempts++;
        const bases = firstLayerPlatforms();
        if (!bases.length) break;
        const base = random(bases);
        const w = constrain(base.width * random(0.35, 0.65), 60, 140);
        const placeRight = random() < 0.5;
        const gap = random(MIN_GAP_ADJ, MIN_GAP_ADJ + 60);
        let x = placeRight ? base.x_pos + base.width + gap : base.x_pos - gap - w;
        x = constrain(x, 0, WORLD_WIDTH - w);
        const y = secondLayerY;
        const nearestFirst = bases.reduce((acc, p) => {
            const dx = p.x_pos + p.width < x ? x - (p.x_pos + p.width) : p.x_pos > x + w ? p.x_pos - (x + w) : 0;
            return (dx < acc.dist) ? { dist: dx, plat: p } : acc;
        }, { dist: Infinity, plat: null });
        if (nearestFirst.dist > MAX_REACH_HORIZONTAL) continue;
        let overlapsAny = false;
        for (const p of state.platforms) {
            const overlap = !(x + w <= p.x_pos || x >= p.x_pos + p.width);
            if (overlap) { overlapsAny = true; break; }
        }
        if (overlapsAny) continue;
        const FLAG_PLATFORM_SAFE = 120;
        if (!(x + w < flagPoleX - FLAG_PLATFORM_SAFE || x > flagPoleX + FLAG_PLATFORM_SAFE)) continue;
        state.platforms.push(factory.platform(x, y, w, 12, 1));
    }

    // Platform collectibles (25% chance each, avoid near flag)
    for (const p of state.platforms) {
        if (random() >= 0.25) continue;
        const cx = random(p.x_pos + 20, p.x_pos + p.width - 20);
        if (cx >= flagPoleX - 40) continue;
        state.collectables.push(factory.collectible(cx, p.y_pos));
    }

    // Ground collectibles scaled to width (avoid spawn & canyons)
    let groundToPlace = floor(numCollectibles * worldScale);
    let groundAttempts = 0;
    while (groundToPlace > 0 && groundAttempts < 400) {
        groundAttempts++;
        const x = random(flagPoleX - 60);
        if (x >= safeLeft && x <= safeRight) continue;
        let overCanyon = false;
        for (const can of state.canyons) {
            if (x > can.x_pos && x < can.x_pos + can.width) { overCanyon = true; break; }
        }
        if (overCanyon) continue;
        state.collectables.push(factory.collectible(x, state.floorPosY));
        groundToPlace--;
    }

    // Trees (3 parallax layers). Layer 1: collision-scale, 2/3: background silhouettes
    const treeMinGap = 85;
    const treeFlagSafe = 120;
    const TREE_MIN_BASE = 60;
    const TREE_DENSITY_DIVISOR = 110;
    const treeCountTarget = max(TREE_MIN_BASE, floor(WORLD_WIDTH / TREE_DENSITY_DIVISOR));

    let treeAttempts = 0;
    while (state.trees.length < treeCountTarget && treeAttempts < treeCountTarget * 30) {
        treeAttempts++;
        const tree_x = random(WORLD_WIDTH);
        if (tree_x > safeLeft - 40 && tree_x < safeRight + 40) continue;
        if (abs(tree_x - flagPoleX) < treeFlagSafe) continue;
        let overCanyon = false;
        for (const can of state.canyons) {
            if (tree_x > can.x_pos - 30 && tree_x < can.x_pos + can.width + 30) { overCanyon = true; break; }
        }
        if (overCanyon) continue;
        let tooClose = false;
        for (const existingTree of state.trees) {
            const d = abs(existingTree.x - tree_x);
            if (d < treeMinGap * 0.5) { tooClose = true; break; }
            if (d < treeMinGap && random() < 0.6) { tooClose = true; break; }
        }
        if (tooClose) continue;
        state.trees.push(factory.tree(tree_x));
    }
    state.trees.sort((a, b) => a.x - b.x);

    // Layer 2 (smaller; fewer; no close clustering)
    const layer2Target = floor(treeCountTarget * 0.35);
    let t2Attempts = 0;
    while (state.trees2.length < layer2Target && t2Attempts < layer2Target * 40) {
        t2Attempts++;
        const tree_x = random(WORLD_WIDTH);
        if (tree_x > safeLeft - 60 && tree_x < safeRight + 60) continue;
        if (abs(tree_x - flagPoleX) < treeFlagSafe + 40) continue;
        let near = false;
        for (const existing of state.trees2) { if (abs(existing.x - tree_x) < 120) { near = true; break; } }
        if (near) continue;
        state.trees2.push({ x: tree_x, scale: random(0.55, 0.75) });
    }
    state.trees2.sort((a, b) => a.x - b.x);

    // Layer 3 (furthest backdrop)
    const layer3Target = floor(treeCountTarget * 0.18);
    let t3Attempts = 0;
    while (state.trees3.length < layer3Target && t3Attempts < layer3Target * 50) {
        t3Attempts++;
        const tree_x = random(WORLD_WIDTH);
        if (tree_x > safeLeft - 80 && tree_x < safeRight + 80) continue;
        if (abs(tree_x - flagPoleX) < treeFlagSafe + 60) continue;
        let near = false;
        for (const existing of state.trees3) { if (abs(existing.x - tree_x) < 160) { near = true; break; } }
        if (near) continue;
        state.trees3.push({ x: tree_x, scale: random(0.35, 0.5) });
    }
    state.trees3.sort((a, b) => a.x - b.x);

    // Rocks (simple scatter; avoid spawn & canyons)
    const rockTarget = floor(32 * worldScale);
    let rockAttempts = 0;
    while (state.rocks.length < rockTarget && rockAttempts < rockTarget * 20) {
        rockAttempts++;
        const rock_x = random(WORLD_WIDTH);
        if (rock_x > safeLeft - 30 && rock_x < safeRight + 30) continue;
        let overCanyon = false;
        for (const can of state.canyons) { if (rock_x > can.x_pos && rock_x < can.x_pos + can.width) { overCanyon = true; break; } }
        if (overCanyon) continue;
        state.rocks.push(factory.rock(rock_x, random(10, 20)));
    }

    // Flowers (decor; seeded with phase via random integer) avoid canyons & spawn
    const flowerTarget = floor(40 * worldScale);
    let flowerAttempts = 0;
    while (state.flowers.length < flowerTarget && flowerAttempts < flowerTarget * 25) {
        flowerAttempts++;
        const flower_x = random(flagPoleX - 80);
        if (flower_x > safeLeft - 25 && flower_x < safeRight + 25) continue;
        let badPosition = false;
        for (const can of state.canyons) { if (flower_x > can.x_pos - 10 && flower_x < can.x_pos + can.width + 10) { badPosition = true; break; } }
        if (badPosition) continue;
        state.flowers.push(factory.flower(flower_x, random(12, 22), floor(random(1000))));
    }

    // Grass tufts (dense-ish; avoid overlapping) Note: garss_x variable name kept (typo)
    const grassTarget = floor(110 * worldScale);
    let grassAttempts = 0;
    while (state.grassTufts.length < grassTarget && grassAttempts < grassTarget * 30) {
        grassAttempts++;
        const garss_x = random(WORLD_WIDTH);
        if (garss_x > safeLeft - 20 && garss_x < safeRight + 20) continue;
        let overCan = false;
        for (const can of state.canyons) { if (garss_x > can.x_pos - 15 && garss_x < can.x_pos + can.width + 15) { overCan = true; break; } }
        if (overCan) continue;
        let close = false;
        for (const t of state.grassTufts) { if (abs(t.x - garss_x) < 18) { close = true; break; } }
        if (close) continue;
        state.grassTufts.push(factory.grassTuft(garss_x, random(10, 20)));
    }

    // Worm enemies: avoid spawn, flag, and canyons. Params: segments, dir, speed, phase
    const wormCount = floor(6 * worldScale) + 3;
    let wormAttempts = 0;
    while (state.worms.length < wormCount && wormAttempts < wormCount * 40) {
        wormAttempts++;
        const wx = random(WORLD_WIDTH);
        if (wx > safeLeft - 40 && wx < safeRight + 40) continue;
        if (abs(wx - flagPoleX) < 140) continue;
        let overCanyonWorm = false;
        for (const can of state.canyons) { if (wx > can.x_pos - 5 && wx < can.x_pos + can.width + 5) { overCanyonWorm = true; break; } }
        if (overCanyonWorm) continue;
        state.worms.push(factory.worm(wx, state.floorPosY - 3, floor(random(4, 6)), random([-1, 1]), random(0.07, 0.1), random(TWO_PI)));
    }
}

/** Full restart: sets world width, resets state, generates everything */
export function startGame() {
    const multiplier = floor(random(2, 5));
    setWorldWidth(CANVAS_WIDTH * multiplier);
    state.lives = 3;
    state.cameraPosX = 0;
    state.gameScore = 0;
    state.winFrame = null;
    state.loseFrame = null;
    state.particles = [];
    state.gameChar = factory.gameChar(state.floorPosY);
    generateBackdrop();
    const flagPoleX = WORLD_WIDTH - 150;
    generateLevelContent({ flagPoleX });
    state.flagPole = factory.flagPole(flagPoleX, state.floorPosY);
}
