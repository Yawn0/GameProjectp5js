/* Main entry module: orchestrates p5 lifecycle using imported modules + shared state */
import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_HEIGHT_RATIO, BLOBBY, WORLD_WIDTH, state } from './constants.js';
import { factory, Collectible, Canyon, Platform } from './entities.js';
import { drawGround, drawScenery, drawCollectible } from './world.js';
import { drawCharacter, checkPlayerDie, drawLives, drawGameScore, drawFinishLine, drawGameOver, drawGameWin, checkCollectable } from './gameplay.js';
import { keyPressed as gameplayKeyPressed, keyReleased as gameplayKeyReleased } from './gameplay.js';

export function keyPressed() { gameplayKeyPressed(); }
export function keyReleased() { gameplayKeyReleased(); }

// Procedural level generation (canyons, platforms, collectibles)
function generateLevelContent({ numCollectibles = 6, numCanyons = 4, flagPoleX = WORLD_WIDTH - 150 } = {}) {
    state.collectables = [];
    state.canyons = [];
    state.platforms = [];
    state.treesX = [];

    const playerStartX = CANVAS_WIDTH / 2; // starting x
    const SAFE_RADIUS = 150;
    const safeLeft = playerStartX - SAFE_RADIUS;
    const safeRight = playerStartX + SAFE_RADIUS;

    // Canyons
    const MIN_CANYON_GAP = 100;
    const MIN_CANYON_WIDTH = 60;
    const MAX_CANYON_WIDTH = 140;
    let attempts = 0;
    const MAX_ATTEMPTS = 800;
    const FLAG_SAFE_MARGIN = 120; // extra horizontal space kept clear around flag pole
    while (state.canyons.length < numCanyons && attempts < MAX_ATTEMPTS) {
        attempts++;
        const canyonWidth = random(MIN_CANYON_WIDTH, MAX_CANYON_WIDTH);
        const x = random(0, WORLD_WIDTH - canyonWidth);
        const left = x;
        const right = x + canyonWidth;
        // Avoid safe zone
        if (!(right < safeLeft || left > safeRight)) continue;
        // Avoid end-game flag pole area (no canyon under/near flag pole). Account for draw overhang (-20, +40) plus margin.
        const canyonDrawLeft = left - 20;
        const canyonDrawRight = right + 40;
        const flagMin = flagPoleX - FLAG_SAFE_MARGIN;
        const flagMax = flagPoleX + FLAG_SAFE_MARGIN;
        const overlapsFlagRegion = !(canyonDrawRight < flagMin || canyonDrawLeft > flagMax);
        if (overlapsFlagRegion) continue;
        // Check spacing vs existing
        let invalid = false;
        for (const existing of state.canyons) {
            const eLeft = existing.x_pos;
            const eRight = existing.x_pos + existing.width;
            const tooClose = !(right + MIN_CANYON_GAP <= eLeft || eRight + MIN_CANYON_GAP <= left);
            if (tooClose) { invalid = true; break; }
        }
        if (invalid) continue;
        state.canyons.push(new Canyon(x, canyonWidth));
    }

    // Platforms over wide canyons first layer (only for canyons >= 90px)
    const firstLayerY = state.floorPosY - 60;
    const secondLayerY = firstLayerY - 50;
    for (const can of state.canyons) {
        if (can.width >= 90) {
            const margin = 20;
            const pX = max(0, can.x_pos - margin);
            const pWidth = min(WORLD_WIDTH - pX, can.width + margin * 2);
            state.platforms.push(new Platform(pX, firstLayerY, pWidth, 12, 0));
        }
    }

    // Extra random platforms (avoid flag pole zone)
    const EXTRA_PLATFORMS = 5;
    let platAttempts = 0;
    while (platAttempts < 400 && state.platforms.length < EXTRA_PLATFORMS + state.canyons.filter(c => c.width >= 90).length) {
        platAttempts++;
    // Lower probability for second layer (e.g., 25%)
    const level = random() < 0.75 ? 0 : 1;
        const y = level === 0 ? firstLayerY : secondLayerY;
        const w = random(80, 180);
        const x = random(0, WORLD_WIDTH - w);
        if (!(x + w < safeLeft || x > safeRight)) continue; // avoid safe zone
        // Avoid 100px flag pole safe zone
        const FLAG_PLATFORM_SAFE = 100;
        if (!(x + w < flagPoleX - FLAG_PLATFORM_SAFE || x > flagPoleX + FLAG_PLATFORM_SAFE)) continue;
    // Disallow platforms over canyons < 90px on first layer
        if (level === 0) {
            let overSmall = false;
            for (const can of state.canyons) {
        if (can.width < 90) {
                    const cLeft = can.x_pos;
                    const cRight = can.x_pos + can.width;
                    if (x < cRight && x + w > cLeft) { overSmall = true; break; }
                }
            }
            if (overSmall) continue;
        }
        let overlaps = false;
        for (const p of state.platforms) {
            if (p.level === level && x < p.x_pos + p.width + 40 && x + w > p.x_pos - 40) { overlaps = true; break; }
        }
        if (overlaps) continue;
        state.platforms.push(new Platform(x, y, w, 12, level));
    }

    // Collectibles on platforms (max one per platform, 60% chance)
    for (const p of state.platforms) {
        if (random() < 0.6) {
            const cx = random(p.x_pos + 20, p.x_pos + p.width - 20);
            if (cx < flagPoleX - 40) { // keep a little gap before pole
                state.collectables.push(new Collectible(cx, p.y_pos));
            }
        }
    }

    // Ground collectibles (avoid canyons & safe zone)
    let groundToPlace = numCollectibles;
    let groundAttempts = 0;
    while (groundToPlace > 0 && groundAttempts < 400) {
        groundAttempts++;
    const x = random(flagPoleX - 60); // only before flag
        if (x >= safeLeft && x <= safeRight) continue;
        let overCanyon = false;
        for (const can of state.canyons) {
            if (x > can.x_pos && x < can.x_pos + can.width) { overCanyon = true; break; }
        }
        if (overCanyon) continue;
        state.collectables.push(new Collectible(x, state.floorPosY));
        groundToPlace--;
    }

    // Trees (now part of dynamic content) - denser with soft clustering
    const treeMinGap = 85; // base minimum distance
    const treeFlagSafe = 120;
    const treeCountTarget = max(40, floor(WORLD_WIDTH / 100)); // scale with world width
    let treeAttempts = 0;
    while (state.treesX.length < treeCountTarget && treeAttempts < treeCountTarget * 30) {
        treeAttempts++;
        const tx = random(WORLD_WIDTH);
        // Avoid player safe zone & near flag pole
        if (tx > safeLeft - 40 && tx < safeRight + 40) continue;
        if (abs(tx - flagPoleX) < treeFlagSafe) continue;
        // Avoid canyons span (with small margin so trunks not over gap)
        let overCanyon = false;
        for (const can of state.canyons) {
            if (tx > can.x_pos - 30 && tx < can.x_pos + can.width + 30) { overCanyon = true; break; }
        }
        if (overCanyon) continue;
        // Spacing to other trees with probabilistic acceptance for moderate distances
        let tooClose = false;
        for (const existing of state.treesX) {
            const d = abs(existing - tx);
            if (d < treeMinGap * 0.5) { tooClose = true; break; } // hard reject very close
            if (d < treeMinGap && random() < 0.6) { tooClose = true; break; } // soft reject
        }
        if (tooClose) continue;
        state.treesX.push(tx);
    }
    state.treesX.sort((a,b)=>a-b);
}

function generateBackdrop() {
    // Clouds seed
    state.cloudsCoordinates = [];
    const cloudCount = 12;
    for (let i = 0; i < cloudCount; i++) { state.cloudsCoordinates.push({ x_pos: random(WORLD_WIDTH), y_pos: random(70, 130) }); }
    state.clouds = factory.clouds(state.cloudsCoordinates);
    // Mountains
    state.mountains = [];
    const mountainCount = 8;
    for (let i = 0; i < mountainCount; i++) { state.mountains.push({ x_pos: random(WORLD_WIDTH), width: random(0.6, 1.3) }); }
}

function startGame() {
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

window.setup = function setup() {
    soundFormats('mp3', 'wav');
    state.sound = {
        baseVolume: 0.1,
        JUMP: loadSound('assets/jump.wav'),
        COLLECT: loadSound('assets/collect.wav'),
        DEATH: loadSound('assets/death.wav'),
        WIN: loadSound('assets/win.wav')
        ,LOST: loadSound('assets/lost.wav') // reuse if lost.wav missing
    };
    for (const k of ['JUMP','COLLECT','DEATH','WIN','LOST']) state.sound[k].setVolume(state.sound.baseVolume);
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    state.floorPosY = height * FLOOR_HEIGHT_RATIO;
    startGame();
};

window.draw = function draw() {
    const g = state.gameChar;
    // Move player first (handled in drawCharacter) then sync camera to keep player near center
    background(100, 155, 255);
    // Simple camera follow
    state.cameraPosX = constrain(g.x - CANVAS_WIDTH / 2, 0, WORLD_WIDTH - CANVAS_WIDTH);
    drawGround();
    push();
    translate(-state.cameraPosX, 0);
    drawScenery();
    checkPlayerDie();
    if (!g.isDead) { drawCharacter(); }
    for (let i = 0; i < state.collectables.length; i++) {
        const c = state.collectables[i];
        drawCollectible(c);
        checkCollectable(c);
        if (c.isFound) { state.collectables.splice(i, 1); i--; }
    }
    drawLives();
    drawGameScore();
    drawFinishLine();
    if (g.isDead) { drawGameOver(); }
    if (state.flagPole.isReached || state.winFrame !== null) { drawGameWin(); }
    pop();
};

window.keyPressed = keyPressed;
window.keyReleased = keyReleased;

// Mouse restart handler (UI buttons)
window.mousePressed = function() {
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
document.addEventListener('keydown', (e) => {
    if (e.key === 'r' || e.key === 'R') {
        if (state.flagPole.isReached || state.loseFrame !== null) { startGame(); }
    }
});