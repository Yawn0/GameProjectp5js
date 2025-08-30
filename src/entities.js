/* Lightweight entity classes + simple factory helpers (ES module) */
import { generateClouds } from './world.js';
import { WORLD_WIDTH } from './constants.js';

// Player avatar state container
export class GameCharacter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    this.vy = 0; // vertical velocity
        this.isLeft = false;
        this.isRight = false;
        this.isFalling = false;
        this.isPlummeting = false;
        this.isDead = false;
    this.dropThroughFrames = 0; // frames remaining to ignore platforms
    this.plummetSoundPlayed = false; // prevent repeat sound
    this.walkCycle = 0; // phase accumulator for walking animation
    }
    reset(floorY) {
        this.x = width / 2;
        this.y = floorY;
    this.vy = 0;
        this.isFalling = false;
        this.isPlummeting = false;
    this.dropThroughFrames = 0;
    this.plummetSoundPlayed = false;
    this.walkCycle = 0;
    }
}

// Coin / pickup token
export class Collectible {
    constructor(x, y, size = 32) { // reduced default size
        this.x_pos = x;
        this.y_pos = y;
        this.size = size;
        this.isFound = false;
    }
}

// Gap hazard
export class Canyon {
    constructor(x, width = 80) {
        this.x_pos = x;
        this.width = width;
    }
}

// Walkable horizontal platform
export class Platform {
    constructor(x, y, width = 120, height = 12, level = 0) {
        this.x_pos = x;
        this.y_pos = y; // top surface Y
        this.width = width;
        this.height = height;
        this.level = level; // 0 = first layer, 1 = second layer, etc.
    }
}

// Level completion trigger
export class FlagPole {
    constructor(x, y, width = 10, height = 100) {
        this.x_pos = x;
        this.y_pos = y;
        this.width = width;
        this.height = height;
        this.isReached = false;
    }
}

// Factories mimic former literal object creation; randomness preserved
export const factory = {
    collectible: (y) => new Collectible(random(WORLD_WIDTH), y),
    canyon: () => new Canyon(random(WORLD_WIDTH)),
    clouds: (coords) => generateClouds(coords), // relies on world.js exported fn
    platform: (x, y, w, h, level) => new Platform(x, y, w, h, level),
    flagPole: (x, y) => new FlagPole(x, y),
    gameChar: (floorY) => new GameCharacter(width / 2, floorY)
};
