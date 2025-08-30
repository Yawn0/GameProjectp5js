/* Main entry module: orchestrates p5 lifecycle using imported modules + shared state */
import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_HEIGHT_RATIO, BLOBBY, state } from './constants.js';
import { factory, Collectible, Canyon, Platform } from './entities.js';
import { drawGround, drawScenery, drawCollectible } from './world.js';
import { drawCharacter, checkPlayerDie, drawLives, drawGameScore, drawFinishLine, drawGameOver, drawGameWin, checkCollectable } from './gameplay.js';

// Expose key handlers to p5 by re-exporting (p5 calls global functions); import inside to avoid side-effects
import { keyPressed as gameplayKeyPressed, keyReleased as gameplayKeyReleased } from './gameplay.js';
export function keyPressed() { gameplayKeyPressed(); }
export function keyReleased() { gameplayKeyReleased(); }

// Dynamic level content generation with constraints:
// 1. Canyons cannot spawn under Blobby's start position.
// 2. Canyons cannot overlap each other.
// 3. Canyons must be at least MIN_CANYON_GAP px apart (edge-to-edge).
// 4. Canyons cannot cover (be under) a collectible.
function generateLevelContent({ numCollectibles = 4, numCanyons = 2 } = {}) {
    state.collectables = [];
    state.canyons = [];
    state.platforms = [];

    // --- Collectibles (placed first so canyons avoid them) ---
    const playerStartX = width / 2; // spawn
    const SAFE_RADIUS = 150; // no hazards or collectibles inside this horizontal radius
    const safeLeft = playerStartX - SAFE_RADIUS;
    const safeRight = playerStartX + SAFE_RADIUS;

    // We'll spawn collectibles later (after platforms) so some can appear over platforms.

    // --- Canyons with constraints ---
    const MIN_CANYON_GAP = 100; // requirement #3
    const MIN_CANYON_WIDTH = 60;
    const MAX_CANYON_WIDTH = 140;
    // playerStartX already defined above

    let attempts = 0;
    const MAX_ATTEMPTS = 500; // safety to avoid infinite loops
    while (state.canyons.length < numCanyons && attempts < MAX_ATTEMPTS) {
        attempts++;
        const canyonWidth = random(MIN_CANYON_WIDTH, MAX_CANYON_WIDTH);
        const x = random(0, width - canyonWidth);
        const left = x;
        const right = x + canyonWidth;

    // (1 + safe zone) Skip if canyon overlaps ANY part of safe zone around player spawn
    if (!(right < safeLeft || left > safeRight)) continue;

        // (4) Skip if any collectible lies horizontally above this canyon
        let blockedByCollectible = false;
        for (const col of state.collectables) {
            if (col.x_pos >= left && col.x_pos <= right) { blockedByCollectible = true; break; }
        }
        if (blockedByCollectible) continue;

        // (2 & 3) Check against existing canyons for overlap or insufficient gap
        let invalid = false;
        for (const existing of state.canyons) {
            const eLeft = existing.x_pos;
            const eRight = existing.x_pos + existing.width;
            const tooClose = !(right + MIN_CANYON_GAP <= eLeft || eRight + MIN_CANYON_GAP <= left); // if neither side satisfies gap
            if (tooClose) { invalid = true; break; }
        }
        if (invalid) continue;

        state.canyons.push(new Canyon(x, canyonWidth));
    }

    // --- Platforms ---
    // First layer: y = floor - 60, must cover each canyon wider than 60px at least partially
    const firstLayerY = state.floorPosY - 60;
    const secondLayerY = firstLayerY - 50; // second layer 50px above first

    for (const can of state.canyons) {
        if (can.width > 60) {
            // Create a platform spanning the canyon with a little margin
            const margin = 20;
            const pX = max(0, can.x_pos - margin);
            const pWidth = min(width - pX, can.width + margin * 2);
            state.platforms.push(new Platform(pX, firstLayerY, pWidth, 12, 0));
        }
    }

    // Additional random platforms (first and second layers)
    const EXTRA_PLATFORMS = 3;
    let platAttempts = 0;
    while (state.platforms.length < EXTRA_PLATFORMS + state.canyons.filter(c=>c.width>60).length && platAttempts < 200) {
        platAttempts++;
        const level = random() < 0.5 ? 0 : 1; // choose layer
        const y = level === 0 ? firstLayerY : secondLayerY;
        const w = random(80, 160);
        const x = random(0, width - w);
        // Avoid safe zone
        if (!(x + w < safeLeft || x > safeRight)) continue;
        // Avoid heavy overlap with existing platforms on same layer
        let overlaps = false;
        for (const p of state.platforms) {
            if (p.level === level) {
                if (x < p.x_pos + p.width + 40 && x + w > p.x_pos - 40) { overlaps = true; break; }
            }
        }
        if (overlaps) continue;
        state.platforms.push(new Platform(x, y, w, 12, level));
    }

    // --- Collectibles (ground + platform) ---
    // One collectible per platform (optional) + some on ground
    for (const p of state.platforms) {
        if (random() < 0.6) { // 60% chance to place collectible on platform
            const x = random(p.x_pos + 20, p.x_pos + p.width - 20);
            state.collectables.push(new Collectible(x, p.y_pos));
        }
    }
    // Ground collectibles to reach target numCollectibles
    let groundToPlace = numCollectibles;
    let groundAttempts = 0;
    while (groundToPlace > 0 && groundAttempts < 200) {
        groundAttempts++;
        const x = random(width);
        if (x >= safeLeft && x <= safeRight) continue;
        // Avoid spawning over canyons (so player can stand to collect) unless platform above
        let overCanyon = false;
        for (const can of state.canyons) {
            if (x > can.x_pos && x < can.x_pos + can.width) { overCanyon = true; break; }
        }
        if (overCanyon) continue;
        state.collectables.push(new Collectible(x, state.floorPosY));
        groundToPlace--;
    }
}

function startGame() {
    state.lives = 3;
    state.cameraPosX = 0;
    state.gameChar = factory.gameChar(state.floorPosY);
    state.gameScore = 0;
    generateLevelContent({ numCollectibles: 4, numCanyons: 2 });
    state.treesX = [85, 300, 450, 700, 850];
    state.cloudsCoordinates = [
        { x_pos: 100, y_pos: 100 },
        { x_pos: 200, y_pos: 80 },
        { x_pos: 500, y_pos: 120 },
        { x_pos: 600, y_pos: 90 },
        { x_pos: 800, y_pos: 100 },
        { x_pos: 1000, y_pos: 110 }
    ];
    state.clouds = factory.clouds(state.cloudsCoordinates);
    state.mountains = [
        { x_pos: 0, width: 1 },
        { x_pos: 600, width: 1.1 },
        { x_pos: 450, width: 1.2 },
        { x_pos: 300, width: 0.6 }
    ];
    state.flagPole = factory.flagPole(1300, state.floorPosY);
}

// p5.js lifecycle hooks (declared so p5 can call them; p5 must load first in HTML)
window.setup = function setup() {
    soundFormats('mp3', 'wav');
    state.sound = {
        baseVolume: 0.1,
        JUMP: loadSound('assets/jump.wav'),
        COLLECT: loadSound('assets/collect.wav'),
        DEATH: loadSound('assets/death.wav'),
        WIN: loadSound('assets/win.wav')
    };
    state.sound.JUMP.setVolume(state.sound.baseVolume);
    state.sound.COLLECT.setVolume(state.sound.baseVolume);
    state.sound.DEATH.setVolume(state.sound.baseVolume);
    state.sound.WIN.setVolume(state.sound.baseVolume);

    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    state.floorPosY = height * FLOOR_HEIGHT_RATIO;
    startGame();
};

window.draw = function draw() {
    const g = state.gameChar;
    state.cameraPosX += g.isLeft ? -BLOBBY.SPEED : (g.isRight ? BLOBBY.SPEED : 0);
    background(100, 155, 255);
    drawGround();
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
    if (state.flagPole.isReached) { drawGameWin(); state.flagPole.isReached = false; }
};

// Forward key events since p5 expects global functions (already exported for completeness)
window.keyPressed = keyPressed;
window.keyReleased = keyReleased;