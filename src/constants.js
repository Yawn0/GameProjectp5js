/* Core constants and central mutable state */

// Canvas + physics
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 576;
// World extends beyond visible canvas
// World width RANDOMIZED each new game (multiple of canvas width 2..5). Initialized with a default.
export let WORLD_WIDTH = CANVAS_WIDTH * 4; // overwritten each start
export function setWorldWidth(w) { WORLD_WIDTH = w; }
export const FLOOR_HEIGHT_RATIO = 3 / 4;
export const JUMP_HEIGHT = 100;
export const GRAVITY_SPEED = 3; // Blobby falls at this speed
export const PLUMMET_SPEED = 6; // Blobby falls faster when plummeting
// Physics parameters for smooth jump
export const GRAVITY_ACCEL = 0.6; // per-frame downward acceleration
export const JUMP_VELOCITY = 12; // initial upward speed (positive magnitude; applied as negative)

// Blobby sprite metrics + palette
export const BLOBBY = {
    COLORS: {
        BODY: [100, 180, 255],
        EYE: [255, 255, 255],
        PUPIL: [0, 0, 0],
        MOUTH: [0, 0, 0],
        FEET: [80, 150, 220],
        ARM: [80, 150, 220]
    },
    DIMENSIONS: {
        BODY_WIDTH: 40,
        BODY_HEIGHT: 45,
        EYE_SIZE: 8,
        PUPIL_SIZE: 4,
        FEET_WIDTH: 12,
        FEET_HEIGHT: 8,
        ARM_WIDTH: 5,
        ARM_LENGTH: 10
    },
    SPEED: 3,
    EYEBROW_START: Math.PI + 0.3,
    EYEBROW_STOP: Math.PI * 2 - 0.3
};

// Mutable game state
export const state = {
    sound: null,
    floorPosY: 0,
    cameraPosX: 0,
    gameChar: null,
    gameScore: 0,
    // Decorative & interactive collections
    trees: [],       // tree objects
    trees2: [],      // mid-layer parallax trees
    trees3: [],      // far-layer parallax trees
    cloudsCoordinates: [],
    clouds: [],
    mountains: [],
    collectables: [],
    canyons: [],
    platforms: [],
    hills: [],        // distant parallax hills
    rocks: [],        // small ground rocks
    flowers: [],      // colorful flowers
    grassTufts: [],   // small grass clumps
    worms: [],        // crawling ground critters
    splashes: [],     // temporary worm death splash effects
    flagPole: null,
    lives: 0,
    particles: [],    // win celebration particles
    winFrame: null,   // frameCount when flag reached
    loseFrame: null,  // frameCount when game lost
    windPhase: 0,     // evolving phase used to sample noise for wind
    windValue: 0,     // current normalized wind strength (-1..1)

    // UI / meta state
    showStartScreen: true,  // start instructions visible
    startScreenFade: 0,     // 0..1 fade progress
    musicEnabled: true      // user toggle for music
};

