//Game Configuration
const config = {
    keys: {space: false, up: false, down: false},
    playerBounds: {maxY: 420, minY: 60},
    shot: {MaxX: 880, Speed: 7, last: 0},
    keyCodes: {space: ' ', up: 'ArrowUp', down: 'ArrowDown'}
};

//Game Status
let gamestate = {
    game: {hasFired: false, lost: false, score: 0},
    boss: {timeSince: 0, spawns: 0, spawned: false, first: false},
    timers: {intervalIDs: [], playtime: 0, age: 0}
};

//Background Graphics
let graphics = {
    backgroundImage: undefined,
    gameOverScreen: undefined
}

//Anything that moves
let entities = {
    player: undefined,
    shot: undefined,
    enemies: [[], [], []],
    shots: [],
    enemyshots: [],
    bosses: []
}

// Update key state
//This is stupid, but any other approach just refuses to work
function updateKeyState(e, state) {
    switch(e.key) {
        case config.keyCodes.space: // Space
            config.keys.space = state;
            break;
        case config.keyCodes.up: // Up
            config.keys.up = state;
            break;
        case config.keyCodes.down: // Down
            config.keys.down = state;
            break;
    }
}


//adding listeners for keys
document.addEventListener('keydown', function(e) {
    updateKeyState(e, true);
});

document.addEventListener('keyup', function(e) {
    updateKeyState(e, false);
});

//initializes upon loading the site
window.onload = function init(){
    paper.setup("canvas");
    document.querySelector('button').addEventListener('click', startGame);
};

//Starts the game upon pressing the "start" button
function startGame(){
    document.querySelector('button').style.display = 'none';
    document.getElementById('scoredisplay').style.display = 'block'
    loadImages();

    const actions = [
        {func: update, delay: 1000 / 60},
        {func: testCollision, delay: 1000 / 60},
        {func: shoot, delay: 1000 / 60},
        {func: refillAmmo, delay: 1000 / 2},
        {func: spawnBoss, delay: 5000},
        {func: createEnemies1, delay: 5000},
        {func: createEnemies2, delay: 3000},
        {func: createEnemies3, delay: 2000},
        {func: enemy3Shoots, delay: 1000},
        {func: bossShoots, delay: 750}
    ];

    actions.forEach(action => setAndStoreInterval(action.func, action.delay));
    draw();
}

//support functions
function setAndStoreInterval(func, delay) {
    gamestate.timers.intervalIDs.push(setInterval(func, delay));
}

//generate random integer between min and max
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + Math.abs(min))
}

function removeEverything() {
    Object.values(graphics).forEach(graphic => graphic && graphic.remove());
    Object.values(entities).forEach(entityArray => {
        entityArray.forEach(entity => entity.raster && entity.raster.remove());
    });
}

function resetGame() {
    removeEverything();
    graphics = { background: null};
    entities = { player: null, enemies: [[], [], []], bosses: [], shots: [], enemyshots: [] };
    gamestate.timers.intervalIDs.forEach(id => clearInterval(id));
    gamestate.timers.intervalIDs = [];
}

function getPlayerName() {
    let playerName = null;
    while(!playerName) {
        playerName = prompt("Bitte geben Sie Ihren Namen ein:");
    }
    return playerName;
}

function updateScoreBoard(playerName){
    //Define Scoreboard entries
    let scoreBoards = Array.from({length: 5}, (_, i) => document.getElementById('scoreBoardEntry' + (i + 1)));
    let playerNames = Array.from({length: 5}, (_, i) => document.getElementById('playerName' + (i + 1)));

    //Take existing entries from localStorage, if they exist - Otherwise place empty array
    let scores = JSON.parse(localStorage.getItem('scores')) || [];

    //add current score to scoreboard array and push the scores to localStorage
    scores.push({ name: playerName, score: gamestate.game.score });
    localStorage.setItem('scores', JSON.stringify(scores));

    //sort scores, highest to lowest
    //then take only the first five entries
    scores.sort((a, b) => b.score - a.score);
    scores = scores.slice(0, 5);

    //add the entries to the scoreboard, if entries exist - otherwise leave empty
    scoreBoards.forEach((scoreBoard, index) => {
        scoreBoard.innerHTML = scores[index] ? scores[index].score : '';
    });
    playerNames.forEach((playerName, index) => {
        playerName.innerHTML = scores[index] ? scores[index].name + ' : ' : '';
    });
}

//Game update
function update(){
    gamestate.timers.playtime++;
    if(config.keys.down && entities.player.position.y <= config.playerBounds.maxY){
        entities.player.position.y += 4;
    }
    if(config.keys.up && entities.player.position.y >= config.playerBounds.minY){
        entities.player.position.y -= 4;
    }
    if(!gamestate.boss.spawned){
        gamestate.boss.timeSince++;
    }

    document.getElementById("score").innerHTML = gamestate.game.score;
    //boss-behaviour
    entities.bosses.forEach(bossBehaviour)
    //Behaviour of first enemy
    entities.enemies.forEach((enemyType, index) => {
        enemyType.forEach(window['enemy' + (index + 1) + 'Behaviour']);
    });
    //Logic for shot movement
    entities.shots.forEach(shot => {
        shot.raster.position.x += config.shot.Speed;
        if(shot.raster.position.x > config.shot.MaxX){
            shot.raster.remove();
            entities.shots = entities.shots.filter(u => u != shot);
        }
    });
    entities.enemyshots.forEach(EShotMovement)
}

//Hitbox logic, be careful with this. not even I rightly know how it works
//BUG Some explosions are not scaled correctly. Presumably that bug is in here
function testCollision(){
    //Player Hitbox
    let playerHitbox;
    if (entities.player){playerHitbox = entities.player.bounds;}
    //Hitbox for the first enemy type
    entities.enemies[0].forEach(function(enemy1){
        let enemy1Hitbox = enemy1.raster.bounds;
        
        if(entities.player && playerHitbox.intersects(enemy1Hitbox)){
            entities.player.source = 'img/Explosion.png';
            enemy1.raster.remove();
            entities.enemies[0] = entities.enemies[0].filter(u => u != enemy1);
            gamestate.game.lost = true;
        }
        entities.shots.forEach(function(shot){
            let shotHitbox = shot.raster.bounds;
            if (shotHitbox.intersects(enemy1Hitbox)) {
                if(!enemy1.hit){
                    gamestate.game.score += 1;
                }
                enemy1.hit = true; 
                enemy1.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.raster.remove();
                entities.enemies[0] = entities.enemies[0].filter(u => u != enemy1);
                setTimeout(() => {
                    enemy1.raster.remove();
                }, 500);}
        })
    });
    //Hitbox for the second enemy type
    entities.enemies[1].forEach(function(enemy2){
        let enemy2Hitbox = enemy2.raster.bounds
        if(entities.player && playerHitbox.intersects(enemy2Hitbox)){
            entities.player.source = 'img/Explosion.png';
            enemy2.raster.remove();
            entities.enemies[1] = entities.enemies[1].filter(u => u != enemy2);
            gamestate.game.lost = true;
        }
        entities.shots.forEach(function(shot){
            let shotHitbox = shot.raster.bounds
            if (shotHitbox.intersects(enemy2Hitbox)) {
                if(!enemy2.hit){
                    gamestate.game.score += 2;
                }
                enemy2.hit = true;
                enemy2.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.raster.remove();
                entities.enemies[1] = entities.enemies[1].filter(u => u != enemy2);
                setTimeout(() => {
                    enemy2.raster.remove()
                }, 500);}
        })
    })
    //Hitbox for The third enemy type
    entities.enemies[2].forEach(function(enemy3){
        let enemy3Hitbox = enemy3.raster.bounds;
        if(playerHitbox.intersects(enemy3Hitbox)){
            entities.player.source = 'img/Explosion.png';
            entities.enemies[2] = entities.enemies[2].filter(u => u != enemy3);
            enemy3.raster.remove();
            gamestate.game.lost = true;
        }
        entities.shots.forEach(shot =>{
            let shotHitbox = shot.raster.bounds;
            if (shotHitbox.intersects(enemy3Hitbox)) {
                if(!enemy3.hit){
                    gamestate.game.score += 3;
                }
                enemy3.hit = true;
                enemy3.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.raster.remove();
                setTimeout(() => {
                    entities.enemies[2] = entities.enemies[2].filter(u => u != enemy3);
                    enemy3.raster.remove();
                }, 500);}
        })
        //hitbox for enemy shots
        entities.enemyshots.forEach(enemyshot => {
            let EShotHitbox = enemyshot.raster.bounds;
            if(playerHitbox.intersects(EShotHitbox)){
            entities.player.source = 'img/Explosion.png';
            entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
            enemyshot.raster.remove();
            gamestate.game.lost = true;}
        })
    })
    // Hitbox for the boss
    entities.bosses.forEach(function(boss){
        let bossHitbox = boss.raster.bounds;
        entities.shots.forEach(function(shot){
            let shotHitbox = shot.raster.bounds;
            if (bossHitbox.intersects(shotHitbox)) {
                boss.bossHits++;
                entities.shots = entities.shots.filter(u => u != shot);
                shot.raster.remove();
            }
        })
        //hitbox for enemy shots
        entities.enemyshots.forEach(function(enemyshot){
            let EShotHitbox = enemyshot.raster.bounds;
            if(playerHitbox .intersects(EShotHitbox)){
                entities.player.source = 'img/Explosion.png';
                entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
                enemyshot.raster.remove();
                gamestate.game.lost = true;}
        })
    })
}

function shoot() {
    const minShotInterval = 500;
    let currentTime = new Date().getTime();
    if (config.keys.space && !gamestate.game.hasFired && currentTime - config.shot.last > minShotInterval) {
        entities.shot = new paper.Raster('img/YourLaser.png');
        entities.shot.position = new paper.Point(entities.player.position.x + 50, entities.player.position.y);
        entities.shot.scaling = new paper.Size(1, 1);
        entities.shots.push({ raster: entities.shot });
        gamestate.game.hasFired = true;
        config.shot.last = currentTime;
    }
}

//XXX Possibly unnecessary. Remove if so.
function refillAmmo() {
    gamestate.game.hasFired = false;
}

//Making enemies appear
function createEnemy(x, y, width, height, img, array, additionalproperties = {}) {
    let raster = new paper.Raster(img);
    raster.position = new paper.Point(x, y);
    raster.scaling = new paper.Size(width, height);
    array.push({ raster: raster, hit: false, ...additionalproperties });
}

//making enemies disappear
function removeEntity(entity, entityarray) {
    if (entity.raster.position.x < -25 || entity.raster.position.y < -20 || entity.raster.position.y > 500) {
        entity.raster.remove();
        return entityarray.filter(u => u != entity);
    }
    return entityarray;
}

//Defining enemy properties
function createEnemies1() {
    if (!gamestate.boss.spawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 4, 2.5, 'img/EnemySpaceship1.png', entities.enemies[0]);
    }
}

function createEnemies2() {
    if (gamestate.timers.playtime >= 300 && !gamestate.boss.spawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 2, 2, 'img/EnemySpaceship2.png', entities.enemies[1], {rerollTime: 0, zigzag: Math.random() < 0.5, zigzagHistory: []});
    }
}

function createEnemies3() {
    if (gamestate.timers.playtime >= 600 && entities.enemies[2].length < 2 && !gamestate.boss.spawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 2.5, 2.5, 'img/EnemySpaceship3.png', entities.enemies[2], { age: 0, direction: null, initial: false });
    }
}

function spawnBoss() {
    if (gamestate.timers.playtime >= 1500 && !gamestate.boss.first) {
        createEnemy(900, 250, 3, 3, 'img/Boss.png', entities.bosses, { bossHits: 0, direction: null }); 
        setInterval(createEnemies1, 3000);
        setInterval(createEnemies2, 2000);
        setInterval(createEnemies3, 1000);
        gamestate.boss.spawned = true;
        gamestate.boss.first = true;
    } else if (gamestate.timers.playtime >= 2000 && gamestate.boss.timeSince >= 1500 && entities.bosses.length < 1) {
        createEnemy(900, 200, 100, 75, 'img/Boss.png', entities.bosses, { bossHits: 0, direction: null });
        gamestate.boss.spawned = true;
    }
    gamestate.boss.timeSince = 0;
}



//behaviour for the enemies
//Boss
function bossBehaviour(boss){
    let bossRaster = boss.raster.position;
    if(bossRaster.x > 750){
        bossRaster.x -= 3;
        gamestate.boss.spawned = true;
    }
    else{
        if(bossRaster.y <= 60 || (boss.direction && bossRaster.y < 420)){
            bossRaster.y += 3;
            boss.direction = true;
        }
        else if(bossRaster.y >= 420 || (!boss.direction && bossRaster.y > 60)){
            bossRaster.y -= 3;
            boss.direction = false;
        }
    }
    if(boss.bossHits >= 3){
        if(gamestate.boss.spawned == true){
            gamestate.game.score += 5;
        }
        gamestate.boss.spawned = false;
        boss.raster.source = 'img/Explosion.png';
        setTimeout(() => {
            boss.raster.remove();
            entities.bosses = entities.bosses.filter(u => u != boss);
        }, 500);
    }
}
//first enemy
function enemy1Behaviour(enemy1){
    if(!enemy1.hit){
        enemy1.raster.position.x -= 3;
    }
    entities.enemies[0] = removeEntity(enemy1, entities.enemies[0]);
}
//second enemy
function enemy2Behaviour(enemy2){
    if(!enemy2.hit){
        enemy2.raster.position.x -= 5;
        if(typeof enemy2.interval === 'undefined' || enemy2.rerollTime > enemy2.interval){
            enemy2.interval = randomIntFromInterval(30, 60);
            enemy2.zigzag = adjustZigzagBias(enemy2.zigzagHistory); // Reset zigzag
            enemy2.rerollTime = 0; // Reset rerollTime
        }

        if (enemy2.zigzagHistory.length > 1) {
            enemy2.zigzagHistory.shift(); // Remove oldest direction
        }
        enemy2.zigzagHistory.push(enemy2.zigzag); // Add new direction

        if(enemy2.zigzag){
            enemy2.raster.position.y -= 3;
        } else {
            enemy2.raster.position.y += 3;
        }
        enemy2.rerollTime++;
    }
    entities.enemies[1] = removeEntity(enemy2, entities.enemies[1]);
}

function adjustZigzagBias(zigzagHistory) {
    if (zigzagHistory.length < 2 || zigzagHistory[0] !== zigzagHistory[1]) {
        // If less than 2 history or last two directions were not the same, no bias
        return Math.random() < 0.5;
    } else {
        // If last two directions were the same, bias against same direction
        return zigzagHistory[0] ? Math.random() < 0.25 : Math.random() >= 0.25;
    }
}

//third enemy
function enemy3Behaviour(enemy3){
    let enemy3Position = enemy3.raster.position;
    if (enemy3.initial == false){
        enemy3.direction = Math.random() < 0.5;
        enemy3.initial = true;
    }
    if(!enemy3.hit){
        if(gamestate.boss.spawned || enemy3.age >= 400){
            enemy3Position.x -= 6;
        }
        else if (enemy3.age < 400 && enemy3Position.x > 780){
            enemy3Position.x -= 6;
        }
        else if(enemy3Position.x == 780){
            if((enemy3.direction && enemy3Position.y < 420) || (!enemy3.direction &&  enemy3Position.y > 60)){
                enemy3Position.y += enemy3.direction ? 3 : -3;
            }
            else if(enemy3Position.y <= 60 || enemy3Position.y >= 420){
                enemy3.direction = enemy3Position.y <= 60;
            }
        }   
        enemy3.age++;
    }
    entities.enemies[2] = removeEntity(enemy3, entities.enemies[2])
}
//Logic for enemy attacks
function enemy3Shoots(){
    if(!gamestate.boss.spawned){
        entities.enemies[2].forEach(function(enemy3){
            let enemy3Position = enemy3.raster.position;
            if(!enemy3.hit && enemy3Position.x == 780){
                let enemyShot = new paper.Raster('img/EnemyLaser.png')
                enemyShot.position = new paper.Point(enemy3Position.x - 20, enemy3Position.y + 20);
                enemyShot.size = new paper.Size(29, 10);
                let shotEntity = {raster: enemyShot}
                entities.enemyshots.push(shotEntity);
            }
        })
    }
}

function bossShoots(){
    if(gamestate.boss.spawned){
        entities.bosses.forEach(function(boss){
            let bossPosition = boss.raster.position;
            if (bossPosition.x <= 750){
                let enemyShot = new paper.Raster('img/EnemyLaser.png')
                enemyShot.position = new paper.Point(bossPosition.x - 50, bossPosition.y + 15);
                enemyShot.size = new paper.Size(29, 10);
                let shotEntity = {raster: enemyShot};
                entities.enemyshots.push(shotEntity);
            }
        })
    }
}

function EShotMovement(enemyshot){
    enemyshot.raster.position.x -= 5;
    if(enemyshot.raster.position.x < -10){
        entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
        enemyshot.raster.remove();
    }
}

//Points towards where the spritefiles are
function loadImages(){
    if (gamestate.game.lost){
        setTimeout(() => {
            let playerName = getPlayerName();
            updateScoreBoard(playerName);
            graphics.gameOverScreen = new paper.Raster('img/GameOver.jpg');
            graphics.gameOverScreen.position = paper.view.center;
            document.getElementById('scoredisplay').style.display = 'none';
            setTimeout(() => {
                document.getElementById('scoreBoard').style.display = 'block';
            }, 1000);
        }, 500);
    }
    else{
    graphics.backgroundImage = new paper.Raster('img/background.jpg');
    graphics.backgroundImage.position = paper.view.center
    entities.player = new paper.Raster('img/PlayerSpaceship.png');
    entities.player.position = new paper.Point(100, 250);
    entities.player.scaling = new paper.Size(2.5, 2.3);
    }
}

//Generates the Gamescreen
function draw(){
    if (gamestate.game.lost){
        setTimeout(() => {
            resetGame();
            loadImages();
        }, 1000);
    }
    else{
    paper.view.update();
    paper.view.draw();
    requestAnimationFrame(draw);
    }
}