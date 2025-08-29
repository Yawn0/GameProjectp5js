/* World generation + rendering helpers */

/** Draw ground strip. */
function drawGround() {
    noStroke();
    fill(0, 155, 0);
    rect(0, _floorPos_y, width, height - _floorPos_y);
}

/** Expand seed coordinates into fluffy cloud segments. */
function generateClouds(cloudsCoordinates) {
    let clouds = [];
    for (let i = 0; i < cloudsCoordinates.length; i++) {
        let cloud = cloudsCoordinates[i];
        clouds.push({ x: cloud.x_pos, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 60 });
        clouds.push({ x: cloud.x_pos + 40, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 70 });
        clouds.push({ x: cloud.x_pos + 80, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 60 });
        clouds.push({ x: cloud.x_pos + 30, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 80 });
    }
    return clouds;
}

/** Draw one cloud ellipse. */
function drawCloud(cloud) {
    fill(255);
    noStroke();
    ellipse(cloud.x, cloud.y, cloud.width, cloud.height);
}

/** Composite triangle mountain with inner + snow layers. */
function drawMountain(mountain, floorPos_y) {
    noStroke();
    fill(120, 120, 120);
    triangle(mountain.x_pos, floorPos_y, mountain.x_pos + (310 * mountain.width), 150, mountain.x_pos + (620 * mountain.width), floorPos_y);
    fill(150, 150, 150);
    triangle(mountain.x_pos + (40 * mountain.width), floorPos_y, mountain.x_pos + (310 * mountain.width), 200, mountain.x_pos + (550 * mountain.width), floorPos_y);
    fill(255, 255, 255);
    triangle(mountain.x_pos + (250 * mountain.width), 250, mountain.x_pos + (310 * mountain.width), 170, mountain.x_pos + (365 * mountain.width), 250);
}

/** Stylized layered pine tree. */
function drawTree(treePos_x, treePos_y) {
    fill(140, 70, 20);
    rect(treePos_x, treePos_y, 40, -150);
    fill(100, 160, 35);
    triangle(treePos_x - 40, treePos_y - 60, treePos_x + 20, treePos_y - 120, treePos_x + 80, treePos_y - 60);
    fill(100, 170, 35);
    triangle(treePos_x - 30, treePos_y - 95, treePos_x + 20, treePos_y - 150, treePos_x + 70, treePos_y - 95);
    fill(100, 180, 35);
    triangle(treePos_x - 20, treePos_y - 125, treePos_x + 20, treePos_y - 180, treePos_x + 60, treePos_y - 125);
}

/** Jagged canyon polygon hazard. */
function drawCanyon(canyon, floorPos_y) {
    fill(139, 69, 19);
    beginShape();
    vertex(canyon.x_pos, floorPos_y);
    vertex(canyon.x_pos - 20, floorPos_y + 40);
    vertex(canyon.x_pos + 20, floorPos_y + 170);
    vertex(canyon.x_pos - 30 + canyon.width, floorPos_y + 180);
    vertex(canyon.x_pos + 20 + canyon.width, floorPos_y + 100);
    vertex(canyon.x_pos + 40 + canyon.width, floorPos_y + 30);
    vertex(canyon.x_pos + canyon.width, floorPos_y);
    endShape();
}

/** Render coin if not yet collected. */
function drawCollectible(t_collectible) {
    if (!t_collectible.isFound) {
        stroke(0);
        fill(255, 215, 0);
        ellipse(t_collectible.x_pos, t_collectible.y_pos - (t_collectible.size / 2), t_collectible.size);
        fill(255, 255, 255);
        ellipse(t_collectible.x_pos, t_collectible.y_pos - (t_collectible.size / 2), t_collectible.size * 0.65);
        fill(255, 215, 0);
        ellipse(t_collectible.x_pos, t_collectible.y_pos - (t_collectible.size / 2), t_collectible.size * 0.25);
    }
}

/** Batch draw of world backdrop elements. */
function drawScenery() {
    for (let i = 0; i < _canyons.length; i++) drawCanyon(_canyons[i], _floorPos_y);
    for (let i = 0; i < _mountains.length; i++) drawMountain(_mountains[i], _floorPos_y);
    for (let i = 0; i < _trees_x.length; i++) drawTree(_trees_x[i], _floorPos_y);
    for (let i = 0; i < _clouds.length; i++) drawCloud(_clouds[i]);
}
