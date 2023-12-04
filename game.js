        //graphic variables
        var canvas;
        var ctx;

        //general logic variables
        let KEY_SPACE = false;
        let KEY_UP = false;
        let KEY_DOWN = false;
        let hasFired = false;
        let lost = false;
        let score = 0;
        
        //Logic variables for behavior of enemy 3
        var placeholder;
        var initial;

        //Logic variables for bosses
        var bossHits;
        let timeSinceLastBoss = 0;
        let bossSpawns = 0;
        var bossSpawned = false;

        let backgroundImage = new Image();
        let gameOverScreen = new Image()

        let player = {
            x: 50,
            y: 200,
            width: 100,
            height: 50,
            src: 'img/PlayerSpaceship.png'
        }

        let enemies1 = [];
        let enemies2 = [];
        let enemies3 = [];
        let shots = [];
        let enemyshots = [];
        let hitbox = [];
        let bosses = [];
        let playtime = 0; //Time the player survived
        let age = 0; //Time that an enemy survived on screen

        //Sets variables true if buttons are pressed 
        document.onkeydown = function(e){
            if(e.keyCode == 32){
                KEY_SPACE = true;
            }

            if(e.keyCode == 38){
                KEY_UP = true;
            }

            if(e.keyCode == 40){
                KEY_DOWN = true;
            }
        }

        //Sets variables false if buttons are let go
        document.onkeyup = function(e){
            if(e.keyCode == 32){
                KEY_SPACE = false;
            }

            if(e.keyCode == 38){
                KEY_UP = false;
            }

            if(e.keyCode == 40){
                KEY_DOWN = false;
            }
        }

        //the core of all of this. Be very careful when editing
        function startGame(){
            canvas = document.getElementById('canvas');
            ctx = canvas.getContext('2d');
            loadImages();
            setInterval(update, 1000 / 30);
            setInterval(shoot, 1000 / 30);
            setInterval(enemyShoots, 1000);
            setInterval(bossShoots, 750)
            setInterval(testCollision, 1000 / 30);
            setInterval(createEnemies1, 5000);
            setInterval(createEnemies2, 3000);
            setInterval(createEnemies3, 2000);
            setInterval(spawnBoss, 5000)
            setInterval(refillAmmo, 1000 / 3);
            
            draw();
        }

        //Game updates at 30 FPS, can we bump this up to 60?
        function update(){
            playtime++;
            if(KEY_DOWN && player.y <= 380){
                player.y += 6;
            }
            if(KEY_UP && player.y >= 40){
                player.y -= 6;
            }
            if(bossSpawned == false){
                timeSinceLastBoss++
            }

            document.getElementById("score").innerHTML = "Score: " + score;
            
            bosses.forEach(function(boss){
                if(boss.x + boss.width > 810){
                    boss.x -= 6;
                    bossSpawned = true
                }
                else if(boss.x + boss.width <= 810){
                    if(boss.y <= 40){
                        boss.y += 5;
                        boss.placeholder = true;
                    }
                    else if(boss.y >= 380){
                        boss.y -= 5;
                        boss.placeholder = false;
                    }
                    else if (boss.placeholder && boss.y < 380){
                        boss.y += 5;
                    }
                    else if(!boss.placeholder && boss.y > 40){
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

            enemies1.forEach(function(enemy1){
                if(!enemy1.hit){
                enemy1.x -= 6;}
                if(enemy1.x + enemy1.width < -2){
                    enemies1 = enemies1.filter(u => u != enemy1);
                }
            })

            enemies2.forEach(function(enemy2){
                if(!enemy2.hit){
                    var zigzag = Math.random() < 0.5;
                    enemy2.x -= 10;
                    if(zigzag){
                        enemy2.y -= 10;
                    }
                    if(!zigzag){
                        enemy2.y += 10;
                    }
                }
                if(enemy2.x + enemy2.width < -2 || enemy2.y + enemy2.height < -2 || enemy2.y > 500){
                    enemies2 = enemies2.filter(u => u != enemy2);
                }
            })
            
            enemies3.forEach(function(enemy3){
                if(!enemy3.hit){
                    if (enemy3.age < 200){
                        if (enemy3.x + enemy3.width > 810){
                        enemy3.x -= 6;}
                        if(enemy3.x + enemy3.width <= 810){
                            if (enemy3.age < 3){
                                initial = Math.random() < 0.5;
                                enemy3.placeholder = initial;
                                    if(enemy3.x == 820){
                                    if (enemy3.placeholder && enemy3.y < 380){
                                        enemy3.y += 3;
                                    }
                                    else if(!enemy3.placeholder &&  enemy3.y > 40){
                                        enemy3.y -= 3;
                                    }
                                }
                                enemy3.age++;
                            }
                            else if(enemy3.age >= 3){
                                    if(enemy3.y <= 40){
                                        enemy3.y += 3;
                                        enemy3.placeholder = true;
                                    }
                                    else if(enemy3.y >= 380){
                                        enemy3.y -= 3;
                                        enemy3.placeholder = false;
                                    }
                                    else if (enemy3.placeholder && enemy3.y < 380){
                                        enemy3.y += 3;
                                    }
                                    else if(!enemy3.placeholder && enemy3.y > 40){
                                        enemy3.y -= 3;
                                    }
                                    enemy3.age++;    
                                }
                        }
                    }
                    else if (enemy3.age >= 200){
                        enemy3.x -= 6;
                    }
                    else if(bossSpawned = true){
                        enemy3.x -= 6;
                    }
                }
                if(enemy3.x + enemy3.width < -2){
                    enemies3 = enemies3.filter(u => u != enemy3);
                    enemy3.age = 0;
                }
            })
            shots.forEach(function(shot){
                shot.x += 15;
                if(shot.x > 860){
                    shots = shots.filter(u => u != shot);
                }
            })
            enemyshots.forEach(function(enemyshot){
                enemyshot.x -= 15;
            })
        }

        //XXX Code for Hitboxes. DO NOT TOUCH!
        //Seriously, don't. I don't even rightly know how this works.
        function testCollision(){
            //Hitbox for the first enemy type
            enemies1.forEach(function(enemy1){
                if(player.x + player.width > enemy1.x && player.y + player.height > enemy1.y && player.x < enemy1.x && player.y < enemy1.y + enemy1.height){
                    lost = true;
                    player.img.src = 'img/Explosion.png';
                    enemies1 = enemies1.filter(u => u != enemy1);}
                else if(player.x + player.width > enemy1.x + enemy1.width && player.y + player.height > enemy1.y && player.x < enemy1.x + enemy1.width && player.y < enemy1.y + enemy1.height){
                    lost = true;
                    player.img.src = 'img/Explosion.png';
                    enemies1 = enemies1.filter(u => u != enemy1);}  
                shots.forEach(function(shot){
                    if (shot.x + shot.width > enemy1.x && shot.y + shot.height > enemy1.y && shot.x < enemy1.x && shot.y < enemy1.y + enemy1.height) {
                        if(enemy1.hit == false){
                            score += 1;
                        }
                        enemy1.hit = true; 
                        enemy1.img.src = 'img/Explosion.png';
                        shots = shots.filter(u => u != shot);
                        setTimeout(() => {
                            enemies1 = enemies1.filter(u => u != enemy1);
                        }, 500);}
                })
            })
            //Hitbox for the second enemy type
            enemies2.forEach(function(enemy2){
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

        //BUG Sometimes it is possible to give off two shots in quick succession.
        function shoot(){
            if(KEY_SPACE && hasFired == false){
                hasFired = true;
                let shot = {
                    x: player.x + 100,
                    y: player.y + 25,
                    width: 29,
                    height: 16,
                    src: 'img/YourLaser.png',
                    img: new Image()
                }
                shot.img.src = shot.src;
                shots.push(shot);
            }
        }

        function refillAmmo(){
            hasFired = false;
        }

        //All the stuff that makes the enemies appear
        function createEnemies1(){
            if(bossSpawned != true){
                let enemy1 = {
                    x: 900,
                    y: Math.random() * 400,
                    width: 100,
                    height: 50,
                    src: 'img/EnemySpaceship1.png',
                    img: new Image(),
                    hit: false
                }
                enemy1.img.src = enemy1.src;
                enemies1.push(enemy1);
            }
        }
        function createEnemies2(){
            if (playtime >= 300 && bossSpawned != true){
                let enemy2 = {
                    x: 900,
                    y: Math.random() * 400,
                    width: 25,
                    height: 30,
                    src: 'img/EnemySpaceship2.png',
                    img: new Image(),
                    hit: false
                }
                enemy2.img.src = enemy2.src;
                enemies2.push(enemy2);
            }
        }
        function createEnemies3(){
            if(playtime >= 600 && enemies3.length < 2 && bossSpawned != true){
                let enemy3 = {
                    x: 900,
                    y: Math.random() * 400,
                    width: 100,
                    height: 50,
                    src: 'img/EnemySpaceship3.png',
                    img: new Image(),
                    age: 0,
                    hit: false
                }
                enemy3.img.src = enemy3.src;
                enemies3.push(enemy3)
            }
        }
        function spawnBoss(){
            if(playtime >= 1000 && bossSpawns < 1){
                let boss = {
                    x: 900,
                    y: 200,
                    width: 100,
                    height: 75,
                    src: 'img/Boss.png',
                    img: new Image(),
                    bossHits: 0
                }
                boss.img.src = boss.src;
                bosses.push(boss)
                bossSpawns++;
                timeSinceLastBoss = 0;
                setInterval(createEnemies1, 3000);
                setInterval(createEnemies2, 2000);
                setInterval(createEnemies3, 1000);
            }
            else if(playtime >= 1000 && timeSinceLastBoss >= 1000 && bosses.length < 1){
                let boss = {
                    x: 900,
                    y: 200,
                    width: 100,
                    height: 75,
                    src: 'img/Boss.png',
                    img: new Image(),
                    bossHits: 0
                }
                boss.img.src = boss.src;
                bosses.push(boss);
                bossSpawns++
                timeSinceLastBoss = 0;
            }
        }

        function enemyShoots(){
            if(bossSpawned != true){
                enemies3.forEach(function(enemy3){
                    if(!enemy3.hit){
                        let enemyshot = {
                            x: enemy3.x,
                            y: enemy3.y + enemy3.height/2,
                            width: 29,
                            height: 16,
                            src: 'img/EnemyLaser.png',
                            img: new Image()
                        }
                        enemyshot.img.src = enemyshot.src;
                        enemyshots.push(enemyshot);
                    }
                })
            }
        }

        function bossShoots(){
            if(bossSpawned == true){
                bosses.forEach(function(boss){
                        let enemyshot = {
                            x: boss.x,
                            y: boss.y + boss.height/2,
                            width: 29,
                            height: 16,
                            src: 'img/EnemyLaser.png',
                            img: new Image()
                        }
                        enemyshot.img.src = enemyshot.src;
                        enemyshots.push(enemyshot);
                })
            }
        }


        
        //Points towards where the spritefiles are
        function loadImages(){
            backgroundImage.src = 'img/background.jpg';
            gameOverScreen.src = 'img/GameOver.jpg'

            player.img = new Image();
            player.img.src = player.src;
        }

        //Generates the Gamescreen
        function draw(){
            if(lost == true){
                ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
                shots.length = 0;
                setTimeout(() => {
                    ctx.drawImage(gameOverScreen, 0, 0)
                }, 1200);
            }
            else{
            ctx.drawImage(backgroundImage, 0, 0)
            ctx.drawImage(player.img, player.x, player.y, player.width, player.height);
            enemies1.forEach(function(enemy1){
                ctx.drawImage(enemy1.img, enemy1.x, enemy1.y, enemy1.width, enemy1.height);
            })
            enemies2.forEach(function(enemy2){
                ctx.drawImage(enemy2.img, enemy2.x, enemy2.y, enemy2.width, enemy2.height);
            })
            enemies3.forEach(function(enemy3){
                ctx.drawImage(enemy3.img, enemy3.x, enemy3.y, enemy3.width, enemy3.height);
            })
            shots.forEach(function(shot){
                ctx.drawImage(shot.img, shot.x, shot.y, shot.width, shot.height);
            })
            enemyshots.forEach(function(enemyshot){
                ctx.drawImage(enemyshot.img, enemyshot.x, enemyshot.y, enemyshot.width, enemyshot.height);
            })
            bosses.forEach(function(boss){
                ctx.drawImage(boss.img, boss.x, boss.y, boss.width, boss.height);
            })
            requestAnimationFrame(draw);
            }
        }