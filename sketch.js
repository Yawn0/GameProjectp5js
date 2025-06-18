/*

The Game Project

*/

// --- Game Constants ---
const CANVAS_WIDTH = 1024;
const CANVAS_HEIGHT = 576;
const FLOOR_HEIGHT_RATIO = 3 / 4;
const JUMP_HEIGHT = 100;
const GRAVITY_SPEED = 3; // Blobby falls at this speed
const PLUMMET_SPEED = 6; // Blobby falls faster when plummeting

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

// --- Game State Variables ---
var _floorPos_y;
let _cameraPosX;

// Game Character Object
let gameChar;

// Scenery Elements (objects to hold their properties)
var _canyon;
var _collectible;
var _trees_x;
var _cloudsCoordinates;
var _clouds;
var _mountains;

function setup()
{
    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);

	_floorPos_y = height * FLOOR_HEIGHT_RATIO
	_cameraPosX = 0;

        // Initialize game character
    gameChar = {
        x: width / 2,
        y: _floorPos_y,
        isLeft: false,
        isRight: false,
        isFalling: false,
        isPlummeting: false,
        currentAnimation: 'standingFront' // Default animation state
    };

	_collectible = {
		x_pos: 100,
		y_pos: _floorPos_y,
		size: 40,
		isFound: false
	};

	_canyon = {
		x_pos: 150,
		width: 80
	};

	_trees_x = [85, 300, 450, 700, 850];

	_cloudsCoordinates = [
		{ x_pos: 100, y_pos: 100 },
		{ x_pos: 200, y_pos: 80 },
		{ x_pos: 500, y_pos: 120 },
		{ x_pos: 600, y_pos: 90 },
		{ x_pos: 800, y_pos: 100 },
		{ x_pos: 1000, y_pos: 110 }
	]

	_clouds = generateClouds(_cloudsCoordinates);

	_mountains = [
		{ x_pos: 0, width: 1 },
		{ x_pos: 600, width: 1.1 },
		{ x_pos: 450, width: 1.2 },
		{ x_pos: 300, width: 0.6 },
	]
}

function draw()
{
	_cameraPosX += gameChar.isLeft ? -BLOBBY.SPEED : gameChar.isRight ? BLOBBY.SPEED : 0;

	background(100, 155, 255);

	drawGround();

	push();
	translate(-_cameraPosX, 0)

	drawScenery();

	drawCharacter();

	if (_collectible.isFound == false)
	{
		drawCollectible(_collectible);
	}
	pop();

	if (dist(gameChar.x, gameChar.y, _collectible.x_pos, _collectible.y_pos) < 20)
	{
		_collectible.isFound = true;
	}
}

function getDirectionalKey(keyCode)
{
	if (keyCode == 65 || keyCode == LEFT_ARROW) return LEFT_ARROW;
	if (keyCode == 68 || keyCode == RIGHT_ARROW) return RIGHT_ARROW;
	if (keyCode == 87 || keyCode == UP_ARROW || keyCode == 32) return UP_ARROW;
	return '';
}

function keyPressed()
{
	if (gameChar.isPlummeting) return;

	let directionKey = getDirectionalKey(keyCode);

	if (directionKey == LEFT_ARROW) gameChar.isLeft = true;
	else if (directionKey == RIGHT_ARROW) gameChar.isRight = true;
	else if (directionKey == UP_ARROW && !gameChar.isFalling)
	{
		gameChar.y -= JUMP_HEIGHT;
	}
}

function keyReleased()
{
	if (gameChar.isPlummeting) return;

	let directionKey = getDirectionalKey(keyCode);

	if (directionKey == LEFT_ARROW) gameChar.isLeft = false;
	else if (directionKey == RIGHT_ARROW) gameChar.isRight = false;
}

function drawCharacter()
{

	if (gameChar.isLeft && gameChar.isFalling)
	{
		blobbyJumpingLeft();
	}
	else if (gameChar.isRight && gameChar.isFalling)
	{
		blobbyJumpingRight();
	}
	else if (gameChar.isLeft)
	{
		blobbyWalkingLeft();
	}
	else if (gameChar.isRight)
	{
		blobbyWalkingRight();
	}
	else if (gameChar.isFalling || gameChar.isPlummeting)
	{
		blobbyJumping();
	}
	else
	{
		blobbyStandingFront();
	}

	if (gameChar.isLeft)
	{
		gameChar.x -= BLOBBY.SPEED;
	}
	else if (gameChar.isRight)
	{
		gameChar.x += BLOBBY.SPEED;
	}

	if (gameChar.y < _floorPos_y)
	{
		gameChar.y += GRAVITY_SPEED;
		gameChar.isFalling = true;
	}
	else
	{
		gameChar.isFalling = false;
	}

	if (gameChar.x < _canyon.x_pos + _canyon.width
		&& gameChar.x > _canyon.x_pos
		&& gameChar.y >= _floorPos_y)
	{
		gameChar.isPlummeting = true;
	}

	if (gameChar.isPlummeting)
	{
		gameChar.y += PLUMMET_SPEED;
		gameChar.isLeft = false;
		gameChar.isRight = false;
	}
}

function blobbyStandingFront()
{
	// Feet
	stroke(0);
	fill(BLOBBY.COLORS.FEET);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT);
	// Body
	fill(BLOBBY.COLORS.BODY);
	ellipse(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT);
	// Arms
	fill(BLOBBY.COLORS.ARM);
	rect(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.4, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (vertical)
	rect(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH / 2 - BLOBBY.DIMENSIONS.ARM_WIDTH, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.4, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Right arm (vertical)
	noStroke();
	// Eyes
	fill(BLOBBY.COLORS.EYE);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
	fill(BLOBBY.COLORS.PUPIL);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
	// Eyebrows
	stroke(BLOBBY.COLORS.PUPIL);
	noFill();
	arc(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
	arc(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
	// Mouth
	stroke(BLOBBY.COLORS.MOUTH);
	noFill();
	arc(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, 10, 5, 0, PI);
}

function blobbyJumping()
{
	// Feet (tucked in)
	stroke(0);
	fill(BLOBBY.COLORS.FEET);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.15, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.8, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.8);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.15, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.8, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.8);
	// Body
	fill(BLOBBY.COLORS.BODY);
	ellipse(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT * 1.1); // Slightly stretched
	// Arms
	fill(BLOBBY.COLORS.ARM);
	rect(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2 + 2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (slightly lower vertical)
	rect(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH / 2 - BLOBBY.DIMENSIONS.ARM_WIDTH - 2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Right arm (slightly lower vertical)
	noStroke();
	// Eyes (wide)
	fill(BLOBBY.COLORS.EYE);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2, BLOBBY.DIMENSIONS.EYE_SIZE * 1.2);
	fill(BLOBBY.COLORS.PUPIL);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE);
	// Eyebrows
	stroke(BLOBBY.COLORS.PUPIL);
	noFill();
	arc(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.7, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
	arc(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.2, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.7, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
	// Mouth (o shape)
	noStroke();
	fill(BLOBBY.COLORS.MOUTH);
	ellipse(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, 8, 8);
}

function blobbyWalkingLeft()
{
	// Blobby - Walking left
	stroke(0);
	fill(BLOBBY.COLORS.FEET);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 + 3, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH * 1.1, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Front foot slightly bigger
	// Body
	fill(BLOBBY.COLORS.BODY);
	ellipse(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT);
	// Feet (one forward, one back)
	fill(BLOBBY.COLORS.FEET);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1 + 3, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Back foot
	// Arms
	fill(BLOBBY.COLORS.ARM);
	rect(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2 + 20, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (slightly lower vertical)
	noStroke();
	// Eye (one visible, side view)
	fill(BLOBBY.COLORS.EYE);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
	fill(BLOBBY.COLORS.PUPIL);
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 - 1, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE); // Pupil looking left
	// Eyebrow
	stroke(BLOBBY.COLORS.PUPIL);
	noFill();
	arc(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
	// Mouth (side)
	stroke(BLOBBY.COLORS.MOUTH);
	line(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.3, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35);

}

function blobbyWalkingRight()
{
	stroke(0);
	// Blobby - Walking right
	// Foot back
	fill(BLOBBY.COLORS.FEET);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 - 3, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH * 1.1, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Front foot slightly bigger
	// Body
	fill(BLOBBY.COLORS.BODY);
	ellipse(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.BODY_WIDTH, BLOBBY.DIMENSIONS.BODY_HEIGHT);
	// Foot forward
	fill(BLOBBY.COLORS.FEET);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1 - 3, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2, BLOBBY.DIMENSIONS.FEET_WIDTH, BLOBBY.DIMENSIONS.FEET_HEIGHT); // Back foot
	// Arms
	fill(BLOBBY.COLORS.ARM);
	rect(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH / 2 + 15, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.5 - BLOBBY.DIMENSIONS.ARM_LENGTH * 0.5, BLOBBY.DIMENSIONS.ARM_WIDTH, BLOBBY.DIMENSIONS.ARM_LENGTH, 5); // Left arm (slightly lower vertical)
	noStroke();
	// Eye (one visible, side view)
	fill(BLOBBY.COLORS.EYE);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.EYE_SIZE, BLOBBY.DIMENSIONS.EYE_SIZE);
	fill(BLOBBY.COLORS.PUPIL);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25 + 1, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.6, BLOBBY.DIMENSIONS.PUPIL_SIZE, BLOBBY.DIMENSIONS.PUPIL_SIZE); // Pupil looking right
	// Eyebrow
	stroke(BLOBBY.COLORS.PUPIL);
	noFill();
	arc(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.25, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.65, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.DIMENSIONS.PUPIL_SIZE * 2, BLOBBY.EYEBROW_START, BLOBBY.EYEBROW_STOP);
	// Mouth (side)
	stroke(BLOBBY.COLORS.MOUTH);
	line(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35, gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.3, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT * 0.35);
}

function blobbyJumpingLeft()
{
	// Feet (swept back)
	stroke(0);
	fill(BLOBBY.COLORS.FEET);
	ellipse(gameChar.x + BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.9, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.9);
	// Body (slightly tilted)
	push();
	translate(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2);
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
	ellipse(gameChar.x - BLOBBY.DIMENSIONS.BODY_WIDTH * 0.1, gameChar.y - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2 + 5, BLOBBY.DIMENSIONS.FEET_WIDTH * 0.9, BLOBBY.DIMENSIONS.FEET_HEIGHT * 0.9);
	// Body (slightly tilted)
	push();
	translate(gameChar.x, gameChar.y - BLOBBY.DIMENSIONS.BODY_HEIGHT / 2 - BLOBBY.DIMENSIONS.FEET_HEIGHT / 2);
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

function drawGround()
{
	noStroke();
	fill(0, 155, 0);
	rect(0, _floorPos_y, width, height - _floorPos_y); //the ground
}

function drawScenery()
{
	drawCanyon(_canyon, _floorPos_y);

	for (var i = 0; i < _mountains.length; i++)
	{
		drawMountain(_mountains[i], _floorPos_y);
	}
	for (var i = 0; i < _trees_x.length; i++)
	{
		drawTree(_trees_x[i], _floorPos_y);
	}
	for (var i = 0; i < _clouds.length; i++)
	{
		drawCloud(_clouds[i]);
	}
}

function drawCollectible(collectible)
{
	stroke(0);
	fill(255, 215, 0);
	ellipse(collectible.x_pos, collectible.y_pos - (collectible.size / 2), collectible.size);
	fill(255, 255, 255);
	ellipse(collectible.x_pos, collectible.y_pos - (collectible.size / 2), collectible.size * 0.65);
	fill(255, 215, 0);
	ellipse(collectible.x_pos, collectible.y_pos - (collectible.size / 2), collectible.size * 0.25);
}

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


function generateClouds(cloudsCoordinates)
{
    let clouds = [];
	for (let i = 0; i < cloudsCoordinates.length; i++) {
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

function drawCloud(cloud)
{
    fill(255);
    noStroke();
    ellipse(cloud.x, cloud.y, cloud.width, cloud.height);
}

function drawMountain(mountain, floorPos_y)
{
	noStroke();
	// main part of the mountain
	fill(120, 120, 120);
	//triangle(x1, y1, x2, y2, x3, y3);
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