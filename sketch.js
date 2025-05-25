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

var treePos_x;
var treePos_y;
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

	treePos_x = width/2;
	treePos_y = height/2;

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
	rect(0, floorPos_y, 1024, 144); //draw some green ground

	//1. a cloud in the sky
	fill(255);
	stroke(0);
	ellipse(cloud.x_pos + 220, 100, 80, 60);
	ellipse(cloud.x_pos + 260, 90, 100, 70);
	ellipse(cloud.x_pos + 300, 100, 80, 60);
	noStroke();
	ellipse(cloud.x_pos + 250, 120, 120, 80);

	//2. a mountain in the distance
	// Base layer of the mountain
	noStroke();
	fill(120, 120, 120); // dark grey for the base
	triangle(mountain.x_pos + 200, floorPos_y, mountain.x_pos + 510, 150, mountain.x_pos + 820, floorPos_y); // main mountain
	fill(150, 150, 150); // medium grey
	triangle(mountain.x_pos + 320, floorPos_y, mountain.x_pos + 510, 200, mountain.x_pos + 670, floorPos_y); // inner mountain
	fill(255, 255, 255); // white for the snow
	triangle(mountain.x_pos + 465, 250, mountain.x_pos + 510, 150, mountain.x_pos + 555, 250); // snowcap

	// //3. a tree
	// fill(139, 69, 19); // brown color for the trunk
	// rect(790, 376, 20, 60); // trunk
	// fill(34, 139, 34); // green color for the leaves
	// ellipse(800, 356, 60, 60); // top leaves
	// ellipse(780, 376, 60, 60); // left leaves
	// ellipse(820, 376, 60, 60); // right leaves

	// // second tree using triangles
	// fill(140, 70, 20); // brown color for the trunk
	// rect(880, 375, 20, 60); // trunk
	// fill(100, 160, 35); // green color for the leaves
	// triangle(820, 380, 885, 320, 960, 380); // top leaves
	// fill(100, 170, 35); // green color for the leaves
	// triangle(830, 355, 885, 280, 950, 355); // top leaves
	// fill(100, 180, 35); // green color for the leaves
	// triangle(840, 325, 885, 260, 940, 325); // top leaves

	//Tree
	fill(140, 70, 20);
	rect(treePos_x, floorPos_y, 40, -150);
	fill(100, 160, 35);
	triangle(treePos_x - 40, floorPos_y - 60, treePos_x + 20, floorPos_y - 120, treePos_x + 80, floorPos_y  - 60);
	fill(100, 170, 35);
	triangle(treePos_x - 30, floorPos_y - 95, treePos_x + 20, floorPos_y - 150, treePos_x + 70, floorPos_y - 95);
	fill(100, 180, 35);
	triangle(treePos_x - 20, floorPos_y - 125, treePos_x + 20, floorPos_y - 180, treePos_x + 60, floorPos_y - 125);


	//4. a canyon
	//NB. the canyon should go from ground-level to the bottom of the screen
	fill(139, 69, 19);
	beginShape();
	vertex(canyon.x_pos + 80, floorPos_y);
	vertex(canyon.x_pos + 100, 576);
	vertex(canyon.x_pos + 50 + canyon.width, 580);
	vertex(canyon.x_pos + 100 + canyon.width, 550);
	vertex(canyon.x_pos + 120 + canyon.width, 450);
	vertex(canyon.x_pos + 150 + canyon.width, floorPos_y);
	endShape();

	//5. a collectable token - eg. a jewel, fruit, coins
	stroke(0);
	fill(255, 215, 0);
	ellipse(collectible.x_pos + 300, collectible.y_pos + 300, collectible.size * 0.65);
	fill(255, 255, 255);
	ellipse(collectible.x_pos + 300, collectible.y_pos + 300, collectible.size * 0.45);
	fill(255, 215, 0);
	ellipse(collectible.x_pos + 300, collectible.y_pos + 300, collectible.size * 0.25);

	// Blobby - Standing front
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
	arc(gameChar_x, gameChar_y - blobBodyHeight * 0.35, 10, 5, 0, PI);}
