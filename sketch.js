/* Orchestration: boots p5, sets state, runs frame loop (values unchanged) */

/** p5 setup: load assets, init canvas + state */
function setup() {
    soundFormats('mp3', 'wav');
    _sound = {
        baseVolume: 0.1,
        JUMP: loadSound('assets/jump.wav'),
        COLLECT: loadSound('assets/collect.wav'),
        DEATH: loadSound('assets/death.wav'),
        WIN: loadSound('assets/win.wav')
    };
    _sound.JUMP.setVolume(_sound.baseVolume);
    _sound.COLLECT.setVolume(_sound.baseVolume);
    _sound.DEATH.setVolume(_sound.baseVolume);
    _sound.WIN.setVolume(_sound.baseVolume);

    createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    _floorPos_y = height * FLOOR_HEIGHT_RATIO;
    startGame();
}

/** Reset level state (positions, score, lives) */
function startGame() {
    _lives = 3;
    _cameraPosX = 0;
    _gameChar = factory.gameChar(_floorPos_y);
    _gameScore = 0;
    _collectables = [];
    _canyons = [];
    generateCollectables();
    generateCanyons();
    _trees_x = [85, 300, 450, 700, 850];
    _cloudsCoordinates = [
        { x_pos: 100, y_pos: 100 },
        { x_pos: 200, y_pos: 80 },
        { x_pos: 500, y_pos: 120 },
        { x_pos: 600, y_pos: 90 },
        { x_pos: 800, y_pos: 100 },
        { x_pos: 1000, y_pos: 110 }
    ];
    _clouds = factory.clouds(_cloudsCoordinates);
    _mountains = [
        { x_pos: 0, width: 1 },
        { x_pos: 600, width: 1.1 },
        { x_pos: 450, width: 1.2 },
        { x_pos: 300, width: 0.6 }
    ];
    _flagPole = factory.flagPole(1300, _floorPos_y);
}

/** Populate canyon list */
function generateCanyons() { for (let i = 0; i < 2; i++) _canyons.push(factory.canyon()); }
/** Populate collectibles list */
function generateCollectables() { for (let i = 0; i < 4; i++) _collectables.push(factory.collectible(_floorPos_y)); }

/** Main frame loop */
function draw() {
    _cameraPosX += _gameChar.isLeft ? -BLOBBY.SPEED : (_gameChar.isRight ? BLOBBY.SPEED : 0);
    background(100, 155, 255);
    drawGround();
    translate(-_cameraPosX, 0);
    drawScenery();
    checkPlayerDie();
    if (!_gameChar.isDead) {
        drawCharacter();
    }
    for (let i = 0; i < _collectables.length; i++) {
        drawCollectible(_collectables[i]);
        checkCollectable(_collectables[i]);
        if (_collectables[i].isFound) {
            _collectables.splice(i, 1);
        }
    }
    drawLives();
    drawGameScore();
    drawFinishLine();
    if (_gameChar.isDead) {
        drawGameOver();
    }
    if (_flagPole.isReached) {
        drawGameWin();
        _flagPole.isReached = false;
    }
}