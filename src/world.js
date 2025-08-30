/* World generation + rendering helpers (ES module) */
import { state, WORLD_WIDTH } from './constants.js';

/** Draw ground strip. */
export function drawGround() {
    noStroke();
    fill(0, 155, 0);
    rect(0, state.floorPosY, width, height - state.floorPosY);
}

/** Expand seed coordinates into fluffy cloud segments. */
export function generateClouds(cloudsCoordinates) {
    const clouds = [];
    for (let i = 0; i < cloudsCoordinates.length; i++) {
        const cloud = cloudsCoordinates[i];
        const speed = random(0.15, 0.45); // individual cluster speed
    const light = random(215, 250); // base brightness for entire cluster
        // Keep cluster cohesion by sharing speed among its ellipses
    clouds.push({ x: cloud.x_pos, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 60, speed, light });
    clouds.push({ x: cloud.x_pos + 40, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 70, speed, light });
    clouds.push({ x: cloud.x_pos + 80, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 60, speed, light });
    clouds.push({ x: cloud.x_pos + 30, y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 80, speed, light });
    }
    return clouds;
}

/** Draw one cloud ellipse. */
export function drawCloud(cloud) {
    noStroke();
    const base = cloud.light || 235;
    const shadow = max(160, base - 55);
    const highlight = min(255, base + 12);

    // Subtle shadow (draw first)
    fill(shadow, 140);
    ellipse(cloud.x + cloud.width * 0.15, cloud.y + cloud.height * 0.12, cloud.width * 0.95, cloud.height * 0.78);

    // Main body
    fill(base, 235);
    ellipse(cloud.x, cloud.y, cloud.width, cloud.height);

    // Highlight (top-left)
    fill(highlight, 220);
    ellipse(cloud.x - cloud.width * 0.18, cloud.y - cloud.height * 0.18, cloud.width * 0.55, cloud.height * 0.45);

    // Horizontal drift
    if (cloud.speed) {
        cloud.x += cloud.speed;
        if (cloud.x - state.cameraPosX > WORLD_WIDTH + 150) { // wrap after exiting right side
            cloud.x = -150 + state.cameraPosX;
        }
    }
}

/** Composite triangle mountain with inner + snow layers. */
export function drawMountain(mountain, floorPos_y) {
    noStroke();
    fill(120, 120, 120);
    triangle(mountain.x_pos, floorPos_y, mountain.x_pos + (310 * mountain.width), 150, mountain.x_pos + (620 * mountain.width), floorPos_y);
    fill(150, 150, 150);
    triangle(mountain.x_pos + (40 * mountain.width), floorPos_y, mountain.x_pos + (310 * mountain.width), 200, mountain.x_pos + (550 * mountain.width), floorPos_y);
    fill(255, 255, 255);
    triangle(mountain.x_pos + (250 * mountain.width), 250, mountain.x_pos + (310 * mountain.width), 170, mountain.x_pos + (365 * mountain.width), 250);
}

/** Stylized layered pine tree. */
export function drawTree(treePos_x, treePos_y) {
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
export function drawCanyon(canyon, floorPos_y) {
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
export function drawCollectible(t_collectible) {
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
export function drawScenery() {
    // Background layers
    for (let i = 0; i < state.clouds.length; i++) drawCloud(state.clouds[i]);
    for (let i = 0; i < state.mountains.length; i++) drawMountain(state.mountains[i], state.floorPosY);
    for (let i = 0; i < state.treesX.length; i++) drawTree(state.treesX[i], state.floorPosY);
    // Ground hazards
    for (let i = 0; i < state.canyons.length; i++) drawCanyon(state.canyons[i], state.floorPosY);
    // Platforms (above scenery so they are visible)
    for (let i = 0; i < state.platforms.length; i++) {
        const p = state.platforms[i];
        stroke(120, 100, 20, 120);
        strokeWeight(2);
        fill(230, 210, 40);
        rect(p.x_pos, p.y_pos, p.width, p.height, 3);
    }
}
