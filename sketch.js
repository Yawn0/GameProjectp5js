/*

The Game Project

*/
var _floorPos_y;
var gameChar_x;
var gameChar_y;

// Blobby properties
const BLOB_BODY_COLOR = [100, 180, 255]; // Light blue
const BLOB_EYE_COLOR = [255, 255, 255]; // White
const BLOB_PUPIL_COLOR = [0, 0, 0]; // Black
const BLOB_MOUTH_COLOR = [0, 0, 0]; // Black
const BLOB_FEET_COLOR = [80, 150, 220]; // Darker blue
const BLOB_ARM_COLOR = BLOB_FEET_COLOR; // Dark blue

const BLOB_BODY_WIDTH = 40;
const BLOB_BODY_HEIGHT = 45;
const BLOB_EYE_SIZE = 8;
const BLOB_PUPIL_SIZE = 4;
const BLOB_FEET_WIDTH = 12;
const BLOB_FEET_HEIGHT = 8;
const BLOB_ARM_WIDTH = 5;
const BLOB_ARM_LENGTH = 10;
const BLOB_SPEED = 3;

var blobDefaultEyebrowStart;
var blobDefaultEyebrowStop;

var _canyon;
var _collectible;
var _trees_x;
var _cloudsCoordinates;
var _clouds;
var _mountains;

var _isLeft;
var _isRight;
var _isFalling;
var _isPlummeting;

var cameraPosX;

function setup()
{
	createCanvas(1024, 576);

	cameraPosX = 0;

	_floorPos_y = height * 3 / 4;

	gameChar_x = width / 2;
	gameChar_y = _floorPos_y;

	_isLeft = false;
	_isRight = false;
	_isFalling = false;
	_isPlummeting = false;

	blobDefaultEyebrowStart = PI + 0.3;
	blobDefaultEyebrowStop = TWO_PI - 0.3;

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
	cameraPosX += _isLeft ? -BLOB_SPEED : _isRight ? BLOB_SPEED : 0;

	background(100, 155, 255);

	drawGround();

	push();
	translate(-cameraPosX, 0)

	drawScenery();

	drawCharacter();

	if (_collectible.isFound == false)
	{
		drawCollectible(_collectible);
	}
	pop();


	if (dist(gameChar_x, gameChar_y, _collectible.x_pos, _collectible.y_pos) < 20)
	{
		_collectible.isFound = true;
	}
}

function keyPressed()
{
	if (_isPlummeting)
	{
		return;
	}
	if (key == 'a')
	{
		_isLeft = true;
	}
	else if (key == 'd')
	{
		_isRight = true;
	}
	else if ((keyCode == 32 || key == 'w') && !_isFalling)
	{
		gameChar_y -= 100;
	}
}

function keyReleased()
{
	if (_isPlummeting)
	{
		return;
	}
	if (key == 'a')
	{
		_isLeft = false;
	}
	else if (key == 'd')
	{
		_isRight = false;
	}
}

function drawCharacter()
{

	if (_isLeft && _isFalling)
	{
		blobbyJumpingLeft();
	}
	else if (_isRight && _isFalling)
	{
		blobbyJumpingRight();
	}
	else if (_isLeft)
	{
		blobbyWalkingLeft();
	}
	else if (_isRight)
	{
		blobbyWalkingRight();
	}
	else if (_isFalling || _isPlummeting)
	{
		blobbyJumping();
	}
	else
	{
		blobbyStandingFront();
	}

	if (_isLeft)
	{
		gameChar_x -= BLOB_SPEED;
	}
	else if (_isRight)
	{
		gameChar_x += BLOB_SPEED;
	}

	if (gameChar_y < _floorPos_y)
	{
		gameChar_y += BLOB_SPEED;
		_isFalling = true;
	}
	else
	{
		_isFalling = false;
	}

	if (gameChar_x < _canyon.x_pos + _canyon.width
		&& gameChar_x > _canyon.x_pos
		&& gameChar_y >= _floorPos_y)
	{
		_isPlummeting = true;
	}

	if (_isPlummeting)
	{
		gameChar_y += 5;
		_isLeft = false;
		_isRight = false;
	}
}

function blobbyStandingFront()
{
	// Feet
	stroke(0);
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.25, gameChar_y - BLOB_FEET_HEIGHT / 2, BLOB_FEET_WIDTH, BLOB_FEET_HEIGHT);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.25, gameChar_y - BLOB_FEET_HEIGHT / 2, BLOB_FEET_WIDTH, BLOB_FEET_HEIGHT);
	// Body
	fill(BLOB_BODY_COLOR);
	ellipse(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT / 2 - BLOB_FEET_HEIGHT / 2, BLOB_BODY_WIDTH, BLOB_BODY_HEIGHT);
	// Arms
	fill(BLOB_ARM_COLOR);
	rect(gameChar_x - BLOB_BODY_WIDTH / 2, gameChar_y - BLOB_BODY_HEIGHT * 0.4, BLOB_ARM_WIDTH, BLOB_ARM_LENGTH, 5); // Left arm (vertical)
	rect(gameChar_x + BLOB_BODY_WIDTH / 2 - BLOB_ARM_WIDTH, gameChar_y - BLOB_BODY_HEIGHT * 0.4, BLOB_ARM_WIDTH, BLOB_ARM_LENGTH, 5); // Right arm (vertical)
	noStroke();
	// Eyes
	fill(BLOB_EYE_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_EYE_SIZE, BLOB_EYE_SIZE);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_EYE_SIZE, BLOB_EYE_SIZE);
	fill(BLOB_PUPIL_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE);
	// Eyebrows
	stroke(BLOB_PUPIL_COLOR);
	noFill();
	arc(gameChar_x - BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.65, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	arc(gameChar_x + BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.65, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth
	stroke(BLOB_MOUTH_COLOR);
	noFill();
	arc(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT * 0.35, 10, 5, 0, PI);
}

function blobbyJumping()
{
	// Feet (tucked in)
	stroke(0);
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.15, gameChar_y - BLOB_FEET_HEIGHT / 2 + 5, BLOB_FEET_WIDTH * 0.8, BLOB_FEET_HEIGHT * 0.8);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.15, gameChar_y - BLOB_FEET_HEIGHT / 2 + 5, BLOB_FEET_WIDTH * 0.8, BLOB_FEET_HEIGHT * 0.8);
	// Body
	fill(BLOB_BODY_COLOR);
	ellipse(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT / 2 - BLOB_FEET_HEIGHT / 2, BLOB_BODY_WIDTH, BLOB_BODY_HEIGHT * 1.1); // Slightly stretched
	// Arms
	fill(BLOB_ARM_COLOR);
	rect(gameChar_x - BLOB_BODY_WIDTH / 2 + 2, gameChar_y - BLOB_BODY_HEIGHT * 0.5 - BLOB_ARM_LENGTH * 0.5, BLOB_ARM_WIDTH, BLOB_ARM_LENGTH, 5); // Left arm (slightly lower vertical)
	rect(gameChar_x + BLOB_BODY_WIDTH / 2 - BLOB_ARM_WIDTH - 2, gameChar_y - BLOB_BODY_HEIGHT * 0.5 - BLOB_ARM_LENGTH * 0.5, BLOB_ARM_WIDTH, BLOB_ARM_LENGTH, 5); // Right arm (slightly lower vertical)
	noStroke();
	// Eyes (wide)
	fill(BLOB_EYE_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_EYE_SIZE * 1.2, BLOB_EYE_SIZE * 1.2);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_EYE_SIZE * 1.2, BLOB_EYE_SIZE * 1.2);
	fill(BLOB_PUPIL_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE);
	// Eyebrows
	stroke(BLOB_PUPIL_COLOR);
	noFill();
	arc(gameChar_x - BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.7, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	arc(gameChar_x + BLOB_BODY_WIDTH * 0.2, gameChar_y - BLOB_BODY_HEIGHT * 0.7, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (o shape)
	noStroke();
	fill(BLOB_MOUTH_COLOR);
	ellipse(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT * 0.35, 8, 8);
}

function blobbyWalkingLeft()
{
	// Blobby - Walking left
	stroke(0);
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.25 + 3, gameChar_y - BLOB_FEET_HEIGHT / 2, BLOB_FEET_WIDTH * 1.1, BLOB_FEET_HEIGHT); // Front foot slightly bigger
	// Body
	fill(BLOB_BODY_COLOR);
	ellipse(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT / 2 - BLOB_FEET_HEIGHT / 2, BLOB_BODY_WIDTH, BLOB_BODY_HEIGHT);
	// Feet (one forward, one back)
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.1 + 3, gameChar_y - BLOB_FEET_HEIGHT / 2, BLOB_FEET_WIDTH, BLOB_FEET_HEIGHT); // Back foot
	// Arms
	fill(BLOB_ARM_COLOR);
	rect(gameChar_x - BLOB_BODY_WIDTH / 2 + 20, gameChar_y - BLOB_BODY_HEIGHT * 0.5 - BLOB_ARM_LENGTH * 0.5, BLOB_ARM_WIDTH, BLOB_ARM_LENGTH, 5); // Left arm (slightly lower vertical)
	noStroke();
	// Eye (one visible, side view)
	fill(BLOB_EYE_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.25, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_EYE_SIZE, BLOB_EYE_SIZE);
	fill(BLOB_PUPIL_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.25 - 1, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE); // Pupil looking left
	// Eyebrow
	stroke(BLOB_PUPIL_COLOR);
	noFill();
	arc(gameChar_x - BLOB_BODY_WIDTH * 0.25, gameChar_y - BLOB_BODY_HEIGHT * 0.65, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (side)
	stroke(BLOB_MOUTH_COLOR);
	line(gameChar_x - BLOB_BODY_WIDTH * 0.3, gameChar_y - BLOB_BODY_HEIGHT * 0.35, gameChar_x - BLOB_BODY_WIDTH * 0.1, gameChar_y - BLOB_BODY_HEIGHT * 0.35);

}

function blobbyWalkingRight()
{
	stroke(0);
	// Blobby - Walking right
	// Foot back
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.25 - 3, gameChar_y - BLOB_FEET_HEIGHT / 2, BLOB_FEET_WIDTH * 1.1, BLOB_FEET_HEIGHT); // Front foot slightly bigger
	// Body
	fill(BLOB_BODY_COLOR);
	ellipse(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT / 2 - BLOB_FEET_HEIGHT / 2, BLOB_BODY_WIDTH, BLOB_BODY_HEIGHT);
	// Foot forward
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.1 - 3, gameChar_y - BLOB_FEET_HEIGHT / 2, BLOB_FEET_WIDTH, BLOB_FEET_HEIGHT); // Back foot
	// Arms
	fill(BLOB_ARM_COLOR);
	rect(gameChar_x - BLOB_BODY_WIDTH / 2 + 15, gameChar_y - BLOB_BODY_HEIGHT * 0.5 - BLOB_ARM_LENGTH * 0.5, BLOB_ARM_WIDTH, BLOB_ARM_LENGTH, 5); // Left arm (slightly lower vertical)
	noStroke();
	// Eye (one visible, side view)
	fill(BLOB_EYE_COLOR);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.25, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_EYE_SIZE, BLOB_EYE_SIZE);
	fill(BLOB_PUPIL_COLOR);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.25 + 1, gameChar_y - BLOB_BODY_HEIGHT * 0.6, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE); // Pupil looking right
	// Eyebrow
	stroke(BLOB_PUPIL_COLOR);
	noFill();
	arc(gameChar_x + BLOB_BODY_WIDTH * 0.25, gameChar_y - BLOB_BODY_HEIGHT * 0.65, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (side)
	stroke(BLOB_MOUTH_COLOR);
	line(gameChar_x + BLOB_BODY_WIDTH * 0.1, gameChar_y - BLOB_BODY_HEIGHT * 0.35, gameChar_x + BLOB_BODY_WIDTH * 0.3, gameChar_y - BLOB_BODY_HEIGHT * 0.35);
}

function blobbyJumpingLeft()
{
	// Feet (swept back)
	stroke(0);
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x + BLOB_BODY_WIDTH * 0.1, gameChar_y - BLOB_FEET_HEIGHT / 2 + 5, BLOB_FEET_WIDTH * 0.9, BLOB_FEET_HEIGHT * 0.9);
	// Body (slightly tilted)
	push();
	translate(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT / 2 - BLOB_FEET_HEIGHT / 2);
	rotate(-PI / 12.0); // Tilt left
	fill(BLOB_BODY_COLOR);
	ellipse(0, 0, BLOB_BODY_WIDTH, BLOB_BODY_HEIGHT * 1.05);
	// Arms (swept back, inside push/pop)
	fill(BLOB_ARM_COLOR);
	rect(BLOB_BODY_WIDTH * 0.2 - BLOB_ARM_LENGTH * 1.2, -BLOB_BODY_HEIGHT * 0.1 + 10, BLOB_ARM_LENGTH * 1.2, BLOB_ARM_WIDTH, 5); // Right arm
	noStroke();
	// Eye (looking left)
	fill(BLOB_EYE_COLOR);
	ellipse(-BLOB_BODY_WIDTH * 0.25, -BLOB_BODY_HEIGHT * 0.1, BLOB_EYE_SIZE * 1.1, BLOB_EYE_SIZE * 1.1);
	fill(BLOB_PUPIL_COLOR);
	ellipse(-BLOB_BODY_WIDTH * 0.25 - 1, -BLOB_BODY_HEIGHT * 0.1, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE);
	// Eyebrow
	stroke(BLOB_PUPIL_COLOR);
	noFill();
	arc(-BLOB_BODY_WIDTH * 0.25, -BLOB_BODY_HEIGHT * 0.2, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (o shape)
	noStroke();
	fill(BLOB_MOUTH_COLOR);
	ellipse(-BLOB_BODY_WIDTH * 0.4, BLOB_BODY_HEIGHT * 0.2, 6, 6);

	pop();
}

function blobbyJumpingRight()
{
	// Feet (swept back)
	stroke(0);
	fill(BLOB_FEET_COLOR);
	ellipse(gameChar_x - BLOB_BODY_WIDTH * 0.1, gameChar_y - BLOB_FEET_HEIGHT / 2 + 5, BLOB_FEET_WIDTH * 0.9, BLOB_FEET_HEIGHT * 0.9);
	// Body (slightly tilted)
	push();
	translate(gameChar_x, gameChar_y - BLOB_BODY_HEIGHT / 2 - BLOB_FEET_HEIGHT / 2);
	rotate(PI / 12.0); // Tilt right
	fill(BLOB_BODY_COLOR);
	ellipse(0, 0, BLOB_BODY_WIDTH, BLOB_BODY_HEIGHT * 1.05);
	// Arms (swept back, inside push/pop)
	fill(BLOB_ARM_COLOR);
	rect(-BLOB_BODY_WIDTH * 0.2, -BLOB_BODY_HEIGHT * 0.1 + 10, BLOB_ARM_LENGTH * 1.2, BLOB_ARM_WIDTH, 5); // Left arm
	noStroke();
	// Eye (looking right)
	fill(BLOB_EYE_COLOR);
	ellipse(BLOB_BODY_WIDTH * 0.25, -BLOB_BODY_HEIGHT * 0.1, BLOB_EYE_SIZE * 1.1, BLOB_EYE_SIZE * 1.1);
	fill(BLOB_PUPIL_COLOR);
	ellipse(BLOB_BODY_WIDTH * 0.25 + 1, -BLOB_BODY_HEIGHT * 0.1, BLOB_PUPIL_SIZE, BLOB_PUPIL_SIZE);
	// Eyebrow
	stroke(BLOB_PUPIL_COLOR);
	noFill();
	arc(BLOB_BODY_WIDTH * 0.25, -BLOB_BODY_HEIGHT * 0.2, BLOB_PUPIL_SIZE * 2, BLOB_PUPIL_SIZE * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (o shape)
	noStroke();
	fill(BLOB_MOUTH_COLOR);
	ellipse(-BLOB_BODY_WIDTH * -0.4, BLOB_BODY_HEIGHT * 0.2, 6, 6);

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
	return cloudsCoordinates.map(function (cloud)
	{
		return [
			{
				x: cloud.x_pos,
				y: cloud.y_pos * random(0.5, 0.9),
				width: 100 * random(0.8, 1.2),
				height: 60
			},
			{
				x: cloud.x_pos + 40,
				y: cloud.y_pos * random(0.5, 0.9),
				width: 100 * random(0.8, 1.2),
				height: 70
			},
			{
				x: cloud.x_pos + 80,
				y: cloud.y_pos * random(0.5, 0.9),
				width: 100 * random(0.8, 1.2),
				height: 60
			},
			{
				x: cloud.x_pos + 30,
				y: cloud.y_pos * random(0.5, 0.9),
				width: 100 * random(0.8, 1.2),
				height: 80
			},
		];
	});
}

function drawCloud(cloud)
{
	fill(255);
	noStroke();
	for (var i = 0; i < cloud.length; i++)
	{
		ellipse(cloud[i].x, cloud[i].y, cloud[i].width, cloud[i].height);
	}
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