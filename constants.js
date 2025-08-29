/* Core constants and global state holders.
    Values and naming preserved intentionally. */

// Canvas + physics
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const FLOOR_HEIGHT_RATIO = 3 / 4;
const JUMP_HEIGHT = 100;
const GRAVITY_SPEED = 3; // Blobby falls at this speed
const PLUMMET_SPEED = 6; // Blobby falls faster when plummeting

// Blobby sprite metrics + palette
const BLOBBY = {
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

// Mutable game state (initialized in setup/startGame). Using var to remain p5 global-friendly.
var _sound;
var _floorPos_y;
var _cameraPosX;
var _gameChar;
var _gameScore;
var _trees_x;
var _cloudsCoordinates;
var _clouds;
var _mountains;
var _collectables = [];
var _canyons = [];
var _flagPole;
var _lives;
