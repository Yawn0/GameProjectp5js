/* Lightweight entity classes + simple factory helpers */

// Player avatar state container
class GameCharacter {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.isLeft = false;
        this.isRight = false;
        this.isFalling = false;
        this.isPlummeting = false;
        this.isDead = false;
    }
    reset(floorY) {
        this.x = width / 2;
        this.y = floorY;
        this.isFalling = false;
        this.isPlummeting = false;
    }
}

// Coin / pickup token
class Collectible {
    constructor(x, y, size = 40) {
        this.x_pos = x;
        this.y_pos = y;
        this.size = size;
        this.isFound = false;
    }
}

// Gap hazard
class Canyon {
    constructor(x, width = 80) {
        this.x_pos = x;
        this.width = width;
    }
}

// Level completion trigger
class FlagPole {
    constructor(x, y, width = 10, height = 100) {
        this.x_pos = x;
        this.y_pos = y;
        this.width = width;
        this.height = height;
        this.isReached = false;
    }
}

// Factories mimic former literal object creation; randomness preserved
const factory = {
    collectible: (y) => new Collectible(random(width), y),
    canyon: () => new Canyon(random(width)),
    clouds: (coords) => generateClouds(coords), // existing function in world.js
    flagPole: (x, y) => new FlagPole(x, y),
    gameChar: (floorY) => new GameCharacter(width / 2, floorY)
};
