/* HUD module: lives, score, end-state banners */
import { state, CANVAS_WIDTH, CANVAS_HEIGHT } from './constants.js';

/** Display remaining lives as hearts */
export function drawLives()
{
    for (let i = 0; i < state.lives; i++)
    {
        push();
        translate(32 + i * 42, 36); // screen-space now
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

/** Render current score HUD text */
export function drawGameScore()
{
    const margin = 20;
    const label = 'Score: ' + state.gameScore;
    textSize(26);
    const textW = textWidth(label);
    const boxPaddingX = 14;
    const xRight = CANVAS_WIDTH - margin; // screen-space
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

/** Game over banner + restart button */
export function drawGameOver()
{
    if (state.loseFrame === null) return; // not yet triggered
    push();
    resetMatrix();
    const elapsed = frameCount - state.loseFrame;
    const pulse = 0.5 + 0.5 * sin(elapsed * 0.12);
    textAlign(CENTER, CENTER);
    textSize(72);
    const scalePulse = 1 + pulse * 0.05;
    push();
    translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    scale(scalePulse);
    noStroke();
    fill(20, 0, 0, 160);
    text('GAME OVER', 4, 6);
    stroke(40, 0, 0, 200);
    strokeWeight(5);
    strokeJoin(ROUND);
    strokeCap(ROUND);
    fill(lerpColor(color(180, 0, 0), color(255, 90, 90), pulse));
    text('GAME OVER', 0, 0);
    pop();
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
    textSize(18);
    fill(255, 230);
    text('Press R to restart', CANVAS_WIDTH / 2, btnY + btnH + 32);
    pop();
}

/** Win banner + particle celebration (particles managed in gameplay). */
export function drawGameWin()
{
    if (state.winFrame === null) return; // gameplay triggers and sets winFrame
    push();
    resetMatrix();
    const elapsed = frameCount - state.winFrame;
    const pulse = 0.5 + 0.5 * sin(elapsed * 0.1);
    const gradient = lerpColor(color(255, 100, 150), color(255, 220, 80), pulse);
    textAlign(CENTER, CENTER);
    textSize(72);
    const scalePulseW = 1 + pulse * 0.05;
    push();
    translate(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 3);
    scale(scalePulseW);
    noStroke();
    fill(0, 0, 0, 140);
    text('GAME COMPLETED!', 4, 6);
    stroke(0, 160);
    strokeWeight(4.5);
    strokeJoin(ROUND);
    strokeCap(ROUND);
    fill(gradient);
    text('GAME COMPLETED!', 0, 0);
    pop();
    const btnW = 240, btnH = 60;
    const btnX = CANVAS_WIDTH / 2 - btnW / 2;
    const btnY = CANVAS_HEIGHT / 3 + 120;
    const hover = mouseX >= btnX && mouseX <= btnX + btnW && mouseY >= btnY && mouseY <= btnY + btnH;
    noStroke();
    fill(hover ? color(255, 200, 0) : color(255, 170, 0));
    rect(btnX, btnY, btnW, btnH, 14);
    fill(60);
    textSize(32);
    text('RESTART', CANVAS_WIDTH / 2, btnY + btnH / 2 + 4);
    textSize(18);
    fill(255, 240);
    text('Press R to restart', CANVAS_WIDTH / 2, btnY + btnH + 32);
    pop();
}

/** Music toggle button */
export function drawMusicToggle()
{
    if (!state.sound || !state.sound.MUSIC) return;
    const label = 'Music: ' + (state.musicEnabled ? 'ON' : 'OFF');
    textSize(16);
    const paddingX = 12;
    const paddingY = 8;
    const w = textWidth(label) + paddingX * 2;
    const h = 34;
    const x = CANVAS_WIDTH - w - 20; // screen-space
    const y = 70; // below score
    const hover = mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h;
    noStroke();
    fill(0, 0, 0, 140);
    rect(x + 3, y + 3, w, h, 8);
    fill(state.musicEnabled ? (hover ? 80 : 50) : (hover ? 150 : 120), state.musicEnabled ? 180 : 50, 70, 230);
    stroke(0);
    strokeWeight(2);
    rect(x, y, w, h, 8);
    noStroke();
    fill(255);
    textAlign(CENTER, CENTER);
    text(label, x + w / 2, y + h / 2 + 1);
    // Store bounds for click detection
    state._musicBtn = { x, y, w, h }; // store screen coords
}

/** Displays screen overlay listing controls. Fades out on first key / click. */
export function drawStartScreen()
{
    if (!state.showStartScreen && state.startScreenFade <= 0) return;
    // Advance fade if hidden
    if (!state.showStartScreen && state.startScreenFade > 0)
    {
        state.startScreenFade = max(0, state.startScreenFade - 0.04);
    }
    const alpha = state.showStartScreen ? 1 : state.startScreenFade; // 1 while visible, then fade out
    push();
    resetMatrix();
    noStroke();
    fill(20, 30, 50, 220 * alpha);
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    textAlign(LEFT, TOP);
    fill(255, 240 * alpha);
    const marginX = 80;
    textSize(64);
    text('BLOBBY ADVENTURE', marginX, 70);
    textSize(28);
    fill(255, 70, 70, 240 * alpha);
    text("Don't kill the worms!", marginX, 70 + 64 + 12);
    fill(255, 240 * alpha);
    textSize(22);
    const lines = [
        'Controls:',
        'A / Left Arrow  - Move Left',
        'D / Right Arrow - Move Right',
        'W / Up Arrow / Space - Jump',
        'S / Down Arrow - Drop through platform',
        'R - Restart after win / game over (or click Restart button)',
        'M - Toggle music (or click Music button)',
        '',
        'Press any key or click to start'
    ];
    let y = 170 + 28; // push list slightly down after subtitle
    for (const line of lines) 
    { 
        text(line, marginX, y); 
        y += 32; 
    }
    pop();
}
