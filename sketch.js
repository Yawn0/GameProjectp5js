/*

The Game Project

*/
var floorPos_y = 432;
var gameChar_x = 0;
var gameChar_y = 0;

// Blobby properties
var blobBodyColor = [100, 180, 255]; // Light blue
var blobEyeColor = [255, 255, 255]; // White
var blobPupilColor = [0, 0, 0]; // Black
var blobMouthColor = [0, 0, 0]; // Black
var blobFeetColor = [80, 150, 220]; // Darker blue
var blobArmColor = blobFeetColor; // Dark blue

var blobBodyWidth = 40;
var blobBodyHeight = 45;
var blobEyeSize = 8;
var blobPupilSize = 4;
var blobFeetWidth = 12;
var blobFeetHeight = 8;
var blobArmWidth = 5;
var blobArmLength = 10;
var blobDefaultEyebrowStart;
var blobDefaultEyebrowStop;

// tree properties
var treePos_x;
var treePos_y;

//canyon properties
var canyon;

//collectable token properties
var collectible;


function mousePressed()
{
	gameChar_x = mouseX;
	gameChar_y = mouseY;
}

function setup()
{
	createCanvas(1024, 576);

	blobDefaultEyebrowStart= PI + 0.3;
	blobDefaultEyebrowStop= TWO_PI - 0.3;

	gameChar_x = width/2;
	gameChar_y = floorPos_y;

	treePos_x = width/2;
	treePos_y = height/2;

	canyon = {
		x_pos: 0,
		width: 100
	};

	collectible = {
		x_pos: 100,
		y_pos: 100,
		size: 50
	};
}

function draw()
{
	background(100, 155, 255); //fill the sky blue

	noStroke();
	fill(0,155,0);
	rect(0, floorPos_y, 1024, 144); //draw some green ground

	//1. a cloud in the sky
	fill(255);
	ellipse(220, 100, 80, 60);
	ellipse(260, 90, 100, 70);
	ellipse(300, 100, 80, 60);
	ellipse(250, 120, 120, 80);

	//2. a mountain in the distance
	// Base layer of the mountain
	fill(120, 120, 120); // dark grey for the base
	triangle(200, floorPos_y, 510, 150, 820, floorPos_y); // main mountain
	fill(150, 150, 150); // medium grey
	triangle(320, floorPos_y, 510, 200, 670, floorPos_y); // inner mountain
	fill(255, 255, 255); // white for the snow
	triangle(465, 250, 510, 150, 555, 250); // snowcap

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
	triangle(treePos_x - 20, floorPos_y - 125, treePos_x + 20, floorPos_y - 190, treePos_x + 60, floorPos_y - 125);


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
	fill(255, 215, 0);
	ellipse(400, 400, 25, 25);

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
