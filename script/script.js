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

const shotMaxX = 880;
const shotSpeed = 7;


//general logic variables
let hasFired = false;
let lost = false;
let score = 0;

//Logic variables for bosses
let bossHits;
let timeSinceLastBoss = 0;
let bossSpawns = 0;
let bossSpawned = false;
let firstBoss = false;

//Graphic/logic variables
let backgroundImage;
let gameOverScreen;
let player;
let shot;

//Calculation Variables
let enemies1 = [];
let enemies2 = [];
let enemies3 = [];
let shots = [];
let enemyshots = [];
let bosses = [];
let intervalIDs = [];
let playtime = 0; //Time the player survived
let age = 0; //Time that an enemy survived on screen

//Button-Logic. No longer deprecated.
const keyCodes = {
    space: ' ',
    up: 'ArrowUp',
    down: 'ArrowDown'
}

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
    intervalIDs.push(id);
}

function randomIntFromInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + Math.abs(min))
}

function resetGame() {
    enemies1 = [];
    enemies2 = [];
    enemies3 = [];
    bosses = [];
    for (let id of intervalIDs) {
        clearInterval(id);
    }
    intervalIDs = [];
}

function doScoreBoard(){
    localStorage.setItem('playerScore',score)
    document.getElementById('scoreBoardEntry1').innerHTML = localStorage.getItem('playerScore')
}

//Game update
function update(){
    playtime++;
    if(keys.up && player.position.y <= playerBounds.maxY){
        player.position.y += 4;
    }
    if(keys.down && player.position.y >= playerBounds.minY){
        player.position.y -= 4;
    }
    if(!bossSpawned){
        timeSinceLastBoss++;
    }

    document.getElementById("score").innerHTML = score;
    //boss-behaviour
    bosses.forEach(bossBehaviour)
    //Behaviour of first enemy
    enemies1.forEach(enemy1Behaviour)
    //Behaviour of second enemy
    enemies2.forEach(enemy2Behaviour)
    //behaviour of third enemy
    enemies3.forEach(enemy3Behaviour)
    //Logic for shot movement
    shots.forEach(shot => {
        shot.position.x += shotSpeed;
        if(shot.position.x > shotMaxX){
            shot.remove();
            shots = shots.filter(u => u != shot);
        }
    })
    enemyshots.forEach(EShotMovement)
}

//Hitbox logic, be careful with this. not even I rightly know how it works
function testCollision(){
    //Player Hitbox
    let playerHitbox;
    if (player){playerHitbox = player.bounds;}
    //Hitbox for the first enemy type
    enemies1.forEach(function(enemy1){
        let enemy1Hitbox = enemy1.raster.bounds;
        
        if(player && playerHitbox.intersects(enemy1Hitbox)){
            player.source = 'img/Explosion.png';
            enemy1.raster.remove();
            enemies1 = enemies1.filter(u => u != enemy1);
            lost = true;
        }
        shots.forEach(function(shot){
            let shotHitbox = shot.bounds;
            if (shotHitbox.intersects(enemy1Hitbox)) {
                if(enemy1.hit == false){
                    score += 1;
                }
                enemy1.hit = true; 
                enemy1.raster.source = 'img/Explosion.png';
                shots = shots.filter(u => u != shot);
                shot.remove();
                enemies1 = enemies1.filter(u => u != enemy1);
                setTimeout(() => {
                    enemy1.raster.remove();
                }, 500);}
        })
    });
    //Hitbox for the second enemy type
    enemies2.forEach(function(enemy2){
        let enemy2Hitbox = enemy2.raster.bounds
        if(player && playerHitbox.intersects(enemy2Hitbox)){
            player.source = 'img/Explosion.png';
            enemy2.raster.remove();
            enemies2 = enemies2.filter(u => u != enemy2);
            lost = true;
        }
        shots.forEach(function(shot){
            let shotHitbox = shot.bounds
            if (shotHitbox.intersects(enemy2Hitbox)) {
                if(enemy2.hit == false){
                    score += 2;
                }
                enemy2.hit = true;
                enemy2.raster.source = 'img/Explosion.png';
                shots = shots.filter(u => u != shot);
                shot.remove();
                enemies2 = enemies2.filter(u => u != enemy2);
                setTimeout(() => {
                    enemy2.raster.remove()
                }, 500);}
        })
    })
    //Hitbox for The third enemy type
    enemies3.forEach(function(enemy3){
        let enemy3Hitbox = enemy3.raster.bounds;
        if(playerHitbox.intersects(enemy3Hitbox)){
            player.source = 'img/Explosion.png';
            enemies3 = enemies3.filter(u => u != enemy3);
            enemy3.remove();
            lost = true;
        }
        shots.forEach(shot =>{
            let shotHitbox = shot.bounds;
            if (shotHitbox.intersects(enemy3Hitbox)) {
                if(enemy3.hit == false){
                    score += 3;
                }
                enemy3.hit = true;
                enemy3.raster.source = 'img/Explosion.png';
                shots = shots.filter(u => u != shot);
                shot.remove();
                setTimeout(() => {
                    enemies3 = enemies3.filter(u => u != enemy3);
                    enemy3.raster.remove();
                }, 500);}
        })
        //hitbox for enemy shots
        enemyshots.forEach(enemyshot => {
            let EShotHitbox = enemyshot.bounds;
            if(playerHitbox.intersects(EShotHitbox)){
            player.source = 'img/Explosion.png';
            enemyshots = enemyshots.filter(u => u != enemyshot);
            enemyshot.remove();
            lost = true;}
        })
    })
    // Hitboxes for the boss
    bosses.forEach(function(boss){
        let bossHitbox = boss.raster.bounds;
        shots.forEach(function(shot){
            let shotHitbox = shot.bounds;
            if (bossHitbox.intersects(shotHitbox)) {
                boss.bossHits++;
                shots = shots.filter(u => u != shot);
                shot.remove();
            }
        })
        //hitbox for enemy shots
        enemyshots.forEach(function(enemyshot){
            let EShotHitbox = enemyshot.bounds;
            if(playerHitbox .intersects(EShotHitbox)){
                player.source = 'img/Explosion.png';
                enemyshots = enemyshots.filter(u => u != enemyshot);
                enemyshot.remove();
                lost = true;}
        })
    })
}

//BUG in very rare cases it is possible to give off two shots in quick succession.
//This is probably due to interval rates.
function shoot(){
    let lastShotTime = 0;
    const minShotInterval = 500;
    let currentTime = new Date().getTime();
    if(keys.space && hasFired == false && currentTime - lastShotTime > minShotInterval){
        shot = new paper.Raster('img/YourLaser.png')
        shot.position = new paper.Point(player.position.x + 50, player.position.y);
        shot.scaling = new paper.Size(1, 1);
        shots.push(shot);
        hasFired = true;
    }
}

//XXX Possibly unnecessary. Remove if so.
function refillAmmo(){
    hasFired = false;
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
    if (!bossSpawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 4, 2.5, 'img/EnemySpaceship1.png', enemies1);
    }
}

function createEnemies2() {
    if (playtime >= 300 && !bossSpawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 2, 2, 'img/EnemySpaceship2.png', enemies2);
    }
}

function createEnemies3() {
    if (playtime >= 600 && enemies3.length < 2 && !bossSpawned) {
        createEnemy(900, randomIntFromInterval(60, 420), 2.5, 2.5, 'img/EnemySpaceship3.png', enemies3, { age: 0, direction: null, initial: false });
    }
}

function spawnBoss() {
    if (playtime >= 1500 && !firstBoss) {
        createEnemy(900, 250, 3, 3, 'img/Boss.png', bosses, { bossHits: 0, direction: null }); 
        setInterval(createEnemies1, 3000);
        setInterval(createEnemies2, 2000);
        setInterval(createEnemies3, 1000);
        bossSpawned = true;
        firstBoss = true;
    } else if (playtime >= 2000 && timeSinceLastBoss >= 1500 && bosses.length < 1) {
        createEnemy(900, 200, 100, 75, 'img/Boss.png', bosses, { bossHits: 0, direction: null });

    }
    timeSinceLastBoss = 0;
}



//Movement behaviour for the enemies
//Boss
function bossBehaviour(boss){
    let bossRaster = boss.raster.position;
    if(bossRaster.x > 750){
        bossRaster.x -= 3;
        bossSpawned = true;
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
        if(bossSpawned == true){
            score += 5;
        }
        bossSpawned = false;
        boss.raster.source = 'img/Explosion.png';
        setTimeout(() => {
            boss.raster.remove();
            bosses = bosses.filter(u => u != boss);
        }, 500);
    }
}
//first enemy
function enemy1Behaviour(enemy1){
    if(!enemy1.hit){
        enemy1.raster.position.x -= 3;
    }
    enemies1 = removeEntity(enemy1, enemies1);
}
//second enemy
function enemy2Behaviour(enemy2){
    if(!enemy2.hit){
        let rerollTime = 0;
        let zigzag = Math.random() < 0.5;
        enemy2.raster.position.x -= 5;
        if(zigzag && rerollTime < randomIntFromInterval(500, 1000)){
            enemy2.raster.position.y -= 3;
            rerollTime++
        }
        if(!zigzag && rerollTime < randomIntFromInterval(500, 1000)){
            enemy2.raster.position.y += 3;
            rerollTime++;
        }
    }
    enemies2 = removeEntity(enemy2, enemies2);
}
//third enemy
function enemy3Behaviour(enemy3){
    let enemy3Position = enemy3.raster.position;
    if (enemy3.initial == false){
        enemy3.direction = Math.random() < 0.5;
        enemy3.initial = true;
    }
    if(!enemy3.hit){
        if(bossSpawned || enemy3.age >= 400){
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
    enemies3 = removeEntity(enemy3, enemies3)
}
//Logic for enemy attacks
function enemy3Shoots(){
    if(!bossSpawned){
        enemies3.forEach(function(enemy3){
            let enemy3Position = enemy3.raster.position;
            if(!enemy3.hit && enemy3Position.x == 780){
                let enemyShot = new paper.Raster('img/EnemyLaser.png')
                enemyShot.position = new paper.Point(enemy3Position.x - 20, enemy3Position.y + 20);
                enemyShot.size = new paper.Size(29, 10);
                enemyshots.push(enemyShot);
            }
        })
    }
}

function bossShoots(){
    if(bossSpawned){
        bosses.forEach(function(boss){
            let bossPosition = boss.raster.position;
            if (bossPosition.x <= 750){
                let enemyShot = new paper.Raster('img/EnemyLaser.png')
                enemyShot.position = new paper.Point(bossPosition.x - 50, bossPosition.y + 15);
                enemyShot.size = new paper.Size(29, 10);
                enemyshots.push(enemyShot);
            }
        })
    }
}

function EShotMovement(enemyshot){
    enemyshot.position.x -= 5;
    if(enemyshot.position.x < -10){
        enemyshots = enemyshots.filter(u => u != enemyshot);
        enemyshot.remove();
    }
}

//Points towards where the spritefiles are
function loadImages(){
    if (lost){
        doScoreBoard();
        setTimeout(() => {
            player.remove();
            player = null;
            backgroundImage.remove();
            backgroundImage = null;
            gameOverScreen = new paper.Raster('img/GameOver.jpg');
            gameOverScreen.position = paper.view.center;
            document.getElementById('scoredisplay').style.display = 'none';
            setTimeout(() => {
                document.getElementById('scoreBoard').style.display = 'block';
            }, 1000);
        }, 1000);
    }
    else{
    backgroundImage = new paper.Raster('img/background.jpg');
    backgroundImage.position = paper.view.center
    player = new paper.Raster('img/PlayerSpaceship.png');
    player.position = new paper.Point(100, 250);
    player.scaling = new paper.Size(2.5, 2.3);
    }
}

//Generates the Gamescreen
function draw(){
    if (lost){
        resetGame();
        loadImages();
    }
    else{
    paper.view.update();
    paper.view.draw();
    requestAnimationFrame(draw);
    }
}