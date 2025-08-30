/* Gameplay loop helpers: input, physics, scoring, UI (ES module) */
import { BLOBBY, JUMP_HEIGHT, GRAVITY_SPEED, PLUMMET_SPEED, CANVAS_WIDTH, CANVAS_HEIGHT, state, GRAVITY_ACCEL, JUMP_VELOCITY } from './constants.js';
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
    if ((state.flagPole && state.flagPole.isReached) || state.loseFrame !== null) { return; }
    if (g.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) { g.isLeft = true; }
    else if (directionKey === RIGHT_ARROW) { g.isRight = true; }
    else if (directionKey === UP_ARROW && !g.isFalling) {
        state.sound.JUMP.play();
        // Initiate smooth jump: set upward velocity
        g.vy = -JUMP_VELOCITY;
        g.isFalling = true;
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
    if ((state.flagPole && state.flagPole.isReached) || state.loseFrame !== null) { return; }
    if (g.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) { g.isLeft = false; }
    else if (directionKey === RIGHT_ARROW) { g.isRight = false; }
}

/** Advance character physics + pick proper animation. */
export function drawCharacter() {
    const g = state.gameChar;
    // Freeze character once level completed
    if ((state.flagPole && state.flagPole.isReached) || state.loseFrame !== null) {
        blobbyStandingFront();
        return;
    }
    if (g.isLeft && g.isFalling) { blobbyJumpingLeft(); }
    else if (g.isRight && g.isFalling) { blobbyJumpingRight(); }
    else if (g.isLeft) { blobbyWalkingLeft(); }
    else if (g.isRight) { blobbyWalkingRight(); }
    else if (g.isFalling || g.isPlummeting) { blobbyJumping(); }
    else { blobbyStandingFront(); }

    if (g.isLeft) { g.x -= BLOBBY.SPEED; }
    else if (g.isRight) { g.x += BLOBBY.SPEED; }

    // Apply gravity + velocity integration
    if (g.isPlummeting) {
        // plummeting handled later
    } else {
        g.vy += GRAVITY_ACCEL; // accumulate gravity
        g.y += g.vy;
        if (g.y >= state.floorPosY) {
            g.y = state.floorPosY;
            g.vy = 0;
            g.isFalling = false;
        } else {
            g.isFalling = g.vy > 0; // falling when moving downward
        }
    }

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
                g.vy = 0;
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
        g.vy = 0;
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
        const isLastLife = state.lives - 1 <= 0;
        if (isLastLife) {
            if (state.sound.LOST) state.sound.LOST.play();
        } else {
            state.sound.DEATH.play();
        }
        state.lives--;
        g.reset(state.floorPosY);
        state.cameraPosX = 0;
    }
    if (state.lives <= 0 && state.loseFrame === null) {
        g.isDead = true;
        state.loseFrame = frameCount;
        // LOST sound already handled when last life was consumed
    }
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
    textSize(72 + pulse * 8);
    stroke(40, 0, 0, 180);
    strokeWeight(8);
    fill(lerpColor(color(180,0,0), color(255,90,90), pulse));
    text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
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
    textSize(72 + pulse * 8);
    stroke(0, 150);
    strokeWeight(6);
    fill(gradient);
    text('GAME COMPLETED!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
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
    pop();
}
