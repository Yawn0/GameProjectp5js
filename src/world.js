/* World generation + rendering helpers (ES module)
    Responsible only for drawing world/background & decorative entities.
    All positioning uses world coordinates; camera translation is applied in main draw loop.
*/
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
    const speed = random(0.15, 0.45);     // per-cluster horizontal drift speed
    const light = random(215, 250);       // base brightness for consistent cluster shading
    // Build 4 ellipses per seed with small random vertical compression for softness
    clouds.push({ x: cloud.x_pos,      y: cloud.y_pos * random(0.5, 0.9), width: 100 * random(0.8, 1.2), height: 60, speed, light });
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
    // Vertical bob: phase depends on x + time so different clouds desync; scaled by current windValue.
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
        cloud.x += cloud.speed; // simple constant drift (parallax layer speed chosen per cluster)
        // Wrap logic uses cameraPosX so far off‑screen clouds recycle seamlessly even after large camera jumps.
        if (cloud.x - state.cameraPosX > WORLD_WIDTH + 150) {
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

/** Base tree drawing (foreground layer, full size, no parallax). */
export function drawTree(tree, treePos_y) {
    drawParallaxTree(tree.x, treePos_y, 1, 0, true);
}

/** Parallax tree helper.
 * @param {number} x base world x
 * @param {number} groundY floor Y reference
 * @param {number} scale visual scale (1 = normal foreground size)
 * @param {number} parallaxFactor horizontal parallax factor (0 = lock to world, like foreground)
 * @param {boolean} full detail foliage (foreground) or simplified (mid/far)
 */
function drawParallaxTree(x, groundY, scale, parallaxFactor, full = false) {
    const camX = state.cameraPosX;
    const px = x + camX * parallaxFactor; // simulate depth: smaller factor => slower horizontal movement
    const sway = state.windValue * 8 * scale * (full ? 1 : 0.5); // reduce sway on distant layers
    const trunkWidth = 40 * scale;
    const trunkHeight = 130 * scale * (full ? 1 : 0.8);
    fill(140, 70, 20, full ? 255 : 220);
    rect(px + sway * 0.15, groundY, trunkWidth, -trunkHeight);
    // Foreground trees keep original layering formula. For distant layers we drop foliage so trunk top touches foliage base.
    let baseY = groundY - (150 * scale - trunkHeight);
    if (!full) {
        // Ensure first (bottom) simplified foliage triangle base aligns with trunk top.
        // First simplified triangle bottom y = baseY - 60*scale - 10*scale (topOffset used below = 10*scale).
        // Set that equal to trunk top (groundY - trunkHeight): solve for baseY.
        // baseY = groundY - trunkHeight + 70*scale.
        baseY = groundY - trunkHeight + 70 * scale;
    }
    // Foliage layers (simplified for distance)
    function tri(off, topOffset, wScale, hOffset, swayMul, col) {
        fill(col[0], col[1], col[2], full ? 255 : 230);
        triangle(
            px - (40 * scale * wScale) + sway * swayMul + off,
            baseY - (60 * scale) - topOffset,
            px + (20 * scale) + sway * swayMul + off,
            baseY - (120 * scale) - hOffset,
            px + (80 * scale * wScale) + sway * swayMul + off,
            baseY - (60 * scale) - topOffset
        );
    }
    // Color gradient shifts slightly with scale to create depth desaturation
    const baseCol = [100, 160, 35];
    const midCol = [100, 170, 35];
    const topCol = [100, 180, 35];
    if (full) {
        tri(0, 0, 1, 0, 1.0, baseCol);
        tri(0, 35 * scale, 0.9, 30 * scale, 1.1, midCol);
        tri(0, 65 * scale, 0.8, 60 * scale, 1.2, topCol);
    } else {
        // Fewer layers for distant trees
        tri(0, 10 * scale, 0.9, 20 * scale, 0.8, baseCol);
        tri(0, 45 * scale, 0.75, 50 * scale, 0.9, midCol);
    }
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
export function drawCollectible(collectible) {
    if (!collectible.isFound) {
        const centerY = collectible.y_pos - (collectible.size / 2);
        const pulse = 0.5 + 0.5 * sin(frameCount * 0.15);
        stroke(0);
        strokeWeight(2);
        // Outer glow ring
        noFill();
        stroke(255, 220, 60, 120);
        ellipse(collectible.x_pos, centerY, collectible.size * (1.1 + pulse * 0.05));
        // Main coin body
        stroke(0);
        fill(255, 215, 0);
        ellipse(collectible.x_pos, centerY, collectible.size);
        // Inner gradient simulation with layered circles
        noStroke();
        fill(255, 235, 140);
        ellipse(collectible.x_pos - 3, centerY - 3, collectible.size * 0.7);
        fill(255, 255, 255, 180);
        ellipse(collectible.x_pos - 6, centerY - 6, collectible.size * 0.35);
        // Sparkle highlight (static, faint pulse but no spin)
        const sparklePulse = 0.6 + 0.4 * sin(frameCount * 0.2 + collectible.x_pos * 0.05);
        fill(255,255,255,180 * sparklePulse);
        noStroke();
        ellipse(collectible.x_pos - collectible.size * 0.18, centerY - collectible.size * 0.45, collectible.size * 0.18, collectible.size * 0.30);
    }
}

/** Crawling worm composed of small segments with sinusoidal undulation. */
export function drawWorm(worm) {
    // Update motion:
    //  phase drives sinusoidal offset for each segment (gives crawling wiggle)
    //  horizontal position advances at (speed * scalar) in current direction
    worm.phase += 0.15;            // Larger = faster wiggle frequency
    worm.x += worm.speed * 0.6 * worm.dir; // 0.6 dampens raw speed so random range stays gentle
    // Reverse direction at bounds
    if (worm.x < 0) { worm.x = 0; worm.dir = 1; }
    if (worm.x > WORLD_WIDTH) { worm.x = WORLD_WIDTH; worm.dir = -1; }
    const amplitude = 2.2;          // vertical wave amplitude (small for subtle motion)
    const segmentSpacing = 5;       // horizontal distance between segment centers
    noStroke();
    // Bright, high-contrast palette: warm gradient (head = vivid yellow, tail = deep orange) + thin outline.
    // Improves readability against green ground & brown canyons.
    for (let s = 0; s < worm.segmentCount; s++) {
        const segX = worm.x - worm.dir * s * segmentSpacing;      // trail positioning
        const wave = sin(worm.phase - s * 0.6) * amplitude;       // body undulation
        const segY = worm.y + wave * 0.15;
        const t = s / max(1, (worm.segmentCount - 1));            // 0 (head) -> 1 (tail)
        // Gradient: head bright yellow -> tail rich orange-red
        const r = lerp(255, 255, t);      // keep red maxed
        const g = lerp(230, 90, t);       // fade green for warmer tail
        const b = lerp(40, 10, t);        // slight darkening in blue channel
        stroke(20, 10, 0, 200);
        strokeWeight(1);
        fill(r, g, b);
        ellipse(segX, segY, 8, 6);       // slightly larger for visibility
    }
    // Head details
    noStroke();
    fill(0);
    ellipse(worm.x + worm.dir * 2, worm.y - 1, 2.5, 2.5); // larger eye for clarity
}

/** Brief splash effect */
export function drawSplash(s) {
    // Lazily initialize particle rays (so factory stays lightweight)
    if (!s.particles) {
        s.particles = [];
        for (let i = 0; i < 10; i++) {
            s.particles.push({
                ang: random(TWO_PI),
                speed: random(1, 3.5),
                r: 0,
                maxR: random(14, 26)
            });
        }
    }
    // Normalized life progress (0 -> birth, 1 -> end)
    const t = 1 - (s.life / s.maxLife);
    for (const p of s.particles) {
        p.r = lerp(0, p.maxR, t);
        const px = s.x + cos(p.ang) * p.r;
        const py = s.y - 4 + sin(p.ang) * p.r * 0.6;
        noStroke();
        fill(255, 200, 120, 200 * (1 - t));
        ellipse(px, py, 4, 4);
    }
    // Central expanding ring (ties particles together visually)
    noFill();
    stroke(255, 220, 150, 180 * (1 - t));
    strokeWeight(4 - t * 3);
    const ringR = 8 + t * 18;
    ellipse(s.x, s.y - 4, ringR * 1.5, ringR);
    s.life--;
}


/** Batch draw of world backdrop elements. */
export function drawScenery() {
    // Ordered back-to-front to achieve natural layering.
    // 1. Distant background silhouettes (hills, far parallax trees layer 3)
    for (let i = 0; i < state.hills.length; i++) drawHill(state.hills[i]);
    // Far trees (layer 3) behind clouds & mountains for depth
    if (state.trees3) {
        for (let i = 0; i < state.trees3.length; i++) {
            const t = state.trees3[i];
            drawParallaxTree(t.x, state.floorPosY, t.scale, 0.06, false); // slowest parallax
        }
    }
    // 2. Atmospheric clouds (parallax + wrap)
    for (let i = 0; i < state.clouds.length; i++) drawCloud(state.clouds[i]);
    // 3. Mountains (slight parallax)
    for (let i = 0; i < state.mountains.length; i++) drawMountain(state.mountains[i], state.floorPosY, state.cameraPosX);
    // 4. Mid-ground parallax trees layer 2 (between mountains and foreground layer 1)
    if (state.trees2) {
        for (let i = 0; i < state.trees2.length; i++) {
            const t = state.trees2[i];
            drawParallaxTree(t.x, state.floorPosY, t.scale, 0.1, false); // medium parallax (mountains use 0.1 too; we could slightly adjust)
        }
    }
    // 5. Foreground trees layer 1 (no parallax shift, original dense set)
    for (let i = 0; i < state.trees.length; i++) drawTree(state.trees[i], state.floorPosY);
    for (let i = 0; i < state.rocks.length; i++) drawRock(state.rocks[i]);
    for (let i = 0; i < state.flowers.length; i++) drawFlower(state.flowers[i]);
    for (let i = 0; i < state.grassTufts.length; i++) drawGrassTuft(state.grassTufts[i]);
    // 6. Ground hazards
    for (let i = 0; i < state.canyons.length; i++) drawCanyon(state.canyons[i], state.floorPosY);
    // 7. Interactive platforms (above terrain)
    for (let i = 0; i < state.platforms.length; i++) {
        const platform = state.platforms[i];
        stroke(120, 100, 20, 120);
        strokeWeight(2);
        fill(230, 210, 40);
        rect(platform.x_pos, platform.y_pos, platform.width, platform.height, 3);
    }
    // 8. Critters / small animation details
    for (let i = 0; i < state.worms.length; i++) drawWorm(state.worms[i]);
}
