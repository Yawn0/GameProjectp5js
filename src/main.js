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
function generateCanyons() { for (let i = 0; i < 2; i++) state._canyons.push(factory.canyon()); }
function generateCollectables() { for (let i = 0; i < 4; i++) state._collectables.push(factory.collectible(state._floorPos_y)); }

function startGame() {
    state._lives = 3;
    state._cameraPosX = 0;
    state._gameChar = factory.gameChar(state._floorPos_y);
    state._gameScore = 0;
    state._collectables = [];
    state._canyons = [];
    generateCollectables();
    generateCanyons();
    state._trees_x = [85, 300, 450, 700, 850];
    state._cloudsCoordinates = [
        { x_pos: 100, y_pos: 100 },
        { x_pos: 200, y_pos: 80 },
        { x_pos: 500, y_pos: 120 },
        { x_pos: 600, y_pos: 90 },
        { x_pos: 800, y_pos: 100 },
        { x_pos: 1000, y_pos: 110 }
    ];
    state._clouds = factory.clouds(state._cloudsCoordinates);
    state._mountains = [
        { x_pos: 0, width: 1 },
        { x_pos: 600, width: 1.1 },
        { x_pos: 450, width: 1.2 },
        { x_pos: 300, width: 0.6 }
    ];
    state._flagPole = factory.flagPole(1300, state._floorPos_y);
}

// p5.js lifecycle hooks (declared so p5 can call them; p5 must load first in HTML)
window.setup = function setup() {
    soundFormats('mp3', 'wav');
    state._sound = {
        baseVolume: 0.1,
        JUMP: loadSound('assets/jump.wav'),
        COLLECT: loadSound('assets/collect.wav'),
        DEATH: loadSound('assets/death.wav'),
        WIN: loadSound('assets/win.wav')
    };
    state._sound.JUMP.setVolume(state._sound.baseVolume);
    state._sound.COLLECT.setVolume(state._sound.baseVolume);
    state._sound.DEATH.setVolume(state._sound.baseVolume);
    state._sound.WIN.setVolume(state._sound.baseVolume);

    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    state._floorPos_y = height * FLOOR_HEIGHT_RATIO;
    startGame();
};

window.draw = function draw() {
    const g = state._gameChar;
    state._cameraPosX += g.isLeft ? -BLOBBY.SPEED : (g.isRight ? BLOBBY.SPEED : 0);
    background(100, 155, 255);
    drawGround();
    translate(-state._cameraPosX, 0);
    drawScenery();
    checkPlayerDie();
    if (!g.isDead) { drawCharacter(); }
    for (let i = 0; i < state._collectables.length; i++) {
        const c = state._collectables[i];
        drawCollectible(c);
        checkCollectable(c);
        if (c.isFound) { state._collectables.splice(i, 1); i--; }
    }
    drawLives();
    drawGameScore();
    drawFinishLine();
    if (g.isDead) { drawGameOver(); }
    if (state._flagPole.isReached) { drawGameWin(); state._flagPole.isReached = false; }
};

// Forward key events since p5 expects global functions (already exported for completeness)
window.keyPressed = keyPressed;
window.keyReleased = keyReleased;