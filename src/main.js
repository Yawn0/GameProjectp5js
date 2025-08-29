/* Main entry module: orchestrates p5 lifecycle using imported modules + shared state */
import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_HEIGHT_RATIO, BLOBBY, state } from './constants.js';
import { factory } from './entities.js';
import { drawGround, drawScenery, drawCollectible } from './world.js';
import { drawCharacter, checkPlayerDie, drawLives, drawGameScore, drawFinishLine, drawGameOver, drawGameWin, checkCollectable } from './gameplay.js';

// Expose key handlers to p5 by re-exporting (p5 calls global functions); import inside to avoid side-effects
import { keyPressed as gameplayKeyPressed, keyReleased as gameplayKeyReleased } from './gameplay.js';
export function keyPressed() { gameplayKeyPressed(); }
export function keyReleased() { gameplayKeyReleased(); }

// Level content generators (kept local)
function generateCanyons() { for (let i = 0; i < 2; i++) state.canyons.push(factory.canyon()); }
function generateCollectables() { for (let i = 0; i < 4; i++) state.collectables.push(factory.collectible(state.floorPosY)); }

function startGame() {
    state.lives = 3;
    state.cameraPosX = 0;
    state.gameChar = factory.gameChar(state.floorPosY);
    state.gameScore = 0;
    state.collectables = [];
    state.canyons = [];
    generateCollectables();
    generateCanyons();
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