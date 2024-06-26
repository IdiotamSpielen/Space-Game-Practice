//movement logic
const keys = {space: false, up: false, down: false};
const playerBounds = {maxY: 420, minY: 60};
const shotConfig = {MaxX: 880, Speed: 7, last: 0};


let gameStatus = {hasFired: false, lost: false, score: 0};

//Logic variables for bosses
let bossStatus = {
    timeSince: 0,
    spawns: 0,
    spawned: false,
    first: false };

//Graphic/logic variables
let graphics = {
    backgroundImage: undefined,
    gameOverScreen: undefined,
    player: undefined,
    shot: undefined
}

//Calculation Variables
let entities = {
    enemies1: [],
    enemies2: [],
    enemies3: [],
    shots: [],
    enemyshots: [],
    bosses: []
}

//timers
let timers = {
    intervalIDs: [],
    playtime: 0, //for determining boss spawns
    age: 0 //for later calculations relating to third enemy
}

//Button-Logic
const keyCodes = {
    space: ' ',
    up: 'ArrowUp',
    down: 'ArrowDown'
}

function updateKeyState(e, state) {
    switch(e.key) {
        case keyCodes.space: // Space
            keys.space = state;
            break;
        case keyCodes.up: // Up
            keys.up = state;
            break;
        case keyCodes.down: // Down
            keys.down = state;
            break;
    }
}

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

//support functions:

function setAndStoreInterval(func, delay) {
    let id = setInterval(func, delay);
    timers.intervalIDs.push(id);
}

//generate random integer between min and max
function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + Math.abs(min))
}

function removeEverything() {
    graphics.player.remove();
    graphics.backgroundImage.remove();
    Object.keys(entities).forEach(key => {
        entities[key].forEach(entity => {
            entity.raster.remove();
        });
    });
}

function resetGame() {
    removeEverything();
    graphics = { player: null, background: null};
    entities = { enemies1: [], enemies2: [], enemies3: [], bosses: [], shots: [], enemyshots: [] };
    timers.intervalIDs.forEach(id => clearInterval(id));
    timers.intervalIDs = [];
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
    let scoreBoards = [];
    let playerNames = [];
    for (let i = 1; i <= 5; i++) {
        scoreBoards.push(document.getElementById('scoreBoardEntry' + i));
        playerNames.push(document.getElementById('playerName' + i));
    }

    //Take existing entries from localStorage, if they exist - Otherwise place empty array
    let scores = JSON.parse(localStorage.getItem('scores')) || [];

    //add current score to scoreboard array and push the scores to localStorage
    scores.push({ name: playerName, score: gameStatus.score });
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
        playerName.innerHTML = scores[index] ? scores[index].name + ':' : '';
    });
}

//Game update
function update(){
    timers.playtime++;
    if(keys.down && graphics.player.position.y <= playerBounds.maxY){
        graphics.player.position.y += 4;
    }
    if(keys.up && graphics.player.position.y >= playerBounds.minY){
        graphics.player.position.y -= 4;
    }
    if(!bossStatus.spawned){
        bossStatus.timeSince++;
    }

    document.getElementById("score").innerHTML = gameStatus.score;
    //boss-behaviour
    entities.bosses.forEach(bossBehaviour)
    //Behaviour of first enemy
    entities.enemies1.forEach(enemy1Behaviour)
    //Behaviour of second enemy
    entities.enemies2.forEach(enemy2Behaviour)
    //behaviour of third enemy
    entities.enemies3.forEach(enemy3Behaviour)
    //Logic for shot movement
    entities.shots.forEach(shot => {
        shot.raster.position.x += shotConfig.Speed;
        if(shot.raster.position.x > shotConfig.MaxX){
            shot.raster.remove();
            entities.shots = entities.shots.filter(u => u != shot);
        }
    })
    entities.enemyshots.forEach(EShotMovement)
}

//Hitbox logic, be careful with this. not even I rightly know how it works
//BUG Some explosions are not scaled correctly. Presumably that bug is in here
function testCollision(){
    //Player Hitbox
    let playerHitbox;
    if (graphics.player){playerHitbox = graphics.player.bounds;}
    //Hitbox for the first enemy type
    entities.enemies1.forEach(function(enemy1){
        let enemy1Hitbox = enemy1.raster.bounds;
        
        if(graphics.player && playerHitbox.intersects(enemy1Hitbox)){
            graphics.player.source = 'img/Explosion.png';
            enemy1.raster.remove();
            entities.enemies1 = entities.enemies1.filter(u => u != enemy1);
            gameStatus.lost = true;
        }
        entities.shots.forEach(function(shot){
            let shotHitbox = shot.raster.bounds;
            if (shotHitbox.intersects(enemy1Hitbox)) {
                if(!enemy1.hit){
                    gameStatus.score += 1;
                }
                enemy1.hit = true; 
                enemy1.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.raster.remove();
                entities.enemies1 = entities.enemies1.filter(u => u != enemy1);
                setTimeout(() => {
                    enemy1.raster.remove();
                }, 500);}
        })
    });
    //Hitbox for the second enemy type
    entities.enemies2.forEach(function(enemy2){
        let enemy2Hitbox = enemy2.raster.bounds
        if(graphics.player && playerHitbox.intersects(enemy2Hitbox)){
            graphics.player.source = 'img/Explosion.png';
            enemy2.raster.remove();
            entities.enemies2 = entities.enemies2.filter(u => u != enemy2);
            gameStatus.lost = true;
        }
        entities.shots.forEach(function(shot){
            let shotHitbox = shot.raster.bounds
            if (shotHitbox.intersects(enemy2Hitbox)) {
                if(!enemy2.hit){
                    gameStatus.score += 2;
                }
                enemy2.hit = true;
                enemy2.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.raster.remove();
                entities.enemies2 = entities.enemies2.filter(u => u != enemy2);
                setTimeout(() => {
                    enemy2.raster.remove()
                }, 500);}
        })
    })
    //Hitbox for The third enemy type
    entities.enemies3.forEach(function(enemy3){
        let enemy3Hitbox = enemy3.raster.bounds;
        if(playerHitbox.intersects(enemy3Hitbox)){
            graphics.player.source = 'img/Explosion.png';
            entities.enemies3 = entities.enemies3.filter(u => u != enemy3);
            enemy3.raster.remove();
            gameStatus.lost = true;
        }
        entities.shots.forEach(shot =>{
            let shotHitbox = shot.raster.bounds;
            if (shotHitbox.intersects(enemy3Hitbox)) {
                if(!enemy3.hit){
                    gameStatus.score += 3;
                }
                enemy3.hit = true;
                enemy3.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.raster.remove();
                setTimeout(() => {
                    entities.enemies3 = entities.enemies3.filter(u => u != enemy3);
                    enemy3.raster.remove();
                }, 500);}
        })
        //hitbox for enemy shots
        entities.enemyshots.forEach(enemyshot => {
            let EShotHitbox = enemyshot.raster.bounds;
            if(playerHitbox.intersects(EShotHitbox)){
            graphics.player.source = 'img/Explosion.png';
            entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
            enemyshot.raster.remove();
            gameStatus.lost = true;}
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
                graphics.player.source = 'img/Explosion.png';
                entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
                enemyshot.raster.remove();
                gameStatus.lost = true;}
        })
    })
}

function shoot(){
    const minShotInterval = 500;
    let currentTime = new Date().getTime();
    if(keys.space && !gameStatus.hasFired && currentTime - shotConfig.last > minShotInterval){
        graphics.shot = new paper.Raster('img/YourLaser.png')
        graphics.shot.position = new paper.Point(graphics.player.position.x + 50, graphics.player.position.y);
        graphics.shot.scaling = new paper.Size(1, 1);
        let shotEntity = { raster: graphics.shot };
        entities.shots.push(shotEntity);
        hasFired = true;
        shotConfig.last = currentTime;
    }
}

//XXX Possibly unnecessary. Remove if so.
function refillAmmo(){
    gameStatus.hasFired = false;
}

//Making enemies appear
function createEnemy(x, y, width, height, img, array, additionalproperties = {}) {
    let raster = new paper.Raster(img)
    raster.position = new paper.Point(x, y);
    raster.scaling = new paper.Size(width, height);
    let enemy = {
        raster: raster,
        hit: false,
        ...additionalproperties
    }
    array.push(enemy);
}

//making enemies disappear
function removeEntity(entity, entityarray){
    if (entity.raster.position.x < -25 || entity.raster.position.y < -20 || entity.raster.position.y > 500){
        entity.raster.remove();
        return entityarray.filter(u => u != entity);
    }
    return entityarray;
}

//Defining enemy properties
function createEnemies1() {
    if (!bossStatus.spawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 4, 2.5, 'img/EnemySpaceship1.png', entities.enemies1);
    }
}

function createEnemies2() {
    if (timers.playtime >= 300 && !bossStatus.spawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 2, 2, 'img/EnemySpaceship2.png', entities.enemies2, {rerollTime: 0, zigzag: Math.random() < 0.5, zigzagHistory: []});
    }
}

function createEnemies3() {
    if (timers.playtime >= 600 && entities.enemies3.length < 2 && !bossStatus.spawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 2.5, 2.5, 'img/EnemySpaceship3.png', entities.enemies3, { age: 0, direction: null, initial: false });
    }
}

function spawnBoss() {
    if (timers.playtime >= 1500 && !bossStatus.first) {
        createEnemy(900, 250, 3, 3, 'img/Boss.png', entities.bosses, { bossHits: 0, direction: null }); 
        setInterval(createEnemies1, 3000);
        setInterval(createEnemies2, 2000);
        setInterval(createEnemies3, 1000);
        bossStatus.spawned = true;
        bossStatus.first = true;
    } else if (timers.playtime >= 2000 && bossStatus.timeSince >= 1500 && entities.bosses.length < 1) {
        createEnemy(900, 200, 100, 75, 'img/Boss.png', entities.bosses, { bossHits: 0, direction: null });
        bossStatus.spawned = true;
    }
    timeSinceLastBoss = 0;
}



//behaviour for the enemies
//Boss
function bossBehaviour(boss){
    let bossRaster = boss.raster.position;
    if(bossRaster.x > 750){
        bossRaster.x -= 3;
        bossStatus.spawned = true;
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
        if(bossStatus.spawned == true){
            gameStatus.score += 5;
        }
        bossStatus.spawned = false;
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
    entities.enemies1 = removeEntity(enemy1, entities.enemies1);
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
    entities.enemies2 = removeEntity(enemy2, entities.enemies2);
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
        if(bossStatus.spawned || enemy3.age >= 400){
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
    entities.enemies3 = removeEntity(enemy3, entities.enemies3)
}
//Logic for enemy attacks
function enemy3Shoots(){
    if(!bossStatus.spawned){
        entities.enemies3.forEach(function(enemy3){
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
    if(bossStatus.spawned){
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
    if (gameStatus.lost){
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
    graphics.player = new paper.Raster('img/PlayerSpaceship.png');
    graphics.player.position = new paper.Point(100, 250);
    graphics.player.scaling = new paper.Size(2.5, 2.3);
    }
}

//Generates the Gamescreen
function draw(){
    if (gameStatus.lost){
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