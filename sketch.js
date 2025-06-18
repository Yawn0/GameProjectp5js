/*

The Game Project

*/
var floorPos_y;
var gameChar_x;
var gameChar_y;

// Blobby properties
const blobBodyColor = [100, 180, 255]; // Light blue
const blobEyeColor = [255, 255, 255]; // White
const blobPupilColor = [0, 0, 0]; // Black
const blobMouthColor = [0, 0, 0]; // Black
const blobFeetColor = [80, 150, 220]; // Darker blue
const blobArmColor = blobFeetColor; // Dark blue

const blobBodyWidth = 40;
const blobBodyHeight = 45;
const blobEyeSize = 8;
const blobPupilSize = 4;
const blobFeetWidth = 12;
const blobFeetHeight = 8;
const blobArmWidth = 5;
const blobArmLength = 10;
var blobDefaultEyebrowStart;
var blobDefaultEyebrowStop;


var trees_x;
var canyon;
var collectible;
var mountain;
var cloud;

var isLeft;
var isRight;
var isFalling;
var isPlummeting;


// function mousePressed()
// {
// 	gameChar_x = mouseX;
// 	gameChar_y = mouseY;
// }

function setup()
{
	createCanvas(1024, 576);

	floorPos_y = height * 3/4;
	gameChar_x = width/2;
	gameChar_y = floorPos_y;

	isLeft = false;
	isRight = false;
	isFalling = false;
	isPlummeting = false;

	blobDefaultEyebrowStart= PI + 0.3;
	blobDefaultEyebrowStop= TWO_PI - 0.3;

	collectible = {
		x_pos: 100,
		y_pos: floorPos_y,
		size: 40,
		isFound: false
	};

	canyon = {
		x_pos: 150,
		width: 80
	};

	mountain = {
		x_pos: 0,
		width: 100
	}

	cloud = {
		x_pos: 0,
		width: 100
	}
}

function draw()
{
	background(100, 155, 255); //fill the sky blue

	noStroke();
	fill(0,155,0);
	rect(0, floorPos_y, width, height - floorPos_y); //draw some green ground
	
	drawCanyon();
	drawMountain();
	drawCloud();

	trees_x = [100, 300, 500, 700, 900];

	for (var i = 0; i < trees_x.length; i++)
	{
		drawTree(trees_x[i], floorPos_y);
	}

	if(collectible.isFound == false){
		drawCollectible();
	}

	if(dist(gameChar_x, gameChar_y, collectible.x_pos, collectible.y_pos) < 20){
		collectible.isFound = true;
	}

	drawCharacter();
}

function keyPressed()
{
	if(isPlummeting)
	{
		console.log("Plummeting");
		return;
	}
	console.log(keyCode);
	console.log(key);
	if(key == 'a')
	{
		isLeft = true;
	}
	else if(key == 'd')
	{
		isRight = true;
	}
	else if((keyCode == 32 || key == 'w') && !isFalling)
	{
		gameChar_y -= 100;
	}
}

function keyReleased()
{
	if(isPlummeting)
	{
		console.log("Plummeting");
		return;
	}
	if(key == 'a')
	{
		isLeft = false;
	}
	else if(key == 'd')
	{
		isRight = false;
	}
}

function drawCharacter(){

	if(isLeft && isFalling)
	{
		blobbyJumpingLeft();
	}
	else if(isRight && isFalling)
	{
		blobbyJumpingRight();
	}
	else if(isLeft)
	{
		console.log('gameChar_x ' + gameChar_x);
		console.log('gameChar_y ' + gameChar_y);
		console.log('collectible.x_pos ' + collectible.x_pos);
		console.log('collectible.y_pos ' + collectible.y_pos);
		blobbyWalkingLeft();
	}
	else if(isRight)
	{
		blobbyWalkingRight();
	}
	else if(isFalling || isPlummeting)
	{
		blobbyJumping();
	}
	else
	{
		blobbyStandingFront();
	}

	if(isLeft)
	{
		gameChar_x -= 3;
	}
	else if(isRight)
	{
		gameChar_x += 3;
	}

	if(gameChar_y < floorPos_y)
	{
		gameChar_y += 3;
		isFalling = true;
	}
	else
	{
		isFalling = false;
	}

	if(gameChar_x < canyon.x_pos + canyon.width 
		&& gameChar_x > canyon.x_pos
		&& gameChar_y >= floorPos_y){
		isPlummeting = true;
	}

	if(isPlummeting){
		gameChar_y += 5;
		isLeft = false;
		isRight = false;
	}
}

function blobbyStandingFront()
{
	// Feet
	stroke(0);
	fill(blobFeetColor);
	ellipse(gameChar_x - blobBodyWidth * 0.25, gameChar_y - blobFeetHeight / 2, blobFeetWidth, blobFeetHeight);
	ellipse(gameChar_x + blobBodyWidth * 0.25, gameChar_y - blobFeetHeight / 2, blobFeetWidth, blobFeetHeight);
	// Body
	fill(blobBodyColor);
	ellipse(gameChar_x, gameChar_y - blobBodyHeight / 2 - blobFeetHeight / 2, blobBodyWidth, blobBodyHeight);
	// Arms
	fill(blobArmColor);
	rect(gameChar_x - blobBodyWidth / 2, gameChar_y - blobBodyHeight * 0.4, blobArmWidth, blobArmLength, 5); // Left arm (vertical)
	rect(gameChar_x + blobBodyWidth / 2 - blobArmWidth, gameChar_y - blobBodyHeight * 0.4, blobArmWidth, blobArmLength, 5); // Right arm (vertical)
	noStroke();
	// Eyes
	fill(blobEyeColor);
	ellipse(gameChar_x - blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6, blobEyeSize, blobEyeSize);
	ellipse(gameChar_x + blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6, blobEyeSize, blobEyeSize);
	fill(blobPupilColor);
	ellipse(gameChar_x - blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6, blobPupilSize, blobPupilSize);
	ellipse(gameChar_x + blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6, blobPupilSize, blobPupilSize);
	// Eyebrows
	stroke(blobPupilColor);
	noFill();
	arc(gameChar_x - blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.65, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	arc(gameChar_x + blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.65, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth
	stroke(blobMouthColor);
	noFill();
	arc(gameChar_x, gameChar_y - blobBodyHeight * 0.35, 10, 5, 0, PI);
}

function blobbyJumping()
{
	var jumpOffset = 0;
	// Feet (tucked in)
	stroke(0);
	fill(blobFeetColor);
	ellipse(gameChar_x - blobBodyWidth * 0.15, gameChar_y - blobFeetHeight / 2 + jumpOffset + 5, blobFeetWidth * 0.8, blobFeetHeight * 0.8);
	ellipse(gameChar_x + blobBodyWidth * 0.15, gameChar_y - blobFeetHeight / 2 + jumpOffset + 5, blobFeetWidth * 0.8, blobFeetHeight * 0.8);
	// Body
	fill(blobBodyColor);
	ellipse(gameChar_x, gameChar_y - blobBodyHeight / 2 - blobFeetHeight / 2 + jumpOffset, blobBodyWidth, blobBodyHeight * 1.1); // Slightly stretched
	// Arms
	fill(blobArmColor);
	rect(gameChar_x - blobBodyWidth / 2 + 2, gameChar_y - blobBodyHeight * 0.5  - blobArmLength * 0.5, blobArmWidth, blobArmLength, 5); // Left arm (slightly lower vertical)
	rect(gameChar_x + blobBodyWidth / 2 - blobArmWidth - 2, gameChar_y - blobBodyHeight * 0.5 - blobArmLength * 0.5, blobArmWidth, blobArmLength, 5); // Right arm (slightly lower vertical)
	noStroke();
	// Eyes (wide)
	fill(blobEyeColor);
	ellipse(gameChar_x - blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6 + jumpOffset, blobEyeSize * 1.2, blobEyeSize * 1.2);
	ellipse(gameChar_x + blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6 + jumpOffset, blobEyeSize * 1.2, blobEyeSize * 1.2);
	fill(blobPupilColor);
	ellipse(gameChar_x - blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6 + jumpOffset, blobPupilSize, blobPupilSize);
	ellipse(gameChar_x + blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.6 + jumpOffset, blobPupilSize, blobPupilSize);
	// Eyebrows
	stroke(blobPupilColor);
	noFill();
	arc(gameChar_x - blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.7 + jumpOffset, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	arc(gameChar_x + blobBodyWidth * 0.2, gameChar_y - blobBodyHeight * 0.7 + jumpOffset, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (o shape)
	noStroke();
	fill(blobMouthColor);
	ellipse(gameChar_x, gameChar_y - blobBodyHeight * 0.35 + jumpOffset, 8, 8);
}

function blobbyWalkingLeft()
{
	// Blobby - Walking left
	stroke(0);
	fill(blobFeetColor);
	ellipse(gameChar_x - blobBodyWidth * 0.25 + 3, gameChar_y - blobFeetHeight / 2, blobFeetWidth * 1.1, blobFeetHeight); // Front foot slightly bigger
	// Body
	fill(blobBodyColor);
	ellipse(gameChar_x, gameChar_y - blobBodyHeight / 2 - blobFeetHeight / 2, blobBodyWidth, blobBodyHeight);
	// Feet (one forward, one back)
	fill(blobFeetColor);
	ellipse(gameChar_x - blobBodyWidth * 0.1 + 3, gameChar_y - blobFeetHeight / 2, blobFeetWidth, blobFeetHeight); // Back foot
	// Arms
	fill(blobArmColor);
	rect(gameChar_x - blobBodyWidth / 2 + 20, gameChar_y - blobBodyHeight * 0.5  - blobArmLength * 0.5, blobArmWidth, blobArmLength, 5); // Left arm (slightly lower vertical)
	noStroke();
	// Eye (one visible, side view)
	fill(blobEyeColor);
	ellipse(gameChar_x - blobBodyWidth * 0.25, gameChar_y - blobBodyHeight * 0.6, blobEyeSize, blobEyeSize);
	fill(blobPupilColor);
	ellipse(gameChar_x - blobBodyWidth * 0.25 - 1, gameChar_y - blobBodyHeight * 0.6, blobPupilSize, blobPupilSize); // Pupil looking left
	// Eyebrow
	stroke(blobPupilColor);
	noFill();
	arc(gameChar_x - blobBodyWidth * 0.25, gameChar_y - blobBodyHeight * 0.65, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (side)
	stroke(blobMouthColor);
	line(gameChar_x - blobBodyWidth * 0.3, gameChar_y - blobBodyHeight * 0.35, gameChar_x - blobBodyWidth * 0.1, gameChar_y - blobBodyHeight * 0.35);
	
}

function blobbyWalkingRight()
{
	stroke(0);
	// Blobby - Walking right
	// Foot back
	fill(blobFeetColor);
	ellipse(gameChar_x + blobBodyWidth * 0.25 - 3, gameChar_y - blobFeetHeight / 2, blobFeetWidth * 1.1, blobFeetHeight); // Front foot slightly bigger
	// Body
	fill(blobBodyColor);
	ellipse(gameChar_x, gameChar_y - blobBodyHeight / 2 - blobFeetHeight / 2, blobBodyWidth, blobBodyHeight);
	// Foot forward
	fill(blobFeetColor);
	ellipse(gameChar_x + blobBodyWidth * 0.1  - 3, gameChar_y - blobFeetHeight / 2, blobFeetWidth, blobFeetHeight); // Back foot
	// Arms
	fill(blobArmColor);
	rect(gameChar_x - blobBodyWidth / 2 + 15, gameChar_y - blobBodyHeight * 0.5  - blobArmLength * 0.5, blobArmWidth, blobArmLength, 5); // Left arm (slightly lower vertical)
	noStroke();
	// Eye (one visible, side view)
	fill(blobEyeColor);
	ellipse(gameChar_x + blobBodyWidth * 0.25, gameChar_y - blobBodyHeight * 0.6, blobEyeSize, blobEyeSize);
	fill(blobPupilColor);
	ellipse(gameChar_x + blobBodyWidth * 0.25 + 1, gameChar_y - blobBodyHeight * 0.6, blobPupilSize, blobPupilSize); // Pupil looking right
	// Eyebrow
	stroke(blobPupilColor);
	noFill();
	arc(gameChar_x + blobBodyWidth * 0.25, gameChar_y - blobBodyHeight * 0.65, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (side)
	stroke(blobMouthColor);
	line(gameChar_x + blobBodyWidth * 0.1, gameChar_y - blobBodyHeight * 0.35, gameChar_x + blobBodyWidth * 0.3, gameChar_y - blobBodyHeight * 0.35);
}

function blobbyJumpingLeft()
{
	var jumpOffsetLR = 0;
	// Feet (swept back)
	stroke(0);
	fill(blobFeetColor);
	ellipse(gameChar_x + blobBodyWidth * 0.1, gameChar_y - blobFeetHeight / 2 + jumpOffsetLR + 5, blobFeetWidth * 0.9, blobFeetHeight * 0.9);
	// Body (slightly tilted)
	push();
	translate(gameChar_x, gameChar_y - blobBodyHeight / 2 - blobFeetHeight / 2 + jumpOffsetLR);
	rotate(-PI / 12.0); // Tilt left
	fill(blobBodyColor);
	ellipse(0, 0, blobBodyWidth, blobBodyHeight * 1.05);
	// Arms (swept back, inside push/pop)
	fill(blobArmColor);
	rect(blobBodyWidth * 0.2 - blobArmLength * 1.2, -blobBodyHeight * 0.1 + 10, blobArmLength * 1.2, blobArmWidth, 5); // Right arm
	noStroke();
	// Eye (looking left)
	fill(blobEyeColor);
	ellipse(-blobBodyWidth * 0.25, -blobBodyHeight * 0.1, blobEyeSize * 1.1, blobEyeSize * 1.1);
	fill(blobPupilColor);
	ellipse(-blobBodyWidth * 0.25 - 1, -blobBodyHeight * 0.1, blobPupilSize, blobPupilSize);
	// Eyebrow
	stroke(blobPupilColor);
	noFill();
	arc(-blobBodyWidth * 0.25, -blobBodyHeight * 0.2, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (o shape)
	noStroke();
	fill(blobMouthColor);
	ellipse(-blobBodyWidth * 0.4, blobBodyHeight * 0.2, 6, 6);

	pop();
}

function blobbyJumpingRight()
{
	var jumpOffsetLR = 0;
	// Feet (swept back)
	stroke(0);
	fill(blobFeetColor);
	ellipse(gameChar_x - blobBodyWidth * 0.1, gameChar_y - blobFeetHeight / 2 + jumpOffsetLR + 5, blobFeetWidth * 0.9, blobFeetHeight * 0.9);
	// Body (slightly tilted)
	push();
	translate(gameChar_x, gameChar_y - blobBodyHeight / 2 - blobFeetHeight / 2 + jumpOffsetLR);
	rotate(PI / 12.0); // Tilt right
	fill(blobBodyColor);
	ellipse(0, 0, blobBodyWidth, blobBodyHeight * 1.05);
	// Arms (swept back, inside push/pop)
	fill(blobArmColor);
	rect(-blobBodyWidth * 0.2, -blobBodyHeight * 0.1 + 10, blobArmLength * 1.2, blobArmWidth, 5); // Left arm
	noStroke();
	// Eye (looking right)
	fill(blobEyeColor);
	ellipse(blobBodyWidth * 0.25, -blobBodyHeight * 0.1, blobEyeSize * 1.1, blobEyeSize * 1.1);
	fill(blobPupilColor);
	ellipse(blobBodyWidth * 0.25 + 1, -blobBodyHeight * 0.1, blobPupilSize, blobPupilSize);
	// Eyebrow
	stroke(blobPupilColor);
	noFill();
	arc(blobBodyWidth * 0.25, -blobBodyHeight * 0.2, blobPupilSize * 2, blobPupilSize * 2, blobDefaultEyebrowStart, blobDefaultEyebrowStop);
	// Mouth (o shape)
	noStroke();
	fill(blobMouthColor);
	ellipse(-blobBodyWidth * -0.4, blobBodyHeight * 0.2, 6, 6);
	
	pop();
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

function drawCloud(cloud)
{
	fill(255);
	// ellipse(x, y, width, height);
	ellipse(cloud.x_pos, cloud.y_pos * random(0.5, 0.9)
		, 100 * random(0.8, 1.2), 60);
	ellipse(cloud.x_pos + 40, cloud.y_pos * random(0.5, 0.9)
		, 100 * random(0.8, 1.2), 70);
	ellipse(cloud.x_pos + 80, cloud.y_pos * random(0.5, 0.9)
		, 100 * random(0.8, 1.2), 60);
	ellipse(cloud.x_pos + 30, cloud.y_pos * random(0.5, 0.9)
		, 100 * random(0.8, 1.2), 80);
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
		, treePos_x + 80, treePos_y  - 60);
	fill(100, 170, 35);
	triangle(treePos_x - 30, treePos_y - 95
		, treePos_x + 20, treePos_y - 150
		, treePos_x + 70, treePos_y - 95);
	fill(100, 180, 35);
	triangle(treePos_x - 20, treePos_y - 125
		, treePos_x + 20, treePos_y - 180
		, treePos_x + 60, treePos_y - 125);
}