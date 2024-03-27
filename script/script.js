//movement logic
const keys = {
    space: false,
    up: false,
    down: false
}

const playerBounds = {
    maxY: 420,
    minY: 60
}
const shotConfig = {
    MaxX: 880,
    Speed: 7,
    last: 0,
}


//general logic variables
let gameStatus = {
    hasFired: false,
    lost: false,
    score: 0
}

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

let timers = {
    intervalIDs: [],
    playtime: 0, //Time the player survived
    age: 0 //Enemy-age
}

//Button-Logic
const keyCodes = {
    space: ' ',
    up: 'ArrowUp',
    down: 'ArrowDown'
}

/*
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case keyCodes.space: // Space
            keys.space = true;
            break;
        case keyCodes.up: // Up
            keys.up = true;
            break;
        case keyCodes.down: // Down
            keys.down = true;
            break;
    }
});

document.addEventListener('keyup', function(e) {
    switch(e.key) {
        case keyCodes.space: // Space
            keys.space = false;
            break;
        case keyCodes.up: // Up
            keys.up = false;
            break;
        case keyCodes.down: // Down
            keys.down = false;
            break;
    }
});
*/

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
        {func: shoot, delay: 1000 / 60},
        {func: testCollision, delay: 1000 / 60},
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
    let id = setInterval(func, delay);
    timers.intervalIDs.push(id);
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + Math.abs(min))
}

function resetGame() {
    entities = { enemies1: [], enemies2: [], enemies3: [], bosses: [] };
    timers.intervalIDs.forEach(id => clearInterval(id));
    timers.intervalIDs = [];
}

function doScoreBoard(){
    localStorage.setItem('playerScore', gameStatus.score)
    document.getElementById('scoreBoardEntry1').innerHTML = localStorage.getItem('playerScore')
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
        shot.position.x += shotConfig.Speed;
        if(shot.position.x > shotConfig.MaxX){
            shot.remove();
            entities.shots = entities.shots.filter(u => u != shot);
        }
    })
    entities.enemyshots.forEach(EShotMovement)
}

//Hitbox logic, be careful with this. not even I rightly know how it works
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
            let shotHitbox = shot.bounds;
            if (shotHitbox.intersects(enemy1Hitbox)) {
                if(!enemy1.hit){
                    gameStatus.score += 1;
                }
                enemy1.hit = true; 
                enemy1.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.remove();
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
            let shotHitbox = shot.bounds
            if (shotHitbox.intersects(enemy2Hitbox)) {
                if(!enemy2.hit){
                    gameStatus.score += 2;
                }
                enemy2.hit = true;
                enemy2.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.remove();
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
            let shotHitbox = shot.bounds;
            if (shotHitbox.intersects(enemy3Hitbox)) {
                if(!enemy3.hit){
                    gameStatus.score += 3;
                }
                enemy3.hit = true;
                enemy3.raster.source = 'img/Explosion.png';
                entities.shots = entities.shots.filter(u => u != shot);
                shot.remove();
                setTimeout(() => {
                    entities.enemies3 = entities.enemies3.filter(u => u != enemy3);
                    enemy3.raster.remove();
                }, 500);}
        })
        //hitbox for enemy shots
        entities.enemyshots.forEach(enemyshot => {
            let EShotHitbox = enemyshot.bounds;
            if(playerHitbox.intersects(EShotHitbox)){
            graphics.player.source = 'img/Explosion.png';
            entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
            enemyshot.remove();
            gameStatus.lost = true;}
        })
    })
    // Hitbox for the boss
    entities.bosses.forEach(function(boss){
        let bossHitbox = boss.raster.bounds;
        entities.shots.forEach(function(shot){
            let shotHitbox = shot.bounds;
            if (bossHitbox.intersects(shotHitbox)) {
                boss.bossHits++;
                entities.shots = entities.shots.filter(u => u != shot);
                shot.remove();
            }
        })
        //hitbox for enemy shots
        entities.enemyshots.forEach(function(enemyshot){
            let EShotHitbox = enemyshot.bounds;
            if(playerHitbox .intersects(EShotHitbox)){
                graphics.player.source = 'img/Explosion.png';
                entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
                enemyshot.remove();
                gameStatus.lost = true;}
        })
    })
}

//BUG in very rare cases it is possible to give off two shots in quick succession.
//This is probably due to interval rates. Never truly fixed.
function shoot(){
    const minShotInterval = 500;
    let currentTime = new Date().getTime();
    if(keys.space && !gameStatus.hasFired && currentTime - shotConfig.last > minShotInterval){
        graphics.shot = new paper.Raster('img/YourLaser.png')
        graphics.shot.position = new paper.Point(graphics.player.position.x + 50, graphics.player.position.y);
        graphics.shot.scaling = new paper.Size(1, 1);
        entities.shots.push(graphics.shot);
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
        createEnemy(900, randomIntFromInterval(60, 420), 2, 2, 'img/EnemySpaceship2.png', entities.enemies2);
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



//Movement behaviour for the enemies
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
        let rerollTime = 0;
        let zigzag = Math.random() < 0.5;
        enemy2.raster.position.x -= 5;
        if(rerollTime > randomIntFromInterval(500, 1000)){
            enemy2.raster.position.y -= 3;
            rerollTime++
        }
        if(!zigzag && rerollTime < randomIntFromInterval(500, 1000)){
            enemy2.raster.position.y += 3;
            rerollTime++;
        }
    }
    entities.enemies2 = removeEntity(enemy2, entities.enemies2);
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
                entities.enemyshots.push(enemyShot);
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
                entities.enemyshots.push(enemyShot);
            }
        })
    }
}

function EShotMovement(enemyshot){
    enemyshot.position.x -= 5;
    if(enemyshot.position.x < -10){
        entities.enemyshots = entities.enemyshots.filter(u => u != enemyshot);
        enemyshot.remove();
    }
}

//Points towards where the spritefiles are
function loadImages(){
    if (gameStatus.lost){
        doScoreBoard();
        setTimeout(() => {
            graphics.player.remove();
            graphics.backgroundImage.remove();
            graphics = { player: null, background: null, gameOverScreen: new paper.Raster('img/GameOver.jpg') };
            graphics.gameOverScreen.position = paper.view.center;
            document.getElementById('scoredisplay').style.display = 'none';
            setTimeout(() => {
                document.getElementById('scoreBoard').style.display = 'block';
            }, 1000);
        }, 1000);
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
        resetGame();
        loadImages();
    }
    else{
    paper.view.update();
    paper.view.draw();
    requestAnimationFrame(draw);
    }
}