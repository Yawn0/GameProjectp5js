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
    const windOffsetY = state.windValue * 6 * sin((cloud.x + frameCount * 0.6) * 0.0025);

    // Subtle shadow (draw first)
    fill(shadow, 140);
    ellipse(cloud.x + cloud.width * 0.15, cloud.y + cloud.height * 0.12 + windOffsetY, cloud.width * 0.95, cloud.height * 0.78);

    // Main body
    fill(base, 235);
    ellipse(cloud.x, cloud.y + windOffsetY, cloud.width, cloud.height);

    // Highlight (top-left)
    fill(highlight, 220);
    ellipse(cloud.x - cloud.width * 0.18, cloud.y - cloud.height * 0.18 + windOffsetY, cloud.width * 0.55, cloud.height * 0.45);

    // Horizontal drift
    if (cloud.speed) {
        cloud.x += cloud.speed;
        if (cloud.x - state.cameraPosX > WORLD_WIDTH + 150) { // wrap after exiting right side
            cloud.x = -150 + state.cameraPosX;
        }
    }
}

/** Composite triangle mountain with inner + snow layers. */
export function drawMountain(mountain, floorPos_y, camX) {
    // Much more subtle parallax (close to foreground speed)
    const PARALLAX_FACTOR = 0.1; // 0=no movement, 1=normal; choose high for subtle effect
    const baseX = mountain.x_pos + camX * PARALLAX_FACTOR;
    noStroke();
    // Base two-tone body
    fill(125, 125, 125);
    triangle(baseX, floorPos_y, baseX + (310 * mountain.width), 150, baseX + (620 * mountain.width), floorPos_y);
    fill(170, 170, 170);
    triangle(baseX + (40 * mountain.width), floorPos_y, baseX + (310 * mountain.width), 200, baseX + (550 * mountain.width), floorPos_y);
    // Snow cap + subtle secondary patch (no vertical lines)
    fill(255);
    triangle(baseX + (250 * mountain.width), 250, baseX + (310 * mountain.width), 170, baseX + (365 * mountain.width), 250);
    fill(235);
    triangle(baseX + (295 * mountain.width), 240, baseX + (310 * mountain.width), 210, baseX + (325 * mountain.width), 240);
}

/** Stylized layered pine tree. */
export function drawTree(treePos_x, treePos_y) {
    const sway = state.windValue * 8; // increased horizontal sway
    fill(140, 70, 20);
    rect(treePos_x + sway * 0.2, treePos_y, 40, -150);
    fill(100, 160, 35);
    triangle(treePos_x - 40 + sway, treePos_y - 60, treePos_x + 20 + sway, treePos_y - 120, treePos_x + 80 + sway, treePos_y - 60);
    fill(100, 170, 35);
    triangle(treePos_x - 30 + sway * 1.1, treePos_y - 95, treePos_x + 20 + sway * 1.1, treePos_y - 150, treePos_x + 70 + sway * 1.1, treePos_y - 95);
    fill(100, 180, 35);
    triangle(treePos_x - 20 + sway * 1.2, treePos_y - 125, treePos_x + 20 + sway * 1.2, treePos_y - 180, treePos_x + 60 + sway * 1.2, treePos_y - 125);
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
    // Gradient shadow: darker at bottom, lighter near top
    const depthTop = floorPos_y + 35;
    const depthBottom = floorPos_y + 180;
    const innerLeft = canyon.x_pos + 10;
    const innerRight = canyon.x_pos + canyon.width - 10;
    const layers = 14;
    const h = (depthBottom - depthTop) / layers;
    noStroke();
    push();
    rectMode(CORNERS);
    for (let i = 0; i < layers; i++) {
        const y1 = depthTop + i * h;
        const y2 = y1 + h + 1;
        const t = i / (layers - 1);
        const alpha = lerp(40, 200, t); // increase darkness with depth
        const shrink = t * 12; // slight inward taper
        fill(15, 10, 5, alpha);
        rect(innerLeft + shrink, y1, innerRight - shrink, y2);
    }
    pop();
}

/** Soft distant rolling hill (parallax). */
export function drawHill(hill) {
    noStroke();
    const baseY = state.floorPosY + 20; // slightly below floor for depth
    fill(60, 170, 60, 180);
    ellipse(hill.x, baseY, hill.radius * 2, hill.radius * 1.1);
}

/** Small ground rock with highlight. */
export function drawRock(rock) {
    noStroke();
    fill(110, 105, 100);
    ellipse(rock.x, state.floorPosY - 8, rock.size * 1.4, rock.size);
    fill(160, 155, 150);
    ellipse(rock.x - rock.size * 0.2, state.floorPosY - 10, rock.size * 0.6, rock.size * 0.35);
}

/** Tiny flower. */
export function drawFlower(f) {
    push();
    const sway = state.windValue * 10;
    translate(f.x + sway * 0.6, state.floorPosY - 4);
    stroke(40, 120, 40);
    strokeWeight(2);
    line(0, 0, sway * 0.3, -f.height);
    noStroke();
    const petalColors = [
        [255, 200, 200], [255, 240, 150], [200, 220, 255], [255, 180, 240]
    ];
    const pc = petalColors[f.colorIndex % petalColors.length];
    fill(...pc);
    const r = f.height * 0.35;
    for (let i = 0; i < 5; i++) {
        const ang = (TWO_PI / 5) * i;
        ellipse(cos(ang) * r, -f.height + sin(ang) * r, r * 1.1, r * 0.9);
    }
    fill(255, 215, 0);
    ellipse(0, -f.height, r * 0.9, r * 0.9);
    pop();
}

/** Small grass tuft. */
export function drawGrassTuft(t) {
    push();
    const baseSway = state.windValue * 6;
    translate(t.x + baseSway * 0.2, state.floorPosY);
    stroke(50, 140, 50);
    strokeWeight(2);
    if (!t.blades) {
        t.blades = [];
        for (let i = 0; i < 5; i++) {
            t.blades.push({ ang: map(i, 0, 4, -0.6, 0.6) + random(-0.1, 0.1), len: t.height * random(0.7, 1) });
        }
    }
    for (const b of t.blades) {
        const dynamicLean = baseSway * 0.4;
        line(0, 0, sin(b.ang) * 6 + dynamicLean, -b.len);
    }
    pop();
}

/** Render coin if not yet collected. */
export function drawCollectible(t_collectible) {
    if (!t_collectible.isFound) {
        const centerY = t_collectible.y_pos - (t_collectible.size / 2);
        const pulse = 0.5 + 0.5 * sin(frameCount * 0.15);
        stroke(0);
        strokeWeight(2);
        // Outer glow ring
        noFill();
        stroke(255, 220, 60, 120);
        ellipse(t_collectible.x_pos, centerY, t_collectible.size * (1.1 + pulse * 0.05));
        // Main coin body
        stroke(0);
        fill(255, 215, 0);
        ellipse(t_collectible.x_pos, centerY, t_collectible.size);
        // Inner gradient simulation with layered circles
        noStroke();
        fill(255, 235, 140);
        ellipse(t_collectible.x_pos - 3, centerY - 3, t_collectible.size * 0.7);
        fill(255, 255, 255, 180);
        ellipse(t_collectible.x_pos - 6, centerY - 6, t_collectible.size * 0.35);
    // Sparkle highlight (static, faint pulse but no spin)
    const sparklePulse = 0.6 + 0.4 * sin(frameCount * 0.2 + t_collectible.x_pos * 0.05);
    fill(255,255,255,180 * sparklePulse);
    noStroke();
    ellipse(t_collectible.x_pos - t_collectible.size * 0.18, centerY - t_collectible.size * 0.45, t_collectible.size * 0.18, t_collectible.size * 0.30);
    }
}

/** Crawling worm composed of small segments with sinusoidal undulation. */
export function drawWorm(worm) {
    // Update motion
    worm.phase += 0.2;
    worm.x += worm.speed * worm.dir;
    // Reverse direction at bounds
    if (worm.x < 0) { worm.x = 0; worm.dir = 1; }
    if (worm.x > WORLD_WIDTH) { worm.x = WORLD_WIDTH; worm.dir = -1; }
    const amplitude = 3; // reduced for shorter worms
    const segmentSpacing = 5;
    noStroke();
    for (let s = 0; s < worm.segmentCount; s++) {
        const segX = worm.x - worm.dir * s * segmentSpacing;
        const wave = sin(worm.phase - s * 0.6) * amplitude;
        const segY = worm.y + wave * 0.2;
        const shade = 180 + s * 8;
        fill(shade, 100, 60);
    ellipse(segX, segY, 7, 5);
    }
    // Head details
    fill(0);
    ellipse(worm.x + worm.dir * 2, worm.y - 1, 2, 2);
}


/** Batch draw of world backdrop elements. */
export function drawScenery() {
    // Background layers
    // Distant hills (draw behind everything else except sky)
    for (let i = 0; i < state.hills.length; i++) drawHill(state.hills[i]);
    for (let i = 0; i < state.clouds.length; i++) drawCloud(state.clouds[i]);
    for (let i = 0; i < state.mountains.length; i++) drawMountain(state.mountains[i], state.floorPosY, state.cameraPosX);
    for (let i = 0; i < state.treesX.length; i++) drawTree(state.treesX[i], state.floorPosY);
    for (let i = 0; i < state.rocks.length; i++) drawRock(state.rocks[i]);
    for (let i = 0; i < state.flowers.length; i++) drawFlower(state.flowers[i]);
    for (let i = 0; i < state.grassTufts.length; i++) drawGrassTuft(state.grassTufts[i]);
    // Ground hazards
    for (let i = 0; i < state.canyons.length; i++) drawCanyon(state.canyons[i], state.floorPosY);
    // Platforms (above scenery so they are visible)
    for (let i = 0; i < state.platforms.length; i++) {
        const platform = state.platforms[i];
        stroke(120, 100, 20, 120);
        strokeWeight(2);
        fill(230, 210, 40);
        rect(platform.x_pos, platform.y_pos, platform.width, platform.height, 3);
    }
    // Worms (above ground but below collectibles/character)
    for (let i = 0; i < state.worms.length; i++) drawWorm(state.worms[i]);

}
