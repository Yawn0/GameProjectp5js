/* Hazard handling logic (worm collisions & splash spawning)*/
import { state } from './constants.js';
import { factory } from './entities.js';

/**
 * Check player vs worms; spawn splash, play sounds, adjust lives & death state.
 */
export function handleWormCollisions() {
    const gameCharacter = state.gameChar;
    if (state.showStartScreen || !gameCharacter || gameCharacter.isDead) return;

    const charX = gameCharacter.x;
    for (let i = state.worms.length - 1; i >= 0; i--) {
        const worm = state.worms[i];
        const dx = abs(charX - worm.x);
        // Simple proximity & near-ground check
        if (dx < 20 && abs(gameCharacter.y - state.floorPosY) < 6) {
            // Splash effect
            const splash = factory.splash(worm.x, worm.y);
            splash.maxLife = 24;
            splash.life = splash.maxLife;
            state.splashes.push(splash);
            // Audio feedback
            if (state.sound && state.sound.WORM_DIE) {
                try { state.sound.WORM_DIE.rate(random(0.9, 1.1)); } catch (e) { }
                state.sound.WORM_DIE.play();
            }
            // Remove worm & life penalty
            state.worms.splice(i, 1);
            state.lives = max(0, state.lives - 1);
            if (state.lives <= 0 && state.loseFrame === null) {
                gameCharacter.isDead = true;
                state.loseFrame = frameCount;
                if (state.sound && state.sound.LOST) { state.sound.LOST.play(); }
                if (state.sound && state.sound.MUSIC && state.sound.MUSIC.isPlaying()) {
                    try { state.sound.MUSIC.stop(); } catch (e) { }
                }
            }
        }
    }
}
