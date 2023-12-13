//general logic variables
let KEY_SPACE = false;
let KEY_UP = false;
let KEY_DOWN = false;
let hasFired = false;
let lost = false;
let score = 0;

//Logic variables for bosses
let bossHits;
let timeSinceLastBoss = 0;
let bossSpawns = 0;
let bossSpawned = false;

//Graphic/logic variables
let backgroundImage;
let gameOverScreen;
let player;
let shot;

let enemies1 = [];
let enemies2 = [];
let enemies3 = [];
let shots = [];
let enemyshots = [];
let bosses = [];
let intervalIDs = [];
let playtime = 0; //Time the player survived
let age = 0; //Time that an enemy survived on screen

//Button-Logic... Yes this is deprecated. Deal with it!
document.addEventListener('keydown', function(e) {
    switch(e.key) {
        case ' ': // Space
            KEY_SPACE = true;
            break;
        case 'ArrowUp': // Up
            KEY_UP = true;
            break;
        case 'ArrowDown': // Down
            KEY_DOWN = true;
            break;
    }
});

document.addEventListener('keyup', function(e) {
    switch(e.key) {
        case ' ': // Space
            KEY_SPACE = false;
            break;
        case 'ArrowUp': // Up
            KEY_UP = false;
            break;
        case 'ArrowDown': // Down
            KEY_DOWN = false;
            break;
    }
});

//the core of all of this. Be very careful when editing
window.onload = function init(){
    paper.setup("canvas");
    loadImages();
    setAndStoreInterval(update, 1000 / 60);
    setAndStoreInterval(shoot, 1000 / 60);
    setAndStoreInterval(testCollision, 1000 / 60);
    setAndStoreInterval(refillAmmo, 1000 / 3);
    setAndStoreInterval(spawnBoss, 5000);
    setAndStoreInterval(createEnemies1, 5000);
    setAndStoreInterval(createEnemies2, 3000);
    setAndStoreInterval(createEnemies3, 2000);
    setAndStoreInterval(enemyShoots, 1000);
    setAndStoreInterval(bossShoots, 750);

    
    draw();
};

//This exists purely to reduce redundancy
function setAndStoreInterval(func, delay) {
    let id = setInterval(func, delay);
    intervalIDs.push(id);
}

//Game updates at 60 FPS
function update(){
    playtime++;
    if(KEY_DOWN && player.position.y <= 420){
        player.position.y += 4;
    }
    if(KEY_UP && player.position.y >= 60){
        player.position.y -= 4;
    }
    if(bossSpawned == false){
        timeSinceLastBoss++;
    }

    document.getElementById("score").innerHTML = "Score: " + score;
    //boss-behaviour
    bosses.forEach(function(boss){
        if(boss.x + boss.width > 810){
            boss.x -= 6;
            bossSpawned = true;
        }
        else if(boss.x + boss.width <= 810){
            if(boss.y <= 40){
                boss.y += 5;
                boss.direction = true;
            }
            else if(boss.y >= 380){
                boss.y -= 5;
                boss.direction = false;
            }
            else if (boss.direction && boss.y < 380){
                boss.y += 5;
            }
            else if(!boss.direction && boss.y > 40){
                boss.y -= 5;
            }
        }
        if(boss.bossHits >= 3){
            if(bossSpawned == true){
                score += 5;
            }
            bossSpawned = false;
            boss.img.src = 'img/Explosion.png';
            setTimeout(() => {
                    bosses = bosses.filter(u => u != boss);
            }, 500);
        }
    })
    //Behaviour of first enemy
    enemies1.forEach(function(enemy1){
        if(!enemy1.hit){
            enemy1.raster.position.x -= 3;}
        if(enemy1.raster.position.x < -25){
            enemy1.raster.remove();
            enemies1 = enemies1.filter(u => u != enemy1);
        }
    })
    //Behaviour of second enemy
    enemies2.forEach(function(enemy2){
        if(!enemy2.hit){
            let zigzag = Math.random() < 0.5;
            enemy2.x -= 10;
            if(zigzag){
                enemy2.y -= 10;
            }
            if(!zigzag){
                enemy2.y += 10;
            }
        }
        if(enemy2.raster.position.x < -25 || enemy2.raster.position.y < -10 || enemy2.raster.position.y > 500){
            enemies2 = enemies2.filter(u => u != enemy2);
        }
    })
    //behaviour of third enemy
    enemies3.forEach(function(enemy3){
        if(!enemy3.hit){
            if(bossSpawned == true){
                enemy3.x -= 6;
            }
            else if (enemy3.age < 200){
                if (enemy3.x + enemy3.width > 810){
                enemy3.x -= 6;}
                if(enemy3.x + enemy3.width <= 810){
                    if (enemy3.age < 3){
                        enemy3.direction = Math.random() < 0.5;
                            if(enemy3.x == 820){
                            if (enemy3.direction && enemy3.y < 380){
                                enemy3.y += 3;
                            }
                            else if(!enemy3.direction &&  enemy3.y > 40){
                                enemy3.y -= 3;
                            }
                        }
                        enemy3.age++;
                    }
                    else if(enemy3.age >= 3){
                            if(enemy3.y <= 40){
                                enemy3.y += 3;
                                enemy3.direction = true;
                            }
                            else if(enemy3.y >= 380){
                                enemy3.y -= 3;
                                enemy3.direction = false;
                            }
                            else if (enemy3.direction && enemy3.y < 380){
                                enemy3.y += 3;
                            }
                            else if(!enemy3.direction && enemy3.y > 40){
                                enemy3.y -= 3;
                            }
                            enemy3.age++;    
                        }
                }
            }
            else if (enemy3.age >= 200){
                enemy3.x -= 6;
            }
        }
        if(enemy3.x + enemy3.width < -2){
            enemies3 = enemies3.filter(u => u != enemy3);
            enemy3.age = 0;
        }
    })
    //Logic for shot movement
    shots.forEach(function(shot){
        shot.position.x += 7;
        if(shot.position.x > 880){
            shot.remove();
            shots = shots.filter(u => u != shot);
        }
    })
    enemyshots.forEach(function(enemyshot){
        enemyshot.position.x -= 5;
        if(enemyshot.position.x < -5){
            enemyshots = enemyshots.filter(u => u != enemyshot);
        }
    })
}

//XXX Code for Hitboxes. DO NOT TOUCH!
//Seriously, don't. I don't even rightly know how this works.
function testCollision(){
    //Player Hitbox
    let playerHitbox;
    if (player){playerHitbox = player.bounds;}
    //Hitbox for the first enemy type
    enemies1.forEach(function(enemy1){
        let enemy1Hitbox = enemy1.raster.bounds;
        
        if(player && playerHitbox.intersects(enemy1Hitbox)){
            console.log("collision")
            player.source = 'img/Explosion.png';
            enemy1.raster.remove();
            enemies1 = enemies1.filter(u => u != enemy1);
            setTimeout(() => {lost = true;}, 2000);
        }
        shots.forEach(function(shot){
            let shotHitbox = new paper.Rectangle(new paper.Point(shot.x, shot.y), new paper.Size(shot.width, shot.height))
            if (shotHitbox.intersects(enemy1Hitbox)) {
                if(enemy1.hit == false){
                    score += 1;
                }
                enemy1.hit = true; 
                enemy1.raster.src = 'img/Explosion.png';
                shots = shots.filter(u => u != shot);
                setTimeout(() => {
                    enemies1 = enemies1.filter(u => u != enemy1);
                }, 500);}
        })
    });
    //Hitbox for the second enemy type
    enemies2.forEach(function(enemy2){
        let enemy2Hitbox = new paper.Rectangle(new paper.Point(enemy2.x, enemy2.y), new paper.Size(enemy2.width, enemy2.height))
        if(player.x + player.width > enemy2.x && player.y + player.height > enemy2.y && player.x < enemy2.x && player.y < enemy2.y + enemy2.height){
            player.img.src = 'img/Explosion.png';
            enemies2 = enemies2.filter(u => u != enemy2);
            lost = true;}
        else if(player.x + player.width > enemy2.x + enemy2.width && player.y + player.height > enemy2.y && player.x < enemy2.x + enemy2.width && player.y < enemy2.y + enemy2.height){
            player.img.src = 'img/Explosion.png';
            enemies2 = enemies2.filter(u => u != enemy2);
            lost = true;}  
        shots.forEach(function(shot){
            if (shot.x + shot.width > enemy2.x && shot.y + shot.height > enemy2.y && shot.x < enemy2.x && shot.y < enemy2.y + enemy2.height) {
                if(enemy2.hit == false){
                    score += 2;
                }
                enemy2.hit = true;
                enemy2.img.src = 'img/Explosion.png';
                shots = shots.filter(u => u != shot);
                setTimeout(() => {
                    enemies2 = enemies2.filter(u => u != enemy2);
                }, 500);}
        })
    })
    //Hitbox for The third enemy type
    enemies3.forEach(function(enemy3){
        if(player.x + player.width > enemy3.x && player.y + player.height > enemy3.y && player.x < enemy3.x && player.y < enemy3.y + enemy3.height){
            player.img.src = 'img/Explosion.png';
            enemies3 = enemies3.filter(u => u != enemy3);
            lost = true;}
        else if(player.x + player.width > enemy3.x + enemy3.width && player.y + player.height > enemy3.y && player.x < enemy3.x + enemy3.width && player.y < enemy3.y + enemy3.height){
            player.img.src = 'img/Explosion.png';
            enemies2 = enemies2.filter(u => u != enemy3);
            lost = true;}  
        shots.forEach(function(shot){
            if (shot.x + shot.width > enemy3.x && shot.y + shot.height > enemy3.y && shot.x < enemy3.x && shot.y < enemy3.y + enemy3.height) {
                if(enemy3.hit == false){
                    score += 3;
                }
                enemy3.hit = true;
                enemy3.img.src = 'img/Explosion.png';
                shots = shots.filter(u => u != shot);
                setTimeout(() => {
                    enemies3 = enemies3.filter(u => u != enemy3);
                }, 500);}
        })
        //hitbox for enemy shots
        enemyshots.forEach(function(enemyshot){
            if(player.x + player.width > enemyshot.x && player.y + player.height > enemyshot.y && player.x < enemyshot.x && player.y < enemyshot.y + enemyshot.height){
            player.img.src = 'img/Explosion.png';
            enemyshots = enemyshots.filter(u => u != enemyshot);
            lost = true;}
        else if(player.x + player.width > enemyshot.x + enemyshot.width && player.y + player.height > enemyshot.y && player.x < enemyshot.x + enemyshot.width && player.y < enemyshot.y + enemyshot.height){
            player.img.src = 'img/Explosion.png';
            enemyshots = enemyshots.filter(u => u != enemyshot);
            lost = true;}  
        })
    })
    // Hitboxes for the boss
    bosses.forEach(function(boss){
        shots.forEach(function(shot){
            if (shot.x + shot.width > boss.x && shot.y + shot.height > boss.y && shot.x < boss.x && shot.y < boss.y + boss.height) {
                boss.bossHits++;
                shots = shots.filter(u => u != shot);
            }
        })
        //hitbox for enemy shots
        enemyshots.forEach(function(enemyshot){
            if(player.x + player.width > enemyshot.x && player.y + player.height > enemyshot.y && player.x < enemyshot.x && player.y < enemyshot.y + enemyshot.height){
            player.img.src = 'img/Explosion.png';
            enemyshots = enemyshots.filter(u => u != enemyshot);
            lost = true;}
        else if(player.x + player.width > enemyshot.x + enemyshot.width && player.y + player.height > enemyshot.y && player.x < enemyshot.x + enemyshot.width && player.y < enemyshot.y + enemyshot.height){
            player.img.src = 'img/Explosion.png';
            enemyshots = enemyshots.filter(u => u != enemyshot);
            lost = true;}  
        })
    })
}

//BUG in rare cases it is possible to give off two shots in quick succession.
//This is probably due to interval rates.
function shoot(){
    if(KEY_SPACE && hasFired == false){
        shot = new paper.Raster('img/YourLaser.png')
        shot.position = new paper.Point(player.position.x + 50, player.position.y);
        shot.scaling = new paper.Size(1, 1);
        shots.push(shot);
        hasFired = true;
    }
}

function refillAmmo(){
    hasFired = false;
}

//All the stuff that makes the enemies appear
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

function createEnemies1() {
    if (bossSpawned != true) {
        createEnemy(900, Math.random() * 400, 4, 2.5, 'img/EnemySpaceship1.png', enemies1);
    }
}

function createEnemies2() {
    if (playtime >= 300 && bossSpawned != true) {
        createEnemy(900, Math.random() * 400, 1, 1, 'img/EnemySpaceship2.png', enemies2);
    }
}

function createEnemies3() {
    if (playtime >= 600 && enemies3.length < 2 && bossSpawned != true) {
        createEnemy(900, Math.random() * 400, 1, 1, 'img/EnemySpaceship3.png', enemies3, { age: 0, direction: null });
    }
}

function spawnBoss() {
    if (playtime >= 1000 && bossSpawns < 1) {
        createEnemy(900, 200, 1, 1, 'img/Boss.png', bosses, { bossHits: 0, direction: null }); 
        setInterval(createEnemies1, 3000);
        setInterval(createEnemies2, 2000);
        setInterval(createEnemies3, 1000);
    } else if (playtime >= 1000 && timeSinceLastBoss >= 1000 && bosses.length < 1) {
        createEnemy(900, 200, 100, 75, 'img/Boss.png', bosses, { bossHits: 0, direction: null });

    }
    bossSpawns++;
    timeSinceLastBoss = 0;
}

//Logic for enemy attacks
function enemyShoots(){
    if(bossSpawned != true){
        enemies3.forEach(function(enemy3){
            if(!enemy3.hit){
                let enemyShot = new paper.Raster('img/EnemyLaser.png')
                enemyShot.position = new paper.Point(enemy3.x + 100, enemy3.y + 25);
                enemyShot.size = new paper.Size(29, 16);
                enemyshots.push(enemyShot);
            }
        })
    }
}

function bossShoots(){
    if(bossSpawned == true){
        bosses.forEach(function(boss){
            let enemyShot = new paper.Raster('img/EnemyLaser.png')
            enemyShot.position = new paper.Point(boss.position.x + 100, boss.position.y + 25);
            enemyShot.size = new paper.Size(29, 16);
            enemyshots.push(enemyshot);
        })
    }
}



//Points towards where the spritefiles are
function loadImages(){
    if (lost == true){
    gameOverScreen = new paper.Raster('img/GameOver.jpg');
    gameOverScreen.position = paper.view.center;
    player.remove();
    player = null;
    backgroundImage.remove();
    backgroundImage = null;
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
    if (lost == true){loadImages()}
    paper.view.update()
    paper.view.draw();
    requestAnimationFrame(draw);
}
