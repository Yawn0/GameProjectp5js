/* Main entry module: orchestrates p5 lifecycle using imported modules + shared state */
import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_HEIGHT_RATIO, BLOBBY, WORLD_WIDTH, state } from './constants.js';
import { factory, Collectible, Canyon, Platform } from './entities.js';
import { drawGround, drawScenery, drawCollectible, drawSplash } from './world.js';
import { drawCharacter, checkPlayerDie, drawFinishLine, checkCollectable, ensureWinParticles } from './gameplay.js';
import { drawLives, drawGameScore, drawGameOver, drawGameWin, drawStartScreen, drawMusicToggle } from './hud.js';
import { keyPressed as gameplayKeyPressed, keyReleased as gameplayKeyReleased } from './gameplay.js';

export function keyPressed() { gameplayKeyPressed(); }
export function keyReleased() { gameplayKeyReleased(); }

// Procedural level generation (canyons, platforms, collectibles)
/**
 * generateLevelContent
 * Detailed doc in comment: fills state.* arrays via rejection sampling.
 */
function generateLevelContent({
    numCollectibles = 3,
    numCanyons = 8,
    flagPoleX = WORLD_WIDTH - 150
} = {})
{
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

    const playerStartX = CANVAS_WIDTH / 2; // starting x
    const SAFE_RADIUS = 150;
    const safeLeft = playerStartX - SAFE_RADIUS;
    const safeRight = playerStartX + SAFE_RADIUS;

    // Canyons
    const MIN_CANYON_GAP = 140; // slightly larger to avoid overcrowding in expanded world
    const MIN_CANYON_WIDTH = 60;
    const MAX_CANYON_WIDTH = 140;
    let attempts = 0;
    const worldScale = WORLD_WIDTH / (CANVAS_WIDTH * 1.5);
    const MAX_ATTEMPTS = 1200 * worldScale;
    const FLAG_SAFE_MARGIN = 120; // extra horizontal space kept clear around flag pole
    while (state.canyons.length < numCanyons && attempts < MAX_ATTEMPTS)
    {
        attempts++;
        const width = random(MIN_CANYON_WIDTH, MAX_CANYON_WIDTH);
        const x = random(0, WORLD_WIDTH - width);
        const left = x, right = x + width;
        const inSafeZone = right >= safeLeft && left <= safeRight;
        if (inSafeZone) continue;
        const flagMin = flagPoleX - FLAG_SAFE_MARGIN;
        const flagMax = flagPoleX + FLAG_SAFE_MARGIN;
        const canyonDrawLeft = left - 20;
        const canyonDrawRight = right + 40;
        const overlapsFlagRegion = canyonDrawRight >= flagMin && canyonDrawLeft <= flagMax;
        if (overlapsFlagRegion) continue;
        let tooClose = false;
        for (const existing of state.canyons)
        {
            const eLeft = existing.x_pos;
            const eRight = existing.x_pos + existing.width;
            if (!(right + MIN_CANYON_GAP <= eLeft || eRight + MIN_CANYON_GAP <= left)) { tooClose = true; break; }
        }
        if (tooClose) continue;
        state.canyons.push(factory.canyon(x, width));
    }

    // Platform layout
    const firstLayerY = state.floorPosY - 90;   // base elevated path
    const secondLayerY = firstLayerY - 70;      // higher layer (requires support)

    // 1) Canyon-spanning safety platforms (only where needed)
    for (const can of state.canyons)
    {
        if (can.width < 90) continue; // only bridge wide gaps
        const margin = 20;
        const pX = max(0, can.x_pos - margin);
        const pWidth = min(WORLD_WIDTH - pX, can.width + margin * 2);
        state.platforms.push(factory.platform(pX, firstLayerY, pWidth, 12, 0));
    }

    // 2) Additional sparse first-layer platforms
    const FIRST_LAYER_EXTRA_TARGET = floor((2 * worldScale) + 3);
    const FIRST_LAYER_MIN_GAP = 140;
    let firstExtrasAttempts = 0;
    while (state.platforms.filter(p => p.level === 0).length < FIRST_LAYER_EXTRA_TARGET + state.canyons.filter(c => c.width >= 90).length && firstExtrasAttempts < 500)
    {
        firstExtrasAttempts++;
        const w = random(90, 170);
        const x = random(0, WORLD_WIDTH - w);

        if (!(x + w < safeLeft || x > safeRight)) continue; // avoid spawn safe zone
        const FLAG_PLATFORM_SAFE = 120;
        if (!(x + w < flagPoleX - FLAG_PLATFORM_SAFE || x > flagPoleX + FLAG_PLATFORM_SAFE)) continue; // avoid flag area

        // Avoid overlapping small canyon mouths if canyon narrow
        let invalid = false;
        for (const can of state.canyons)
        {
            if (can.width < 90)
            {
                const cLeft = can.x_pos;
                const cRight = can.x_pos + can.width;
                if (x < cRight && x + w > cLeft) { invalid = true; break; }
            }
        }
        if (invalid) continue;

        // Spacing from existing first layer platforms
        for (const p of state.platforms)
        {
            if (p.level !== 0) continue;
            const gap = (x + w) < p.x_pos ? p.x_pos - (x + w) : x - (p.x_pos + p.width);
            if (gap < FIRST_LAYER_MIN_GAP && gap > -FIRST_LAYER_MIN_GAP) { invalid = true; break; }
        }
        if (invalid) continue;

        state.platforms.push(factory.platform(x, firstLayerY, w, 12, 0));
    }

    // 3) Second layer platforms: placed adjacent (not overlapping) to a lower platform within jump reach
    const SECOND_LAYER_TARGET = floor(state.platforms.filter(p => p.level === 0).length * 0.3);
    let secondAttempts = 0;
    const firstLayerPlatforms = () => state.platforms.filter(p => p.level === 0);
    const MAX_REACH_HORIZONTAL = 110; // safe horizontal reach based on jump physics
    const MIN_GAP_ADJ = 20;           // spacing between edges (no overlap)
    while (state.platforms.filter(p => p.level === 1).length < SECOND_LAYER_TARGET && secondAttempts < 800)
    {
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

        // Distance check to ensure within horizontal reach from some first-layer platform edge
        const nearestFirst = bases.reduce((acc, p) =>
        {
            const dx = p.x_pos + p.width < x ? x - (p.x_pos + p.width) : p.x_pos > x + w ? p.x_pos - (x + w) : 0; // horizontal separation (0 if overlapping)
            return (dx < acc.dist) ? { dist: dx, plat: p } : acc;
        }, { dist: Infinity, plat: null });
        if (nearestFirst.dist > MAX_REACH_HORIZONTAL) continue; // too far to jump across

        // Disallow any horizontal overlap with ANY existing platform (all levels)
        let overlapsAny = false;
        for (const p of state.platforms)
        {
            const overlap = !(x + w <= p.x_pos || x >= p.x_pos + p.width); // strict non-overlap: touching edges allowed
            if (overlap) { overlapsAny = true; break; }
        }
        if (overlapsAny) continue;

        // Flag area exclusion
        const FLAG_PLATFORM_SAFE = 120;
        if (!(x + w < flagPoleX - FLAG_PLATFORM_SAFE || x > flagPoleX + FLAG_PLATFORM_SAFE)) continue;

        state.platforms.push(factory.platform(x, y, w, 12, 1));
    }

    // Collectibles on platforms
    for (const p of state.platforms) {
        if (random() >= 0.25) continue;
        const cx = random(p.x_pos + 20, p.x_pos + p.width - 20);
        if (cx >= flagPoleX - 40) continue; // keep a little gap before pole
        state.collectables.push(factory.collectible(cx, p.y_pos));
    }

    // Ground collectibles (avoid canyons & safe zone)
    let groundToPlace = floor(numCollectibles * worldScale);
    let groundAttempts = 0;
    while (groundToPlace > 0 && groundAttempts < 400)
    {
        groundAttempts++;
        const x = random(flagPoleX - 60); // only before flag
        if (x >= safeLeft && x <= safeRight) continue;
        let overCanyon = false;
        for (const can of state.canyons) { if (x > can.x_pos && x < can.x_pos + can.width) { overCanyon = true; break; } }
        if (overCanyon) continue;
        state.collectables.push(factory.collectible(x, state.floorPosY));
        groundToPlace--;
    }

    // Trees (layer 1 foreground, dense) - soft clustering
    const treeMinGap = 85;            // base minimum distance
    const treeFlagSafe = 120;         // horizontal exclusion radius near flag

    /*
        - floor(WORLD_WIDTH / a): scales count linearly so you get about 1 item per a horizontal pixels
        - max(n, ...): enforces a minimum of n so small worlds don't look barren
        - floor: ensures an integer (array loop bound).
        
        Effect:
            For WORLD_WIDTH < b → fixed at n (stable look in small/medium worlds).
            Once WORLD_WIDTH ≥ b, count grows (e.g. 8000 → 100, 12000 → 150).
    */
    const treeCountTarget = max(80, floor(WORLD_WIDTH / 80));

    let treeAttempts = 0;
    while (state.trees.length < treeCountTarget && treeAttempts < treeCountTarget * 30)
    {
        treeAttempts++;
        const tx = random(WORLD_WIDTH);

        // Avoid player safe zone & near flag pole
        if (tx > safeLeft - 40 && tx < safeRight + 40) continue;
        if (abs(tx - flagPoleX) < treeFlagSafe) continue;

        // Avoid canyons span (with small margin so trunks not over gap)
        let overCanyon = false;
        for (const can of state.canyons)
        {
            if (tx > can.x_pos - 30 && tx < can.x_pos + can.width + 30) { overCanyon = true; break; }
        }
        if (overCanyon) continue;

        // Spacing to other trees with probabilistic acceptance for moderate distances
        let tooClose = false;
        for (const existingTree of state.trees)
        {
            const d = abs(existingTree.x - tx);
            if (d < treeMinGap * 0.5) { tooClose = true; break; }         // hard reject very close
            if (d < treeMinGap && random() < 0.6) { tooClose = true; break; } // soft reject
        }
        if (tooClose) continue;

        state.trees.push(factory.tree(tx));
    }
    state.trees.sort((a, b) => a.x - b.x);

    // Layer 2 trees (mid distance): fewer & smaller, simple random spacing (reuse safe/flag rules)
    const layer2Target = floor(treeCountTarget * 0.35);
    let t2Attempts = 0;
    while (state.trees2.length < layer2Target && t2Attempts < layer2Target * 40) {
        t2Attempts++;
        const tx = random(WORLD_WIDTH);
        if (tx > safeLeft - 60 && tx < safeRight + 60) continue; // extra gap near spawn
        if (abs(tx - flagPoleX) < treeFlagSafe + 40) continue;
        let near = false;
        for (const existing of state.trees2) { if (abs(existing.x - tx) < 120) { near = true; break; } }
        if (near) continue;
        state.trees2.push({ x: tx, scale: random(0.55, 0.75) });
    }
    state.trees2.sort((a, b) => a.x - b.x);

    // Layer 3 trees (furthest): rare & tiny silhouettes
    const layer3Target = floor(treeCountTarget * 0.18);
    let t3Attempts = 0;
    while (state.trees3.length < layer3Target && t3Attempts < layer3Target * 50) {
        t3Attempts++;
        const tx = random(WORLD_WIDTH);
        if (tx > safeLeft - 80 && tx < safeRight + 80) continue;
        if (abs(tx - flagPoleX) < treeFlagSafe + 60) continue;
        let near = false;
        for (const existing of state.trees3) { if (abs(existing.x - tx) < 160) { near = true; break; } }
        if (near) continue;
        state.trees3.push({ x: tx, scale: random(0.35, 0.5) });
    }
    state.trees3.sort((a, b) => a.x - b.x);

    // Scatter rocks (avoid canyons & safe zone)
    const rockTarget = floor(50 * worldScale);
    let rockAttempts = 0;
    while (state.rocks.length < rockTarget && rockAttempts < rockTarget * 20)
    {
        rockAttempts++;

        const rx = random(WORLD_WIDTH);

        if (rx > safeLeft - 30 && rx < safeRight + 30) continue;

        let overCanyon = false;

        for (const can of state.canyons) 
        {
            if (rx > can.x_pos && rx < can.x_pos + can.width) 
            {
                overCanyon = true;
                break;
            }
        }

        if (overCanyon) continue;

        state.rocks.push(factory.rock(rx, random(10, 20)));
    }

    // Flowers (lighter density, before flag pole area center bias)
    const flowerTarget = floor(40 * worldScale);
    let flowerAttempts = 0;
    while (state.flowers.length < flowerTarget && flowerAttempts < flowerTarget * 25)
    {

        flowerAttempts++;
        const fx = random(flagPoleX - 80); // mostly before flag

        if (fx > safeLeft - 25 && fx < safeRight + 25) continue;
        let badPosition = false;

        for (const can of state.canyons) 
        {
            if (fx > can.x_pos - 10 && fx < can.x_pos + can.width + 10) 
            {
                badPosition = true;
                break;
            }
        }
        if (badPosition) continue;

        state.flowers.push(factory.flower(fx, random(12, 22), floor(random(1000))));
    }

    // Grass tufts (higher density filler) excluding canyons
    const grassTarget = floor(110 * worldScale);
    let grassAttempts = 0;
    while (state.grassTufts.length < grassTarget && grassAttempts < grassTarget * 30)
    {
        grassAttempts++;
        const gx = random(WORLD_WIDTH);
        if (gx > safeLeft - 20 && gx < safeRight + 20) continue;
        let overCan = false;
        for (const can of state.canyons) { if (gx > can.x_pos - 15 && gx < can.x_pos + can.width + 15) { overCan = true; break; } }
        if (overCan) continue;
        // Spacing: avoid clustering too tight
        let close = false;
        for (const t of state.grassTufts) { if (abs(t.x - gx) < 18) { close = true; break; } }
        if (close) continue;
        state.grassTufts.push(factory.grassTuft(gx, random(10, 20)));
    }

    // Worms: small crawling critters on ground (avoid canyons & safe zone)
    const wormCount = floor(6 * worldScale) + 3;
    let wormAttempts = 0;
    while (state.worms.length < wormCount && wormAttempts < wormCount * 40) {
        wormAttempts++;
        const wx = random(WORLD_WIDTH);
        if (wx > safeLeft - 40 && wx < safeRight + 40) continue;
        let overCanyonWorm = false;
        for (const can of state.canyons) { if (wx > can.x_pos - 5 && wx < can.x_pos + can.width + 5) { overCanyonWorm = true; break; } }
        if (overCanyonWorm) continue;
        // Worm(x, y, segmentCount, direction, speed, phase)
        state.worms.push(factory.worm(wx, state.floorPosY - 3, floor(random(4, 6)), random([-1, 1]), random(0.07, 0.1), random(TWO_PI)));
    }
}

function generateBackdrop()
{
    // Clouds seed
    state.cloudsCoordinates = [];
    const cloudCount = floor(12 * (WORLD_WIDTH / (CANVAS_WIDTH * 1.5))) + 8;
    for (let i = 0; i < cloudCount; i++) { state.cloudsCoordinates.push({ x_pos: random(WORLD_WIDTH), y_pos: random(70, 130) }); }
    state.clouds = factory.clouds(state.cloudsCoordinates);
    // Mountains
    state.mountains = [];
    const mountainCount = floor(8 * (WORLD_WIDTH / (CANVAS_WIDTH * 1.5))) + 4;
    for (let i = 0; i < mountainCount; i++)
    {
        state.mountains.push(factory.mountain(random(WORLD_WIDTH), random(0.6, 1.3)));
    }
    // Distant hills (broad parallax shapes)
    state.hills = [];
    const hillCount = floor(6 * (WORLD_WIDTH / (CANVAS_WIDTH * 1.5))) + 3;
    for (let i = 0; i < hillCount; i++)
    {
        state.hills.push(factory.hill(random(WORLD_WIDTH), random(180, 320)));
    }
}

function startGame()
{
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
    state.windSwishes = [];
}

window.setup = function setup()
{
    soundFormats('mp3', 'wav');
    state.sound = {
        baseVolume: 0.1,
        JUMP: loadSound('assets/jump.wav'),
        COLLECT: loadSound('assets/collect.wav'),
        DEATH: loadSound('assets/death.wav'),
        WIN: loadSound('assets/win.mp3'),
        LOST: loadSound('assets/lost.wav'),
        PLUMMET: loadSound('assets/plummeting.wav'),
        WORM_DIE: loadSound('assets/wormDies.wav'),
        MUSIC: null
    };
    for (const k of ['JUMP', 'COLLECT', 'DEATH', 'WIN', 'LOST', 'PLUMMET']) state.sound[k].setVolume(state.sound.baseVolume);
    state.sound.WORM_DIE.setVolume(state.sound.baseVolume * 2.5);
    state.sound.MUSIC = loadSound('assets/music.mp3', (snd) => {
        const vol = state.musicEnabled ? state.sound.baseVolume * 0.3 : 0;
        snd.setVolume(vol);
        snd.setLoop(true);
        // Don't autoplay until start screen dismissed
        if (!state.showStartScreen && state.musicEnabled) {
            try { snd.play(); } catch (e) { }
        }
    });
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    state.floorPosY = height * FLOOR_HEIGHT_RATIO;
    startGame();
};

window.draw = function draw() {
    const gameCharacter = state.gameChar;
    background(100, 155, 255);

    // Camera follow (frozen while start screen visible to keep centered initial view)
    if (!state.showStartScreen) {
        state.cameraPosX = constrain(gameCharacter.x - CANVAS_WIDTH / 2, 0, WORLD_WIDTH - CANVAS_WIDTH);
    } else {
        state.cameraPosX = 0;
    }

    // Wind evolution still runs for subtle ambient motion under start screen
    state.windPhase += 0.005;
    const noiseSample = (typeof noise === 'function') ? noise(state.windPhase) : (sin(state.windPhase) * 0.5 + 0.5);
    const targetWind = map(noiseSample, 0, 1, -1, 1) * 1.2;
    state.windValue = lerp(state.windValue, constrain(targetWind, -1, 1), 0.05);

    drawGround();
    push();
    translate(-state.cameraPosX, 0);
    drawScenery();

    // Worm collisions (character squishes worms when overlapping horizontally & near ground)
    if (!state.showStartScreen && !gameCharacter.isDead) {
        const charX = gameCharacter.x;
        for (let i = state.worms.length - 1; i >= 0; i--) {
            const w = state.worms[i];
            const dx = abs(charX - w.x);
            if (dx < 20 && abs(gameCharacter.y - state.floorPosY) < 6) { // simple proximity check near ground
                // Spawn splash with longer life & particle rays
                const splash = factory.splash(w.x, w.y);
                splash.maxLife = 24;
                splash.life = splash.maxLife;
                state.splashes.push(splash);
                // Play sound
                if (state.sound && state.sound.WORM_DIE) { 
                    try { state.sound.WORM_DIE.rate(random(0.9,1.1)); } catch(e) {}
                    state.sound.WORM_DIE.play(); 
                }
                // Remove worm and apply life penalty
                state.worms.splice(i, 1);
                state.lives = max(0, state.lives - 1);
                if (state.lives <= 0 && state.loseFrame === null) {
                    gameCharacter.isDead = true;
                    state.loseFrame = frameCount;
                }
            }
        }
    }

    // Draw & update splashes (world space)
    for (let i = state.splashes.length - 1; i >= 0; i--) {
        const s = state.splashes[i];
        drawSplash(s);
        if (s.life <= 0) { state.splashes.splice(i, 1); }
    }

    if (!state.showStartScreen) {
        checkPlayerDie();
        if (!gameCharacter.isDead) { drawCharacter(); }
        for (let i = 0; i < state.collectables.length; i++) {
            const collectible = state.collectables[i];
            drawCollectible(collectible);
            checkCollectable(collectible);
            if (collectible.isFound) { state.collectables.splice(i, 1); i--; }
        }
        drawFinishLine();
        if (gameCharacter.isDead) { drawGameOver(); }
        if (state.flagPole.isReached || state.winFrame !== null) {
            ensureWinParticles();
            drawGameWin();
        }
    }

    pop();

    // HUD (screen-space, after world pop)
    drawLives();
    drawGameScore();
    drawMusicToggle();
    drawStartScreen();
};

window.keyPressed = function() {
    if (state.showStartScreen) {
        state.showStartScreen = false;
        state.startScreenFade = 1; // begin fade out
        if (state.musicEnabled && state.sound && state.sound.MUSIC && !state.sound.MUSIC.isPlaying()) {
            try { state.sound.MUSIC.play(); } catch(e) {}
        }
        return;
    }
    // Music toggle shortcut (M)
    if (key === 'm' || key === 'M') {
        state.musicEnabled = !state.musicEnabled;
        if (state.sound && state.sound.MUSIC) {
            const targetVol = state.musicEnabled ? state.sound.baseVolume * 0.3 : 0;
            state.sound.MUSIC.setVolume(targetVol);
            // Ensure music keeps playing silently when muted to resume instantly
            if (!state.sound.MUSIC.isPlaying()) { try { state.sound.MUSIC.play(); } catch(e) {} }
        }
        return;
    }
    keyPressed();
};
window.keyReleased = keyReleased;

// Mouse restart handler (UI buttons)
window.mousePressed = function() {
    if (state.showStartScreen) {
        state.showStartScreen = false;
        state.startScreenFade = 1;
        if (state.musicEnabled && state.sound && state.sound.MUSIC && !state.sound.MUSIC.isPlaying()) {
            try { state.sound.MUSIC.play(); } catch(e) {}
        }
        return;
    }

    // Music toggle
    if (state._musicBtn) {
        const { x, y, w, h } = state._musicBtn;
        if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h) {
            state.musicEnabled = !state.musicEnabled;
            if (state.sound && state.sound.MUSIC) {
                const targetVol = state.musicEnabled ? state.sound.baseVolume * 0.3 : 0;
                state.sound.MUSIC.setVolume(targetVol);
                if (!state.sound.MUSIC.isPlaying()) { try { state.sound.MUSIC.play(); } catch(e) {} }
            }
            return;
        }
    }

    if (!(state.flagPole.isReached || state.loseFrame !== null)) return;
    const btnWWin = 240, btnHWin = 60;
    const btnWOver = 220, btnHOver = 60;
    const winBtnX = CANVAS_WIDTH / 2 - btnWWin / 2;
    const overBtnX = CANVAS_WIDTH / 2 - btnWOver / 2;
    const commonY = CANVAS_HEIGHT / 3 + 120;
    if (state.flagPole.isReached) {
        if (mouseX >= winBtnX && mouseX <= winBtnX + btnWWin && mouseY >= commonY && mouseY <= commonY + btnHWin) { startGame(); }
    } else if (state.loseFrame !== null) {
        if (mouseX >= overBtnX && mouseX <= overBtnX + btnWOver && mouseY >= commonY && mouseY <= commonY + btnHOver) { startGame(); }
    }
};

// Optional restart via R key at any end state
document.addEventListener('keydown', (eventObject) =>
{
    if (eventObject.key === 'r' || eventObject.key === 'R')
    {
        if (state.flagPole.isReached || state.loseFrame !== null) { startGame(); }
    }
});