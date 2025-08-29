/* Gameplay loop helpers: input, physics, scoring, UI */

/** Map raw keyCode to canonical direction key. */
function getDirectionalKey(keyCode) {
    if (keyCode == 65 || keyCode == LEFT_ARROW) { return LEFT_ARROW; }
    if (keyCode == 68 || keyCode == RIGHT_ARROW) { return RIGHT_ARROW; }
    if (keyCode == 87 || keyCode == UP_ARROW || keyCode == 32) { return UP_ARROW; }
    return '';
}

/** Handle key down events (movement + jump). */
function keyPressed() {
    if (_gameChar.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) {
        _gameChar.isLeft = true;
    }
    else if (directionKey === RIGHT_ARROW) {
        _gameChar.isRight = true;
    }
    else if (directionKey === UP_ARROW && !_gameChar.isFalling) {
        _sound.JUMP.play();
        _gameChar.y -= JUMP_HEIGHT;
    }
}

/** Stop horizontal movement on key up. */
function keyReleased() {
    if (_gameChar.isPlummeting) { return; }
    const directionKey = getDirectionalKey(keyCode);
    if (directionKey === LEFT_ARROW) {
        _gameChar.isLeft = false;
    }
    else if (directionKey === RIGHT_ARROW) {
        _gameChar.isRight = false;
    }
}

/** Advance character physics + pick proper animation. */
function drawCharacter() {
    if (_gameChar.isLeft && _gameChar.isFalling) {
        blobbyJumpingLeft();
    }
    else if (_gameChar.isRight && _gameChar.isFalling) {
        blobbyJumpingRight();
    }
    else if (_gameChar.isLeft) {
        blobbyWalkingLeft();
    }
    else if (_gameChar.isRight) {
        blobbyWalkingRight();
    }
    else if (_gameChar.isFalling || _gameChar.isPlummeting) {
        blobbyJumping();
    }
    else {
        blobbyStandingFront();
    }

    if (_gameChar.isLeft) {
        _gameChar.x -= BLOBBY.SPEED;
    }
    else if (_gameChar.isRight) {
        _gameChar.x += BLOBBY.SPEED;
    }

    if (_gameChar.y < _floorPos_y) {
        _gameChar.y += GRAVITY_SPEED;
        _gameChar.isFalling = true;
    }
    else {
        _gameChar.isFalling = false;
    }

    for (let i = 0; i < _canyons.length; i++) {
        checkCanyon(_canyons[i]);
    }

    if (_gameChar.isPlummeting) {
        _gameChar.y += PLUMMET_SPEED;
        _gameChar.isLeft = false;
        _gameChar.isRight = false;
    }
}

/** Collect coin when player overlaps. */
function checkCollectable(t_collectible) {
    if (dist(_gameChar.x, _gameChar.y, t_collectible.x_pos, t_collectible.y_pos) < 20) {
        _sound.COLLECT.play();
        t_collectible.isFound = true;
        _gameScore++;
    }
}

/** Trigger plummet when over canyon gap. */
function checkCanyon(t_canyon) {
    const isOverCanyon = _gameChar.x > t_canyon.x_pos && _gameChar.x < t_canyon.x_pos + t_canyon.width && _gameChar.y >= _floorPos_y;
    if (isOverCanyon) {
        _gameChar.isPlummeting = true;
    }
}

/** Detect proximity to flag pole top. */
function checkFinishLine() {
    const isOverFinishLine = abs(_gameChar.x - _flagPole.x_pos) < 10 && abs(_gameChar.y - _flagPole.y_pos) < 10;
    if (isOverFinishLine) {
        _flagPole.isReached = true;
    }
}

/** Life loss + death state check. */
function checkPlayerDie() {
    if (_gameChar.y > height) {
        _sound.DEATH.play();
        _lives--;
        _gameChar.reset(_floorPos_y);
        _cameraPosX = 0;
    }
    if (_lives <= 0) {
        _gameChar.isDead = true;
    }
}

/** Display remaining lives as hearts. */
function drawLives() {
    fill(0);
    textSize(32);
    for (let i = 0; i < _lives; i++) {
        push();
        translate(_cameraPosX + 30 + i * 40, 30);
        fill(255, 0, 0);
        noStroke();
        beginShape();
        vertex(0, 0);
        bezierVertex(-10, -10, -20, 0, 0, 10);
        bezierVertex(20, 0, 10, -10, 0, 0);
        endShape();
        pop();
    }
}

/** Render current score HUD text. */
function drawGameScore() {
    fill(0);
    textSize(26);
    text("Score: " + _gameScore, _cameraPosX + 20, 70);
}

/** Draw pole and test for completion. */
function drawFinishLine() {
    fill(0);
    if (_flagPole.isReached) {
        fill(200);
    }
    else {
        checkFinishLine();
    }
    rect(_flagPole.x_pos, _flagPole.y_pos, _flagPole.width, -_flagPole.height);
}

/** Game over banner. */
function drawGameOver() {
    fill(0);
    textSize(32);
    text("Game Over", _cameraPosX + 20, 100);
}

/** Win banner + sound. */
function drawGameWin() {
    _sound.WIN.play();
    fill(0);
    textSize(32);
    text("level complete", _cameraPosX + 20, 100);
}
