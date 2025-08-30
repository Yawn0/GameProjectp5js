/* Gameplay loop helpers: input, physics, scoring, UI (ES module) */
import { BLOBBY, PLUMMET_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, state, GRAVITY_ACCEL, JUMP_VELOCITY } from './constants.js';
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
    const gameCharacter = state.gameChar;
    // Start background music only if enabled and not on start screen
    if (!state.showStartScreen && state.musicEnabled && state.sound && state.sound.MUSIC && !state.sound.MUSIC.isPlaying()) {
        try { state.sound.MUSIC.play(); } catch(e) {}
    }
    if ((state.flagPole && state.flagPole.isReached) || state.loseFrame !== null || gameCharacter.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) { gameCharacter.isLeft = true; }
    else if (directionKey === RIGHT_ARROW) { gameCharacter.isRight = true; }
    else if (directionKey === UP_ARROW && !gameCharacter.isFalling) {
        state.sound.JUMP.play();
        // Initiate smooth jump: set upward velocity
        gameCharacter.vy = -JUMP_VELOCITY;
        gameCharacter.isFalling = true;
    }
    else if (directionKey === DOWN_ARROW) {
        // Initiate drop-through: temporarily ignore platforms while moving down
        gameCharacter.dropThroughFrames = 15; // ~ quarter second at 60fps
        gameCharacter.y += 5; // nudge below platform surface
    }
}

/** Stop horizontal movement on key up. */
export function keyReleased() {
    const gameCharacter = state.gameChar;
    if ((state.flagPole && state.flagPole.isReached) || state.loseFrame !== null || gameCharacter.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) { gameCharacter.isLeft = false; }
    else if (directionKey === RIGHT_ARROW) { gameCharacter.isRight = false; }
}

/** Advance character physics + pick proper animation. */
export function drawCharacter() {
    const gameCharacter = state.gameChar;
    // Freeze character once level completed
    if ((state.flagPole && state.flagPole.isReached) || state.loseFrame !== null) {
        blobbyStandingFront();
        return;
    }
    if (gameCharacter.isLeft && gameCharacter.isFalling) { blobbyJumpingLeft(); }
    else if (gameCharacter.isRight && gameCharacter.isFalling) { blobbyJumpingRight(); }
    else if (gameCharacter.isLeft) { gameCharacter.walkCycle += 0.25; blobbyWalkingLeft(); }
    else if (gameCharacter.isRight) { gameCharacter.walkCycle += 0.25; blobbyWalkingRight(); }
    else if (gameCharacter.isFalling || gameCharacter.isPlummeting) { blobbyJumping(); }
    else { blobbyStandingFront(); }
    if (!gameCharacter.isLeft && !gameCharacter.isRight) { gameCharacter.walkCycle *= 0.9; }

    if (gameCharacter.isLeft) { gameCharacter.x -= BLOBBY.SPEED; }
    else if (gameCharacter.isRight) { gameCharacter.x += BLOBBY.SPEED; }

    // Apply gravity + velocity integration
    if (gameCharacter.isPlummeting) {
        // plummeting handled later
    } else {
        gameCharacter.vy += GRAVITY_ACCEL; // accumulate gravity
        gameCharacter.y += gameCharacter.vy;
        if (gameCharacter.y >= state.floorPosY) {
            gameCharacter.y = state.floorPosY;
            gameCharacter.vy = 0;
            gameCharacter.isFalling = false;
            gameCharacter.isPlummeting = false;
            gameCharacter.plummetSoundPlayed = false;
        } else {
            gameCharacter.isFalling = gameCharacter.vy > 0; // falling when moving downward
        }
    }

    // Platform collision (landing)
    // Approximate character bottom as g.y, and horizontal bounds as body width * 0.5
    const characterHalfWidth = BLOBBY.DIMENSIONS.BODY_WIDTH * 0.5;
    let onPlatform = false;
    if (gameCharacter.dropThroughFrames > 0) { gameCharacter.dropThroughFrames--; }
    else {
        for (const platform of state.platforms) {
            const withinX = gameCharacter.x + characterHalfWidth > platform.x_pos && gameCharacter.x - characterHalfWidth < platform.x_pos + platform.width;
            const closeToTop = abs(gameCharacter.y - platform.y_pos) < 5; // tolerance for landing
            const abovePlatform = gameCharacter.y <= platform.y_pos + 5; // not falling through from below
            if (withinX && closeToTop && abovePlatform) {
                gameCharacter.y = platform.y_pos; // snap to platform top
                gameCharacter.vy = 0;
                gameCharacter.isFalling = false;
                gameCharacter.isPlummeting = false;
                gameCharacter.plummetSoundPlayed = false;
                onPlatform = true;
                break;
            }
        }
    }
    if (!onPlatform && gameCharacter.y < state.floorPosY) { gameCharacter.isFalling = true; }

    for (let i = 0; i < state.canyons.length; i++) { checkCanyon(state.canyons[i]); }

    if (gameCharacter.isPlummeting) {
        gameCharacter.y += PLUMMET_SPEED;
        gameCharacter.vy = 0;
        gameCharacter.isLeft = false;
        gameCharacter.isRight = false;
    }
}

/** Collect coin when player overlaps. */
export function checkCollectable(collectible) {
    const gameCharacter = state.gameChar;
    if (dist(gameCharacter.x, gameCharacter.y, collectible.x_pos, collectible.y_pos) < 20) {
        state.sound.COLLECT.play();
        collectible.isFound = true;
        state.gameScore++;
    }
}

/** Trigger plummet when over canyon gap. */
export function checkCanyon(canyon) {
    const gameCharacter = state.gameChar;
    const isOverCanyon = gameCharacter.x > canyon.x_pos && gameCharacter.x < canyon.x_pos + canyon.width && gameCharacter.y >= state.floorPosY;
    if (isOverCanyon) {
        if (!gameCharacter.isPlummeting) {
            gameCharacter.isPlummeting = true;
            gameCharacter.plummetSoundPlayed = false; // reset flag at start
        }
        if (!gameCharacter.plummetSoundPlayed && state.sound.PLUMMET) {
            state.sound.PLUMMET.play();
            gameCharacter.plummetSoundPlayed = true;
        }
    }
}

/** Detect proximity to flag pole top. */
export function checkFinishLine() {
    const gameCharacter = state.gameChar;
    const finishFlag = state.flagPole;
    const isOverFinishLine = abs(gameCharacter.x - finishFlag.x_pos) < 10 && abs(gameCharacter.y - finishFlag.y_pos) < 10;
    if (isOverFinishLine) { finishFlag.isReached = true; }
}

/** Life loss + death state check. */
export function checkPlayerDie() {
    const gameCharacter = state.gameChar;
    if (gameCharacter.y > height) {
        const isLastLife = state.lives - 1 <= 0;
        if (isLastLife) {
            if (state.sound.LOST) state.sound.LOST.play();
        } else {
            state.sound.DEATH.play();
        }
        state.lives--;
        gameCharacter.reset(state.floorPosY);
        state.cameraPosX = 0;
    }
    if (state.lives <= 0 && state.loseFrame === null) {
        gameCharacter.isDead = true;
        state.loseFrame = frameCount;
        if (state.sound && state.sound.MUSIC && state.sound.MUSIC.isPlaying()) {
            state.sound.MUSIC.stop();
        }
    }
}

// (HUD functions moved to hud.js)

/** Draw pole and test for completion. */
export function drawFinishLine() {
    const f = state.flagPole;
    // Pole style
    push();
    const poleGradientSteps = 8;
    for (let i = 0; i < poleGradientSteps; i++) {
        const t = i / (poleGradientSteps - 1);
        const col = lerpColor(color(30,30,30), color(180,180,200), t);
        stroke(col);
        line(f.x_pos + i * (f.width / poleGradientSteps), f.y_pos, f.x_pos + i * (f.width / poleGradientSteps), f.y_pos - f.height);
    }
    noStroke();
    // Flag cloth
    const wave = sin(frameCount * 0.1) * 5;
    fill(255, 80, 120);
    beginShape();
    vertex(f.x_pos + f.width, f.y_pos - f.height);
    vertex(f.x_pos + f.width + 50, f.y_pos - f.height + wave);
    vertex(f.x_pos + f.width + 50, f.y_pos - f.height + 25 + wave * 0.5);
    vertex(f.x_pos + f.width, f.y_pos - f.height + 25);
    endShape(CLOSE);
    pop();
    if (!f.isReached) { checkFinishLine(); }
}

// (Win / Game Over banners moved to hud.js; particle spawn handled here when win triggered.)

export function ensureWinParticles() {
    if (state.winFrame === null) {
        state.winFrame = frameCount;
        state.sound.WIN.play();
        for (let i = 0; i < 120; i++) {
            state.particles.push({
                x: state.flagPole.x_pos + random(-40, 40),
                y: state.flagPole.y_pos - state.flagPole.height + random(-20, 20),
                vx: random(-2, 2),
                vy: random(-3, -1),
                life: random(40, 90),
                hue: random(0, 360)
            });
        }
    }
    if (frameCount % 5 === 0) {
        state.particles.push({
            x: state.flagPole.x_pos,
            y: state.flagPole.y_pos - state.flagPole.height,
            vx: random(-1, 1),
            vy: random(-2, -0.5),
            life: random(50, 80),
            hue: random(0, 360)
        });
    }
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.life--;
        if (p.life <= 0) { state.particles.splice(i, 1); }
    }
}
