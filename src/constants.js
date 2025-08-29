/* Core constants and central mutable state (ES module version).
    Naming & values preserved; state lives in exported object for live updates. */

// Canvas + physics
export const CANVAS_WIDTH = 1024;
export const CANVAS_HEIGHT = 576;
export const FLOOR_HEIGHT_RATIO = 3 / 4;
export const JUMP_HEIGHT = 100;
export const GRAVITY_SPEED = 3; // Blobby falls at this speed
export const PLUMMET_SPEED = 6; // Blobby falls faster when plummeting

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

// Mutable game state bucket (single export ensures shared live reference)
export const state = {
    _sound: null,
    _floorPos_y: 0,
    _cameraPosX: 0,
    _gameChar: null,
    _gameScore: 0,
    _trees_x: [],
    _cloudsCoordinates: [],
    _clouds: [],
    _mountains: [],
    _collectables: [],
    _canyons: [],
    _flagPole: null,
    _lives: 0
};

