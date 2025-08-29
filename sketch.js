/*

The Game Project

*/

// --- Global constants ---
// Canvas and gameplay constants
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const FLOOR_HEIGHT_RATIO = 3 / 4;
const JUMP_HEIGHT = 100;
const GRAVITY_SPEED = 3; // Blobby falls at this speed
const PLUMMET_SPEED = 6; // Blobby falls faster when plummeting

// Used objects where possible for clarity and ease of maintenance

// Blobby character appearance and movement constants
const BLOBBY = {
    COLORS: {
        BODY: [100, 180, 255],// Light blue
        EYE: [255, 255, 255], // White
        PUPIL: [0, 0, 0],// Black
        MOUTH: [0, 0, 0],
        FEET: [80, 150, 220],// Darker blue
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

var _sound;

// --- Global variables ---
// Game state and world objects
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

// Initializes game state and objects
function setup()
{
    soundFormats('mp3', 'wav');

    _sound = {
        baseVolume: 0.1,
        JUMP: loadSound('assets/jump.wav'),
        COLLECT: loadSound('assets/collect.wav'),
        DEATH: loadSound('assets/death.wav'),
        WIN: loadSound('assets/win.wav'),
    };
    _sound.JUMP.setVolume(_sound.baseVolume);
    _sound.COLLECT.setVolume(_sound.baseVolume);
    _sound.DEATH.setVolume(_sound.baseVolume);
    _sound.WIN.setVolume(_sound.baseVolume);

    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

    _floorPos_y = height * FLOOR_HEIGHT_RATIO;

    startGame();
}

// Main game loop: updates camera, draws world, handles collectible logic
// The logic is split into functions for clarity and ease of maintenance
function draw()
{
    _cameraPosX += _gameChar.isLeft ? -BLOBBY.SPEED
        : _gameChar.isRight ? BLOBBY.SPEED : 0;

    background(100, 155, 255);

    drawGround();

    translate(-_cameraPosX, 0)

    drawScenery();

    checkPlayerDie();

    if (!_gameChar.isDead) {
        drawCharacter();
    }

    for (let i = 0; i < _collectables.length; i++) {
        drawCollectible(_collectables[i]);
        checkCollectable(_collectables[i]);
        if (_collectables[i].isFound) {
            _collectables.splice(i, 1);
        }
    }

    drawLives();

    drawGameScore();

    drawFinishLine();

    if (_gameChar.isDead) {
        drawGameOver();
    }

    if (_flagPole.isReached) {
        drawGameWin();
        _flagPole.isReached = false;
    }
}

function startGame(){

    _lives = 3;

    _cameraPosX = 0;

    // Initialize game character
    _gameChar = {
        x: width / 2,
        y: _floorPos_y,
        isLeft: false,
        isRight: false,
        isFalling: false,
        isPlummeting: false,
        isDead: false,
        reset: function(){
            this.x = width / 2;
            this.y = _floorPos_y;
            this.isFalling = false;
            this.isPlummeting = false;
        }
    };

    _gameScore = 0;

    generateCollectables();

    generateCanyons();

    // Tree positions
    _trees_x = [85, 300, 450, 700, 850];

    // Two different variables used for clouds to create them randomly:
    // 1. Cloud coordinates (for cloud generation)
    // 2. Generate clouds from coordinates using random sizes
    // So in this case there will be 6 clouds generated
    _cloudsCoordinates = [
        { x_pos: 100, y_pos: 100 },
        { x_pos: 200, y_pos: 80 },
        { x_pos: 500, y_pos: 120 },
        { x_pos: 600, y_pos: 90 },
        { x_pos: 800, y_pos: 100 },
        { x_pos: 1000, y_pos: 110 }
    ]
    _clouds = generateClouds(_cloudsCoordinates);

    // Mountain objects
    _mountains = [
        { x_pos: 0, width: 1 },
        { x_pos: 600, width: 1.1 },
        { x_pos: 450, width: 1.2 },
        { x_pos: 300, width: 0.6 },
    ]

    _flagPole = {
        x_pos: 1300,
        y_pos: _floorPos_y,
        width: 10,
        height: 100,
        isReached: false,
    }
}

function generateCanyons(){
    for (let i = 0; i < 2; i++) {
        let canyon = {
            x_pos: random(width),
            width: 80
        };
        _canyons.push(canyon);
    }
}

function generateCollectables(){
    for (let i = 0; i < 4; i++) {
        let collectible = {
            x_pos: random(width),
            y_pos: _floorPos_y,
            size: 40,
            isFound: false
        };
        _collectables.push(collectible);
    }
}

// --- Input handling ---
// Maps key codes to movement directions
function getDirectionalKey(keyCode)
{
    if (keyCode == 65 || keyCode == LEFT_ARROW) return LEFT_ARROW;
    if (keyCode == 68 || keyCode == RIGHT_ARROW) return RIGHT_ARROW;
    if (keyCode == 87 || keyCode == UP_ARROW || keyCode == 32) return UP_ARROW;
    return '';
}

// Handles key press events for movement and jumping
function keyPressed()
{
    if (_gameChar.isPlummeting) return;

    let directionKey = getDirectionalKey(keyCode);

    if (directionKey === LEFT_ARROW)
    {
        _gameChar.isLeft = true;
    } else if (directionKey === RIGHT_ARROW)
    {
        _gameChar.isRight = true;
    } else if (directionKey === UP_ARROW && !_gameChar.isFalling)
    {
        _sound.JUMP.play();
        _gameChar.y -= JUMP_HEIGHT; // Make character jump
    }
}

// Handles key release events to stop movement
function keyReleased()
{
    if (_gameChar.isPlummeting) return;

    let directionKey = getDirectionalKey(keyCode);

    if (directionKey === LEFT_ARROW)
    {
        _gameChar.isLeft = false;
    } else if (directionKey === RIGHT_ARROW)
    {
        _gameChar.isRight = false;
    }
}

// --- Game Character Logic ---
// Draws and updates the main character's state and animation
function drawCharacter()
{
	// Select animation based on movement state
	if (_gameChar.isLeft && _gameChar.isFalling)
		blobbyJumpingLeft();
	else if (_gameChar.isRight && _gameChar.isFalling)
		blobbyJumpingRight();
	else if (_gameChar.isLeft)
		blobbyWalkingLeft();
	else if (_gameChar.isRight)
		blobbyWalkingRight();
	else if (_gameChar.isFalling || _gameChar.isPlummeting)
		blobbyJumping();
	else
		blobbyStandingFront();

	// Move character horizontally
	if (_gameChar.isLeft)
		_gameChar.x -= BLOBBY.SPEED;
	else if (_gameChar.isRight)
		_gameChar.x += BLOBBY.SPEED;

    
    // Apply gravity if above floor
	if (_gameChar.y < _floorPos_y)
    {
        _gameChar.y += GRAVITY_SPEED;
        _gameChar.isFalling = true;
    }
    else
    {
        _gameChar.isFalling = false;
    }
    
    for (let i = 0; i < _canyons.length; i++)
    {
        checkCanyon(_canyons[i]);
    }

	// Plummet if over canyon
	if (_gameChar.isPlummeting)
	{
		_gameChar.y += PLUMMET_SPEED;
		_gameChar.isLeft = false;
		_gameChar.isRight = false;
	}
}

function drawLives()
{
    fill(0);
    textSize(32);
    // draw lives hearts tokens to represent the remaining lives
    for (let i = 0; i < _lives; i++) {
        // Draw heart shape for each life
        push();
        translate(_cameraPosX + 30 + i * 40, 30);
        
        // Heart color
        fill(255, 0, 0);
        noStroke();
        
        // Draw heart using bezier curves
        beginShape();
        vertex(0, 0);
        bezierVertex(-10, -10, -20, 0, 0, 10);
        bezierVertex(20, 0, 10, -10, 0, 0);
        endShape();
        
        pop();
    }
}

function checkPlayerDie(){
    if (_gameChar.y > height)
    {
        _sound.DEATH.play();
        _lives--;
        _gameChar.reset();
        _cameraPosX = 0;
    }

    if(_lives <= 0)
    {
        _gameChar.isDead = true;
    }
}

function drawGameScore()
{
    fill(0);
    textSize(26);
    text("Score: " + _gameScore, _cameraPosX + 20, 70);
}

function drawFinishLine()
{
    fill(0);
    if (_flagPole.isReached)
    {
        fill(200);
    }
    else{
        checkFinishLine();
    }
    rect(_flagPole.x_pos, _flagPole.y_pos, _flagPole.width, -_flagPole.height);
}

function drawGameOver()
{
    fill(0);
    textSize(32);
    text("Game Over", _cameraPosX + 20, 100);
}

function drawGameWin()
{
    _sound.WIN.play();
    fill(0);
    textSize(32);
    text("level complete", _cameraPosX + 20, 100);
}

// --- Blobby Drawing Functions ---
// Each function draws Blobby in a different pose

function blobbyStandingFront()
{
    // Feet
    stroke(0);
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT);
    // Body
    fill(BLOBBY.COLORS.BODY);
    ellipse(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT);
    // Arms
    fill(BLOBBY.COLORS.ARM);
    rect(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.4, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (vertical)
    rect(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH / 2 - BLOBBY.DIMENSIONS.ARM_WIDTH, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.4, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Right arm (vertical)
    noStroke();
    // Eyes
    fill(BLOBBY.COLORS.EYE);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
    fill(BLOBBY.COLORS.PUPIL);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
    // Eyebrows
    stroke(BLOBBY.COLORS.PUPIL);
    noFill();
    arc(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    arc(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    // Mouth
    stroke(BLOBBY.COLORS.MOUTH);
    noFill();
    arc(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, 10, 5, 0, PI);
}

function blobbyJumping()
{
    // Feet (tucked in)
    stroke(0);
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.15, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.8, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.8);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.15, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.8, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.8);
    // Body
    fill(BLOBBY.COLORS.BODY);
    ellipse(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT * 1.1); // Slightly stretched
    // Arms
    fill(BLOBBY.COLORS.ARM);
    rect(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2 + 2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (slightly lower vertical)
    rect(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH / 2 - BLOBBY.DIMENSIONS.ARM_WIDTH - 2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Right arm (slightly lower vertical)
    noStroke();
    // Eyes (wide)
    fill(BLOBBY.COLORS.EYE);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2);
    fill(BLOBBY.COLORS.PUPIL);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
    // Eyebrows
    stroke(BLOBBY.COLORS.PUPIL);
    noFill();
    arc(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.7, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    arc(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.7, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    // Mouth (o shape)
    noStroke();
    fill(BLOBBY.COLORS.MOUTH);
    ellipse(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, 8, 8);
}

function blobbyWalkingLeft()
{
    // Blobby - Walking left
    stroke(0);
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 + 3, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH * 1.1, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Front foot slightly bigger
    // Body
    fill(BLOBBY.COLORS.BODY);
    ellipse(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT);
    // Feet (one forward, one back)
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1 + 3, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Back foot
    // Arms
    fill(BLOBBY.COLORS.ARM);
    rect(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2 + 20, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (slightly lower vertical)
    noStroke();
    // Eye (one visible, side view)
    fill(BLOBBY.COLORS.EYE);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
    fill(BLOBBY.COLORS.PUPIL);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 - 1, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE); // Pupil looking left
    // Eyebrow
    stroke(BLOBBY.COLORS.PUPIL);
    noFill();
    arc(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    // Mouth (side)
    stroke(BLOBBY.COLORS.MOUTH);
    line(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.3, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, _gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35);

}

function blobbyWalkingRight()
{
    stroke(0);
    // Blobby - Walking right
    // Foot back
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 - 3, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH * 1.1, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Front foot slightly bigger
    // Body
    fill(BLOBBY.COLORS.BODY);
    ellipse(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT);
    // Foot forward
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1 - 3, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Back foot
    // Arms
    fill(BLOBBY.COLORS.ARM);
    rect(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2 + 15, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (slightly lower vertical)
    noStroke();
    // Eye (one visible, side view)
    fill(BLOBBY.COLORS.EYE);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
    fill(BLOBBY.COLORS.PUPIL);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 + 1, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE); // Pupil looking right
    // Eyebrow
    stroke(BLOBBY.COLORS.PUPIL);
    noFill();
    arc(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    // Mouth (side)
    stroke(BLOBBY.COLORS.MOUTH);
    line(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, _gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.3, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35);
}

function blobbyJumpingLeft()
{
    // Feet (swept back)
    stroke(0);
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.9, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.9);
    // Body (slightly tilted)
    push();
    translate(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2);
    rotate(-PI / 12.0); // Tilt left
    fill(BLOBBY.COLORS.BODY);
    ellipse(0, 0, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT * 1.05);
    // Arms (swept back, inside push/pop)
    fill(BLOBBY.COLORS.ARM);
    rect(BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2 - BLOBBY.DIMENSIONS.ARM_LENGTH * 1.2, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.1 + 10, BLOBBY.DIMENSIONS.ARM_LENGTH * 1.2, BLOBBY.DIMENSIONS.ARM_WIDTH, 5); // Right arm
    noStroke();
    // Eye (looking left)
    fill(BLOBBY.COLORS.EYE);
    ellipse(-BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.1, BLOBBY.DIMENSIONS.EYE_SIZE * 1.1, BLOBBY.DIMENSIONS.EYE_SIZE * 1.1);
    fill(BLOBBY.COLORS.PUPIL);
    ellipse(-BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 - 1, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.1, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
    // Eyebrow
    stroke(BLOBBY.COLORS.PUPIL);
    noFill();
    arc(-BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    // Mouth (o shape)
    noStroke();
    fill(BLOBBY.COLORS.MOUTH);
    ellipse(-BLOBBY.DIMENSIONS.BODY_WIDTH * 0.4, BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.2, 6, 6);

    pop();
}

function blobbyJumpingRight()
{
    // Feet (swept back)
    stroke(0);
    fill(BLOBBY.COLORS.FEET);
    ellipse(_gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, _gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.9, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.9);
    // Body (slightly tilted)
    push();
    translate(_gameChar.x, _gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2);
    rotate(PI / 12.0); // Tilt right
    fill(BLOBBY.COLORS.BODY);
    ellipse(0, 0, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT * 1.05);
    // Arms (swept back, inside push/pop)
    fill(BLOBBY.COLORS.ARM);
    rect(-BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.1 + 10, BLOBBY.DIMENSIONS.ARM_LENGTH * 1.2, BLOBBY.DIMENSIONS.ARM_WIDTH, 5); // Left arm
    noStroke();
    // Eye (looking right)
    fill(BLOBBY.COLORS.EYE);
    ellipse(BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.1, BLOBBY.DIMENSIONS.EYE_SIZE * 1.1, BLOBBY.DIMENSIONS.EYE_SIZE * 1.1);
    fill(BLOBBY.COLORS.PUPIL);
    ellipse(BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 + 1, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.1, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
    // Eyebrow
    stroke(BLOBBY.COLORS.PUPIL);
    noFill();
    arc(BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, -BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
    // Mouth (o shape)
    noStroke();
    fill(BLOBBY.COLORS.MOUTH);
    ellipse(-BLOBBY.DIMENSIONS.BODY_WIDTH * -0.4, BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.2, 6, 6);

    pop();
}

// --- World Drawing Functions ---

// Draws the ground
function drawGround()
{
    noStroke();
    fill(0, 155, 0);
    rect(0, _floorPos_y, width, height - _floorPos_y); //the ground
}

// Draws all scenery objects (canyon, mountains, trees, clouds)
function drawScenery()
{
    for (let i = 0; i < _canyons.length; i++)
    {
        drawCanyon(_canyons[i], _floorPos_y);
    }
    for (let i = 0; i < _mountains.length; i++)
    {
        drawMountain(_mountains[i], _floorPos_y);
    }
    for (let i = 0; i < _trees_x.length; i++)
    {
        drawTree(_trees_x[i], _floorPos_y);
    }
    for (let i = 0; i < _clouds.length; i++)
    {
        drawCloud(_clouds[i]);
    }
}

// Check for collectable pickup
function checkCollectable(t_collectible)
{
    if (dist(_gameChar.x, _gameChar.y, t_collectible.x_pos, t_collectible.y_pos) < 20)
    {
        _sound.COLLECT.play();
        t_collectible.isFound = true;
        _gameScore++;
    }
}

// Draws the collectible item
function drawCollectible(t_collectible)
{
    if (!t_collectible.isFound)
    {
        stroke(0);
        fill(255, 215, 0);
        ellipse(t_collectible.x_pos, t_collectible.y_pos - (t_collectible.size / 2), t_collectible.size);
        fill(255, 255, 255);
        ellipse(t_collectible.x_pos, t_collectible.y_pos - (t_collectible.size / 2), t_collectible.size * 0.65);
        fill(255, 215, 0);
        ellipse(t_collectible.x_pos, t_collectible.y_pos - (t_collectible.size / 2), t_collectible.size * 0.25);
    }
}

// Check if character is over the canyon
function checkCanyon(t_canyon)
{
    const isOverCanyon = _gameChar.x > t_canyon.x_pos 
        && _gameChar.x < t_canyon.x_pos + t_canyon.width 
        && _gameChar.y >= _floorPos_y;
        
	if (isOverCanyon)
		_gameChar.isPlummeting = true;
}

// Check if character is over the finish line
function checkFinishLine()
{
    const isOverFinishLine = abs(_gameChar.x - _flagPole.x_pos) < 10
        && abs(_gameChar.y - _flagPole.y_pos) < 10;

    if (isOverFinishLine)
    {
        _flagPole.isReached = true;
    }
}

// Draws the canyon
function drawCanyon(canyon, _floorPos_y)
{
    fill(139, 69, 19);
    beginShape();
    vertex(canyon.x_pos, _floorPos_y);
    vertex(canyon.x_pos - 20, _floorPos_y + 40);
    vertex(canyon.x_pos + 20, _floorPos_y + 170);
    vertex(canyon.x_pos - 30 + canyon.width, _floorPos_y + 180);
    vertex(canyon.x_pos + 20 + canyon.width, _floorPos_y + 100);
    vertex(canyon.x_pos + 40 + canyon.width, _floorPos_y + 30);
    vertex(canyon.x_pos + canyon.width, _floorPos_y);
    endShape();
}

// --- Cloud Generation and Drawing ---

// Generates cloud objects from coordinates
// Each cloud is composed of multiple ellipses to create a fluffy appearance
// Uses random sizes for variation
function generateClouds(cloudsCoordinates)
{
    let clouds = [];
    for (let i = 0; i < cloudsCoordinates.length; i++)
    {
        let cloud = cloudsCoordinates[i];
        clouds.push({
            x: cloud.x_pos,
            y: cloud.y_pos * random(0.5, 0.9),
            width: 100 * random(0.8, 1.2),
            height: 60
        });
        clouds.push({
            x: cloud.x_pos + 40,
            y: cloud.y_pos * random(0.5, 0.9),
            width: 100 * random(0.8, 1.2),
            height: 70
        });
        clouds.push({
            x: cloud.x_pos + 80,
            y: cloud.y_pos * random(0.5, 0.9),
            width: 100 * random(0.8, 1.2),
            height: 60
        });
        clouds.push({
            x: cloud.x_pos + 30,
            y: cloud.y_pos * random(0.5, 0.9),
            width: 100 * random(0.8, 1.2),
            height: 80
        });
    }
    return clouds;
}

// Draws a single cloud
function drawCloud(cloud)
{
    fill(255);
    noStroke();
    ellipse(cloud.x, cloud.y, cloud.width, cloud.height);
}

// --- Mountain and Tree Drawing ---

// Draws a mountain object
function drawMountain(mountain, floorPos_y)
{
    noStroke();
    // main part of the mountain
    fill(120, 120, 120);
    triangle(mountain.x_pos, floorPos_y
        , mountain.x_pos + (310 * mountain.width), 150
        , mountain.x_pos + (620 * mountain.width), floorPos_y);
    // inner part
    fill(150, 150, 150);
    triangle(mountain.x_pos + (40 * mountain.width), floorPos_y
        , mountain.x_pos + (310 * mountain.width), 200
        , mountain.x_pos + (550 * mountain.width), floorPos_y);
    // snowcap
    fill(255, 255, 255);
    triangle(mountain.x_pos + (250 * mountain.width), 250
        , mountain.x_pos + (310 * mountain.width), 170
        , mountain.x_pos + (365 * mountain.width), 250);
}

// Draws a tree at a given position
function drawTree(treePos_x, treePos_y)
{
    fill(140, 70, 20);
    rect(treePos_x, treePos_y, 40, -150);
    fill(100, 160, 35);
    triangle(treePos_x - 40, treePos_y - 60
        , treePos_x + 20, treePos_y - 120
        , treePos_x + 80, treePos_y - 60);
    fill(100, 170, 35);
    triangle(treePos_x - 30, treePos_y - 95
        , treePos_x + 20, treePos_y - 150
        , treePos_x + 70, treePos_y - 95);
    fill(100, 180, 35);
    triangle(treePos_x - 20, treePos_y - 125
        , treePos_x + 20, treePos_y - 180
        , treePos_x + 60, treePos_y - 125);
}