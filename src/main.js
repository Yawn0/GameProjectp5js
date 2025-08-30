/* Main entry module: orchestrates p5 lifecycle using imported modules + shared state */
import { CANVAS_WIDTH, CANVAS_HEIGHT, FLOOR_HEIGHT_RATIO, WORLD_WIDTH, state } from './constants.js';
import { factory } from './entities.js';
import { drawGround, drawScenery, drawCollectible, drawSplash } from './world.js';
import { drawCharacter, checkPlayerDie, drawFinishLine, checkCollectable, ensureWinParticles } from './gameplay.js';
import { drawLives, drawGameScore, drawGameOver, drawGameWin, drawStartScreen, drawMusicToggle } from './hud.js';
import { keyPressed as gameplayKeyPressed, keyReleased as gameplayKeyReleased } from './gameplay.js';
import { startGame } from './generation.js';
import { handleWormCollisions } from './hazards.js';

export function keyPressed() { gameplayKeyPressed(); }
export function keyReleased() { gameplayKeyReleased(); }

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
    state.sound.MUSIC = loadSound('assets/music.mp3', (snd) =>
    {
        const vol = state.musicEnabled ? state.sound.baseVolume * 0.3 : 0;
        snd.setVolume(vol);
        snd.setLoop(true);
        // Don't autoplay until start screen dismissed
        if (!state.showStartScreen && state.musicEnabled)
        {
            try { snd.play(); } catch (e) { }
        }
    });
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    state.floorPosY = height * FLOOR_HEIGHT_RATIO;
    startGame();
};

window.draw = function draw()
{
    const gameCharacter = state.gameChar;
    background(100, 155, 255);

    // Camera follow (frozen while start screen visible to keep centered initial view)
    if (!state.showStartScreen)
    {
        state.cameraPosX = constrain(gameCharacter.x - CANVAS_WIDTH / 2, 0, WORLD_WIDTH - CANVAS_WIDTH);
    } else
    {
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

    handleWormCollisions();

    // Draw & update splashes (world space)
    for (let i = state.splashes.length - 1; i >= 0; i--)
    {
        const s = state.splashes[i];
        drawSplash(s);
        if (s.life <= 0) { state.splashes.splice(i, 1); }
    }

    if (!state.showStartScreen)
    {
        checkPlayerDie();
        if (!gameCharacter.isDead) { drawCharacter(); }
        for (let i = 0; i < state.collectables.length; i++)
        {
            const collectible = state.collectables[i];
            drawCollectible(collectible);
            checkCollectable(collectible);
            if (collectible.isFound) { state.collectables.splice(i, 1); i--; }
        }
        drawFinishLine();
        if (gameCharacter.isDead) { drawGameOver(); }
        if (state.flagPole.isReached || state.winFrame !== null)
        {
            ensureWinParticles();
            drawGameWin();
        }
    }

    pop();

    // HUD
    drawLives();
    drawGameScore();
    drawMusicToggle();
    drawStartScreen();
};

window.keyPressed = function ()
{
    if (state.showStartScreen)
    {
        state.showStartScreen = false;
        state.startScreenFade = 1; // begin fade out
        if (state.musicEnabled && state.sound && state.sound.MUSIC && !state.sound.MUSIC.isPlaying())
        {
            try 
            {
                state.sound.MUSIC.play();
            } catch (e) { }
        }
        return;
    }
    // Music toggle shortcut (M)
    if (key === 'm' || key === 'M')
    {
        state.musicEnabled = !state.musicEnabled;
        if (state.sound && state.sound.MUSIC)
        {
            const targetVol = state.musicEnabled ? state.sound.baseVolume * 0.3 : 0;
            state.sound.MUSIC.setVolume(targetVol);
            // Ensure music keeps playing silently when muted to resume instantly
            if (!state.sound.MUSIC.isPlaying()) 
            {
                try 
                {
                    state.sound.MUSIC.play();
                } catch (e) { }
            }
        }
        return;
    }
    keyPressed();
};
window.keyReleased = keyReleased;

// Mouse restart handler (UI buttons)
window.mousePressed = function ()
{
    if (state.showStartScreen)
    {
        state.showStartScreen = false;
        state.startScreenFade = 1;
        if (state.musicEnabled && state.sound && state.sound.MUSIC && !state.sound.MUSIC.isPlaying())
        {
            try
            {
                state.sound.MUSIC.play();
            } catch (e) { }
        }
        return;
    }

    // Music toggle
    if (state._musicBtn)
    {
        const { x, y, w, h } = state._musicBtn;
        if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h)
        {
            state.musicEnabled = !state.musicEnabled;
            if (state.sound && state.sound.MUSIC)
            {
                const targetVol = state.musicEnabled ? state.sound.baseVolume * 0.3 : 0;
                state.sound.MUSIC.setVolume(targetVol);
                if (!state.sound.MUSIC.isPlaying())
                {
                    try
                    {
                        state.sound.MUSIC.play();
                    } catch (e) { }
                }
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
    if (state.flagPole.isReached)
    {
        if (mouseX >= winBtnX
            && mouseX <= winBtnX + btnWWin
            && mouseY >= commonY
            && mouseY <= commonY + btnHWin) 
        {
            startGame();
        }
    } else if (state.loseFrame !== null)
    {
        if (mouseX >= overBtnX
            && mouseX <= overBtnX + btnWOver
            && mouseY >= commonY
            && mouseY <= commonY + btnHOver) 
        {
            startGame();
        }
    }
};

// Optional restart via R key at any end state
document.addEventListener('keydown', (eventObject) =>
{
    if (eventObject.key === 'r' || eventObject.key === 'R')
    {
        if (state.flagPole.isReached || state.loseFrame !== null) 
        {
            startGame();
        }
    }
});