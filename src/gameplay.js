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
    // Start background music if blocked earlier
    if (state.sound && state.sound.MUSIC && !state.sound.MUSIC.isPlaying()) {
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
export function checkCollectable(t_collectible) {
    const gameCharacter = state.gameChar;
    if (dist(gameCharacter.x, gameCharacter.y, t_collectible.x_pos, t_collectible.y_pos) < 20) {
        state.sound.COLLECT.play();
        t_collectible.isFound = true;
        state.gameScore++;
    }
}

/** Trigger plummet when over canyon gap. */
export function checkCanyon(t_canyon) {
    const gameCharacter = state.gameChar;
    const isOverCanyon = gameCharacter.x > t_canyon.x_pos && gameCharacter.x < t_canyon.x_pos + t_canyon.width && gameCharacter.y >= state.floorPosY;
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

/** Display remaining lives as hearts. */
export function drawLives() {
    for (let i = 0; i < state.lives; i++) {
        push();
        translate(state.cameraPosX + 32 + i * 42, 36);
        const scaleFactor = 1.1;
        scale(scaleFactor);
        stroke(0);
        strokeWeight(2.2);
        fill(235, 30, 60);
        beginShape();
        vertex(0, 0);
        bezierVertex(-10, -12, -22, 2, 0, 14);
        bezierVertex(22, 2, 10, -12, 0, 0);
        endShape(CLOSE);
        // Inner shine
        noStroke();
        fill(255, 180, 200, 180);
        ellipse(-4, -2, 8, 5);
        pop();
    }
}

/** Render current score HUD text. */
export function drawGameScore() {
    const margin = 20;
    const label = 'Score: ' + state.gameScore;
    textSize(26);
    const textW = textWidth(label);
    const boxPaddingX = 14;
    const boxPaddingY = 10;
    const xRight = state.cameraPosX + CANVAS_WIDTH - margin;
    const boxX = xRight - textW - boxPaddingX * 2;
    const boxY = 20;
    // Background badge
    noStroke();
    fill(0, 0, 0, 120);
    rect(boxX + 3, boxY + 3, textW + boxPaddingX * 2, 40, 10); // drop shadow
    fill(255, 230, 120, 230);
    stroke(0);
    strokeWeight(2);
    rect(boxX, boxY, textW + boxPaddingX * 2, 40, 10);
    // Text
    fill(40);
    noStroke();
    textAlign(LEFT, CENTER);
    text(label, boxX + boxPaddingX, boxY + 20);
}

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

/** Game over banner. */
export function drawGameOver() {
    if (state.loseFrame === null) return; // not yet triggered
    // Screen overlay
    push();
    resetMatrix();
    const elapsed = frameCount - state.loseFrame;
    const pulse = 0.5 + 0.5 * sin(elapsed * 0.12);
    textAlign(CENTER, CENTER);
    const baseSizeGO = 72;
    textSize(baseSizeGO);
    const scalePulse = 1 + pulse * 0.05; // gentle scale instead of re-rasterizing font size each frame
    push();
    translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    scale(scalePulse);
    // Soft shadow
    noStroke();
    fill(20,0,0,160);
    text('GAME OVER', 4, 6);
    // Main outline using rounded joins to prevent spikes
    stroke(40,0,0,200);
    strokeWeight(5);
    strokeJoin(ROUND);
    strokeCap(ROUND);
    fill(lerpColor(color(180,0,0), color(255,90,90), pulse));
    text('GAME OVER', 0, 0);
    pop();
    // Restart button
    const btnW = 220, btnH = 60;
    const btnX = CANVAS_WIDTH / 2 - btnW / 2;
    const btnY = CANVAS_HEIGHT / 3 + 120;
    noStroke();
    const hover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    fill(hover ? 255 : 230, 60, 60);
    rect(btnX, btnY, btnW, btnH, 12);
    fill(255);
    textSize(32);
    text('RESTART', CANVAS_WIDTH / 2, btnY + btnH / 2 + 4);
    // Keyboard hint
    textSize(18);
    fill(255, 230);
    text('Press R to restart', CANVAS_WIDTH / 2, btnY + btnH + 32);
    pop();
}

/** Win banner + sound. */
export function drawGameWin() {
    if (state.winFrame === null) {
        state.winFrame = frameCount;
        state.sound.WIN.play();
        // spawn initial burst of particles
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
    // Continuous small trickle
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
    // Update and draw particles (world space)
    for (let i = state.particles.length - 1; i >= 0; i--) {
        const p = state.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05; // gravity
        p.life--;
        if (p.life <= 0) { state.particles.splice(i, 1); continue; }
        push();
        colorMode(HSB, 360, 100, 100, 100);
        noStroke();
        fill(p.hue, 80, 100, map(p.life, 0, 90, 0, 100));
        ellipse(p.x, p.y, 6, 6);
        pop();
    }
    // Screen-fixed win banner (independent of camera)
    push();
    resetMatrix();
    const elapsed = frameCount - state.winFrame;
    const pulse = 0.5 + 0.5 * sin(elapsed * 0.1);
    const gradient = lerpColor(color(255, 100, 150), color(255, 220, 80), pulse);
    textAlign(CENTER, CENTER);
    const baseSizeWin = 72;
    textSize(baseSizeWin);
    const scalePulseW = 1 + pulse * 0.05;
    push();
    translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    scale(scalePulseW);
    // Shadow
    noStroke();
    fill(0,0,0,140);
    text('GAME COMPLETED!', 4, 6);
    // Main
    stroke(0, 160);
    strokeWeight(4.5);
    strokeJoin(ROUND);
    strokeCap(ROUND);
    fill(gradient);
    text('GAME COMPLETED!', 0, 0);
    pop();
    // Restart button
    const btnW = 240, btnH = 60;
    const btnX = CANVAS_WIDTH / 2 - btnW / 2;
    const btnY = CANVAS_HEIGHT / 3 + 120;
    const hover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    noStroke();
    fill(hover ? color(255,200,0) : color(255,170,0));
    rect(btnX, btnY, btnW, btnH, 14);
    fill(60);
    textSize(32);
    text('RESTART', CANVAS_WIDTH / 2, btnY + btnH / 2 + 4);
    // Keyboard hint
    textSize(18);
    fill(255, 240);
    text('Press R to restart', CANVAS_WIDTH / 2, btnY + btnH + 32);
    pop();
}
