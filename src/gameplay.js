/* Gameplay loop helpers: input, physics, scoring, UI (ES module) */
import { BLOBBY, JUMP_HEIGHT, GRAVITY_SPEED, PLUMMET_SPEED, state } from './constants.js';
import { blobbyJumpingLeft, blobbyJumpingRight, blobbyWalkingLeft, blobbyWalkingRight, blobbyJumping, blobbyStandingFront } from './character.js';

/** Map raw keyCode to canonical direction key. */
export function getDirectionalKey(keyCode) {
    if (keyCode == 65 || keyCode == LEFT_ARROW) { return LEFT_ARROW; }
    if (keyCode == 68 || keyCode == RIGHT_ARROW) { return RIGHT_ARROW; }
    if (keyCode == 87 || keyCode == UP_ARROW || keyCode == 32) { return UP_ARROW; }
    if (keyCode == 83 || keyCode == DOWN_ARROW) { return DOWN_ARROW; }
    return '';
}

/** Handle key down events (movement + jump). */
export function keyPressed() {
    const g = state.gameChar;
    if (g.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) { g.isLeft = true; }
    else if (directionKey === RIGHT_ARROW) { g.isRight = true; }
    else if (directionKey === UP_ARROW && !g.isFalling) {
        state.sound.JUMP.play();
        g.y -= JUMP_HEIGHT;
    }
    else if (directionKey === DOWN_ARROW) {
        // Initiate drop-through: temporarily ignore platforms while moving down
        g.dropThroughFrames = 15; // ~ quarter second at 60fps
        g.y += 5; // nudge below platform surface
    }
}

/** Stop horizontal movement on key up. */
export function keyReleased() {
    const g = state.gameChar;
    if (g.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) { g.isLeft = false; }
    else if (directionKey === RIGHT_ARROW) { g.isRight = false; }
}

/** Advance character physics + pick proper animation. */
export function drawCharacter() {
    const g = state.gameChar;
    if (g.isLeft && g.isFalling) { blobbyJumpingLeft(); }
    else if (g.isRight && g.isFalling) { blobbyJumpingRight(); }
    else if (g.isLeft) { blobbyWalkingLeft(); }
    else if (g.isRight) { blobbyWalkingRight(); }
    else if (g.isFalling || g.isPlummeting) { blobbyJumping(); }
    else { blobbyStandingFront(); }

    if (g.isLeft) { g.x -= BLOBBY.SPEED; }
    else if (g.isRight) { g.x += BLOBBY.SPEED; }

    if (g.y < state.floorPosY) {
        g.y += GRAVITY_SPEED;
        g.isFalling = true;
    }
    else { g.isFalling = false; }

    // Platform collision (landing)
    // Approximate character bottom as g.y, and horizontal bounds as body width * 0.5
    const halfWidth = BLOBBY.DIMENSIONS.BODY_WIDTH * 0.5;
    let onPlatform = false;
    if (g.dropThroughFrames > 0) { g.dropThroughFrames--; }
    else {
        for (const p of state.platforms) {
            const withinX = g.x + halfWidth > p.x_pos && g.x - halfWidth < p.x_pos + p.width;
            const closeToTop = abs(g.y - p.y_pos) < 5; // tolerance for landing
            const abovePlatform = g.y <= p.y_pos + 5; // not falling through from below
            if (withinX && closeToTop && abovePlatform) {
                g.y = p.y_pos; // snap to platform top
                g.isFalling = false;
                onPlatform = true;
                break;
            }
        }
    }
    if (!onPlatform && g.y < state.floorPosY) { g.isFalling = true; }

    for (let i = 0; i < state.canyons.length; i++) { checkCanyon(state.canyons[i]); }

    if (g.isPlummeting) {
        g.y += PLUMMET_SPEED;
        g.isLeft = false;
        g.isRight = false;
    }
}

/** Collect coin when player overlaps. */
export function checkCollectable(t_collectible) {
    const g = state.gameChar;
    if (dist(g.x, g.y, t_collectible.x_pos, t_collectible.y_pos) < 20) {
        state.sound.COLLECT.play();
        t_collectible.isFound = true;
        state.gameScore++;
    }
}

/** Trigger plummet when over canyon gap. */
export function checkCanyon(t_canyon) {
    const g = state.gameChar;
    const isOverCanyon = g.x > t_canyon.x_pos && g.x < t_canyon.x_pos + t_canyon.width && g.y >= state.floorPosY;
    if (isOverCanyon) { g.isPlummeting = true; }
}

/** Detect proximity to flag pole top. */
export function checkFinishLine() {
    const g = state.gameChar;
    const f = state.flagPole;
    const isOverFinishLine = abs(g.x - f.x_pos) < 10 && abs(g.y - f.y_pos) < 10;
    if (isOverFinishLine) { f.isReached = true; }
}

/** Life loss + death state check. */
export function checkPlayerDie() {
    const g = state.gameChar;
    if (g.y > height) {
        state.sound.DEATH.play();
        state.lives--;
        g.reset(state.floorPosY);
        state.cameraPosX = 0;
    }
    if (state.lives <= 0) { g.isDead = true; }
}

/** Display remaining lives as hearts. */
export function drawLives() {
    fill(0);
    textSize(32);
    for (let i = 0; i < state.lives; i++) {
        push();
        translate(state.cameraPosX + 30 + i * 40, 30);
        fill(255, 0, 0);
        noStroke();
        beginShape();
        vertex(0, 0);
        bezierVertex(-10, -10, -20, 0, 0, 10);
        bezierVertex(20, 0, 10, -10, 0, 0);
        endShape();
        pop();
    }
}

/** Render current score HUD text. */
export function drawGameScore() {
    fill(0);
    textSize(26);
    text("Score: " + state.gameScore, state.cameraPosX + 20, 70);
}

/** Draw pole and test for completion. */
export function drawFinishLine() {
    fill(0);
    const f = state.flagPole;
    if (f.isReached) { fill(200); }
    else { checkFinishLine(); }
    rect(f.x_pos, f.y_pos, f.width, -f.height);
}

/** Game over banner. */
export function drawGameOver() {
    fill(0);
    textSize(32);
    text("Game Over", state.cameraPosX + 20, 100);
}

/** Win banner + sound. */
export function drawGameWin() {
    state.sound.WIN.play();
    fill(0);
    textSize(32);
    text("level complete", state.cameraPosX + 20, 100);
}
