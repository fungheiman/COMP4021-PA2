// The point and size class used in this program
function Point(x, y) {
    this.x = (x)? parseFloat(x) : 0.0;
    this.y = (y)? parseFloat(y) : 0.0;
}

function Size(w, h) {
    this.w = (w)? parseFloat(w) : 0.0;
    this.h = (h)? parseFloat(h) : 0.0;
}

// Helper function for checking intersection between two rectangles
function intersect(pos1, size1, pos2, size2) {
    return (pos1.x < pos2.x + size2.w && pos1.x + size1.w > pos2.x &&
            pos1.y < pos2.y + size2.h && pos1.y + size1.h > pos2.y);
}


// The player class used in this program
function Player() {
    this.node = svgdoc.getElementById("player");
    this.position = PLAYER_INIT_POS;
    this.motion = motionType.NONE;
    this.verticalSpeed = 0;
    this.currentDir = motionType.RIGHT;
}

Player.prototype.isOnPlatform = function() {
    var platforms = svgdoc.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));

        if (((this.position.x + PLAYER_SIZE.w > x && this.position.x < x + w) ||
             ((this.position.x + PLAYER_SIZE.w) == x && this.motion == motionType.RIGHT) ||
             (this.position.x == (x + w) && this.motion == motionType.LEFT)) &&
            this.position.y + PLAYER_SIZE.h == y) return true;
    }
    if (this.position.y + PLAYER_SIZE.h == SCREEN_SIZE.h) return true;

    return false;
}

Player.prototype.collidePlatform = function(position) {
    var platforms = svgdoc.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));
        var pos = new Point(x, y);
        var size = new Size(w, h);

        if (intersect(position, PLAYER_SIZE, pos, size)) {
            position.x = this.position.x;
            if (intersect(position, PLAYER_SIZE, pos, size)) {
                if (this.position.y >= y + h)
                    position.y = y + h;
                else
                    position.y = y - PLAYER_SIZE.h;
                this.verticalSpeed = 0;
            }
        }
    }
}

Player.prototype.collideScreen = function(position) {
    if (position.x < 0) position.x = 0;
    if (position.x + PLAYER_SIZE.w > SCREEN_SIZE.w) position.x = SCREEN_SIZE.w - PLAYER_SIZE.w;
    if (position.y < 0) {
        position.y = 0;
        this.verticalSpeed = 0;
    }
    if (position.y + PLAYER_SIZE.h > SCREEN_SIZE.h) {
        position.y = SCREEN_SIZE.h - PLAYER_SIZE.h;
        this.verticalSpeed = 0;
    }
}


//
// Below are constants used in the game
//
var PLAYER_SIZE = new Size(40, 40);         // The size of the player
var MONSTER_SIZE = new Size(35, 40);        // The size of a monster
var SCREEN_SIZE = new Size(600, 560);       // The size of the game screen
var BULLET_SIZE = new Size(10, 10);         // The size of a bullet
var GOODTHINGD_SIZE = new Size(50, 38);     // The size of the good thing
var PLAYER_INIT_POS  = new Point(0, 0);     // The initial position of the player

var MOVE_DISPLACEMENT = 5;                  // The speed of the player in motion
var JUMP_SPEED = 15;                        // The speed of the player jumping
var BULLET_SPEED = 10.0;                    // The speed of a bullet = pixels it moves each game loop
var MONSTER_SPEED = 1.0;                    // The speed of a monster = pixels it moves each game loop
var VERTICAL_DISPLACEMENT = 1;              // The displacement of vertical speed

var GAME_INTERVAL = 25;                     // The time interval of running the game
var SHOOT_INTERVAL = 200.0;                 // The period when shooting is disabled
var GAMETIMELIMIT = 60;
var MAXBULLET = 8;
var INITIAL_MONSTER_NUM = 6;
var MONSTER_INCREMENT = 4;
var INITIAL_GOOD_NUM = 2;
var GOOD_INCREMENT = 1;

//
// Variables in the game
//
var motionType = {NONE:0, LEFT:1, RIGHT:2}; // Motion enum
var svgdoc = null;                          // SVG root document node
var player = null;                          // The player object
var gameInterval = null;                    // The interval
var zoom = 1.0;                             // The zoom level of the screen
var timerInterval = null;
var score = 0;
var currentLevel = 1;
var cheatmode = false;
var timeRemain = GAMETIMELIMIT;
var gametime = null;
var goodthingLeft = INITIAL_GOOD_NUM;
var username = "Anonymous";
var last_username = username;
var monsterUp = true;

//
// Variables for bullets
//
var canShoot = true;                // A flag indicating whether the player can shoot a bullet
var shootType = {LEFT:0, RIGHT:1};
var bulletLeft = MAXBULLET;

//
// The load function for the SVG document
//
function load(evt) {
    // Set the root node to the global variable
    svgdoc = evt.target.ownerDocument;

    // Ask for username 
    last_username = username;
    // username = prompt("What is your name?", last_username);
    if(!username) username = "Anonymous";

    // reset variable
    player = null;                          
    gameInterval = null;                    
    zoom = 1.0;                             
    score = 0;
    currentLevel = 1;
    cheatmode = false;
    timeRemain = GAMETIMELIMIT;
    gametime = null;
    goodthingLeft = INITIAL_GOOD_NUM;
    canShoot = true;                
    bulletLeft = MAXBULLET;
}

function startonclick(){
    // Hide the startup window
    svgdoc.getElementById("startpopup").style.visibility = "hidden";

    // Attach keyboard events
    svgdoc.documentElement.addEventListener("keydown", keydown, false);
    svgdoc.documentElement.addEventListener("keyup", keyup, false);

    // Remove text nodes in the 'platforms' group
    cleanUpGroup("platforms", true);

    // Create the player
    player = new Player();

    // Create Monsters
    createMonster(INITIAL_MONSTER_NUM);
    // Create Good Things
    creatGoodThings(INITIAL_GOOD_NUM);

    // Start the game interval
    gameInterval = setInterval("gamePlay()", GAME_INTERVAL);
    gameTimeCountDown();
}

//
// This function removes all/certain nodes under a group
//
function cleanUpGroup(id, textOnly) {
    var node, next;
    var group = svgdoc.getElementById(id);
    node = group.firstChild;
    while (node != null) {
        next = node.nextSibling;
        if (!textOnly || node.nodeType == 3) // A text node
            group.removeChild(node);
        node = next;
    }
}

//
// This is the keydown handling function for the SVG document
//
function keydown(evt) {
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "N".charCodeAt(0):
            player.motion = motionType.LEFT;
            player.currentDir = motionType.LEFT;
            break;

        case "M".charCodeAt(0):
            player.motion = motionType.RIGHT;
            player.currentDir = motionType.RIGHT;

            break;
			
        case "Z".charCodeAt(0):
            if (player.isOnPlatform()) player.verticalSpeed = JUMP_SPEED;
            break;
        
        case 32: // spacebar = shoot
            if (canShoot) shootBullet();
            break;

        case "C".charCodeAt(0):
            if(!cheatmode) {
                cheatmode = true;
                updateCheatMode();
            } 
            break;

        case "V".charCodeAt(0):
            if(cheatmode) {
                cheatmode = false;
                updateCheatMode();
            } 
            break;
    }
}


//
// This is the keyup handling function for the SVG document
//
function keyup(evt) {
    // Get the key code
    var keyCode = (evt.keyCode)? evt.keyCode : evt.getKeyCode();

    switch (keyCode) {
        case "N".charCodeAt(0):
            if (player.motion == motionType.LEFT) player.motion = motionType.NONE;
            break;

        case "M".charCodeAt(0):
            if (player.motion == motionType.RIGHT) player.motion = motionType.NONE;
            break;
    }
}

//
// This function updates the position and motion of the player in the system
//
function gamePlay() {
    // Check whether the player is on a platform
    var isOnPlatform = player.isOnPlatform();
    
    // Update player position
    var displacement = new Point();

    // Move left or right
    if (player.motion == motionType.LEFT)
        displacement.x = -MOVE_DISPLACEMENT;
    if (player.motion == motionType.RIGHT)
        displacement.x = MOVE_DISPLACEMENT;

    // Fall
    if (!isOnPlatform && player.verticalSpeed <= 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
    }

    // Jump
    if (player.verticalSpeed > 0) {
        displacement.y = -player.verticalSpeed;
        player.verticalSpeed -= VERTICAL_DISPLACEMENT;
        if (player.verticalSpeed <= 0)
            player.verticalSpeed = 0;
    }

    // Get the new position of the player
    var position = new Point();
    position.x = player.position.x + displacement.x;
    position.y = player.position.y + displacement.y;

    // Check collision with platforms and screen
    player.collidePlatform(position);
    player.collideScreen(position);

    // Set the location back to the player object (before update the screen)
    player.position = position;

    updateScreen();
    moveBullets();
    collisionDetection();
    moveMonster();
    moveMonsterBullet()
}

//
// This function updates the position of the player's SVG object and
// set the appropriate translation of the game screen relative to the
// the position of the player
//
function updateScreen() {
    // Transform the player
    player.node.setAttribute("transform", "translate(" + player.position.x + "," + player.position.y + ")");
            
    // Calculate the scaling and translation factors	
    if(zoom != 1.0) {
        var gamearea = svgdoc.getElementById("gamearea");
        var tx = player.position.x + PLAYER_SIZE.w/2;
        var ty = player.position.y + PLAYER_SIZE.h/2; 
        gamearea.setAttribute("transform", "translate(" + tx + "," + ty + ") scale( " + zoom + ")");
    }    
}

// This function creates monster
function createMonster(num) {

    var monsters = svgdoc.getElementById("monsters");
    var special = Math.floor(Math.random() * num);
    
    for (var i = 1; i <= num; i++) {
        var monsterx;
        var monstery = (SCREEN_SIZE.h - 60)/num * i;

        if(monstery >= (SCREEN_SIZE.h - 100)) {
            monsterx = Math.random() * (SCREEN_SIZE.w - 150) + 100;
        } else {
            monsterx = Math.random() * (SCREEN_SIZE.w - 90) + 50;
        }

        var monster = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");
        monster.setAttribute("x", Math.floor(monsterx));
        monster.setAttribute("y", Math.floor(monstery));
        monster.setAttribute("targetY", monstery + 5);
        monster.setAttribute("special", "false");

        // the monster that can shoot bullet
        if(i == special) {
            monster.setAttribute("special",  "true");
            monsterShootBullet(monster);
        }
        
        if(i % 2){
            monster.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monster-left");
            monster.setAttribute("direction", "left");
            // random x for monster to move
            var targetX = Math.floor(Math.random() * (monsterx - 50) + 50);
            monster.setAttribute("targetX", targetX);
        } else {
            monster.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monster-right");
            monster.setAttribute("direction", "right");
            // random x for monster to move
            var targetX = Math.floor(Math.random() * (SCREEN_SIZE.w - MONSTER_SIZE.w - monsterx) + monsterx);
            monster.setAttribute("targetX", targetX);
        }

        var blinking = svgdoc.createElementNS("http://www.w3.org/2000/svg", "animate");
        blinking.setAttribute("attributeType", "CSS");
        blinking.setAttribute("attributeName", "opacity");
        blinking.setAttribute("values", "1;0.5;1");
        blinking.setAttribute("dur", "1.5s");
        blinking.setAttribute("repeatCount", "indefinite");
        monster.appendChild(blinking);

        monsters.appendChild(monster);
    }
}

function moveMonster(){
    var monsters = svgdoc.getElementById("monsters");
    
    for (var i = 0; i < monsters.childNodes.length; i++) {
        var monster = monsters.childNodes.item(i);
        var x = parseInt(monster.getAttribute("x"));
        var y = parseInt(monster.getAttribute("y"));
        var direction = monster.getAttribute("direction");
        var targetX = parseInt(monster.getAttribute("targetX"));
        var targetY = parseInt(monster.getAttribute("targetY"));
        
        // monster reach target position or reach the screen edge -> set a new random x
        if(x == targetX) {
            var targetX = Math.floor(Math.random() * (SCREEN_SIZE.w - MONSTER_SIZE.w));
            monster.setAttribute("targetX", targetX);

            // set the correct direction monster image
             if (targetX >= x) {   
                monster.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monster-right");
                monster.setAttribute("direction", "right");
            } else {
                monster.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monster-left");
                monster.setAttribute("direction", "left");
            }

        } else {
            // move to the target x
            if(direction == "right") {
                monster.setAttribute("x", x + MONSTER_SPEED);
            } else {
                monster.setAttribute("x", x - MONSTER_SPEED);
            }
        }

        // move monster up and down
        if(y == targetY) {
            if(monsterUp) {
                monster.setAttribute("targetY", y - 10);
                monsterUp = false;
            } else {
                monster.setAttribute("targetY", y + 10);
                monsterUp = true;
            }
        } else {
            if(monsterUp) {
            monster.setAttribute("y", parseInt(monster.getAttribute("y")) + 1);
            } else {
                monster.setAttribute("y", parseInt(monster.getAttribute("y")) - 1);
            }
        }
    }
}

function goodThingCollidePlatform(goodthingPos){
    var platforms = svgdoc.getElementById("platforms");
    for (var i = 0; i < platforms.childNodes.length; i++) {
        var node = platforms.childNodes.item(i);
        if (node.nodeName != "rect") continue;

        var x = parseFloat(node.getAttribute("x"));
        var y = parseFloat(node.getAttribute("y"));
        var w = parseFloat(node.getAttribute("width"));
        var h = parseFloat(node.getAttribute("height"));
        var pos = new Point(x, y);
        var size = new Size(w, h);

        if (intersect(goodthingPos, GOODTHINGD_SIZE, pos, size)) {
            return true;
        }
    }
    return false;
}

// This function creates monster
function creatGoodThings(num) {

    var goodthings = svgdoc.getElementById("goodthings");
    
    for (var i = 1; i <= num; i++) {
        var goodthingx;
        var goodthingy = (SCREEN_SIZE.h - 60)/num * i;

        if(goodthingy >= (SCREEN_SIZE.h - 100)) {
            goodthingx = Math.random() * (SCREEN_SIZE.w - 150) + 100;
        } else {
            goodthingx = Math.random() * (SCREEN_SIZE.w - 150) + 50;
        }

        var goodThingPos = new Point(goodthingx, goodthingy);

        if(!goodThingCollidePlatform(goodThingPos)){
            // if do not collide, add the good thing
            var goodthing = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");
            goodthing.setAttribute("x", goodthingx);
            goodthing.setAttribute("y", goodthingy);
            goodthing.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#goodthing");
            goodthings.appendChild(goodthing);
        } else {
            // if collide, compute coordinate again
            --i;
        }

       
    }
}

// This function enable player shooting bullets
function shootBullet() {
    
    // Disable shooting for a short period of time
    canShoot = false;

    // Create the bullet by createing a use node
    var bullet = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");

    // Calculate and set the position of the bullet
    var x = player.position.x + PLAYER_SIZE.w/2 - BULLET_SIZE.w/2;
    var y = player.position.y + PLAYER_SIZE.h/2 - BULLET_SIZE.h/2; 
    bullet.setAttribute("x", x);
    bullet.setAttribute("y", y);

    // Set direction of the bullet
    if (player.currentDir == motionType.LEFT) {
        bullet.setAttribute("motion", shootType.LEFT);
    } else {
        bullet.setAttribute("motion", shootType.RIGHT);

    }

    // Set the href of the use node to the bullet defined in the defs node
    bullet.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#bullet");
    svgdoc.getElementById("bullets").appendChild(bullet);

    if(!cheatmode) {
        bulletLeft--;
        svgdoc.getElementById("bullettext").textContent = bulletLeft;
    }

    if(bulletLeft > 0) {
     setTimeout("canShoot = true", SHOOT_INTERVAL);       
    }
}

function monsterShootBullet(monster){

    // Create the bullet by createing a use node
    var bullet = svgdoc.createElementNS("http://www.w3.org/2000/svg", "use");

    // Calculate and set the position of the bullet
    var x = parseInt(monster.getAttribute("x")) + MONSTER_SIZE.w/2 - BULLET_SIZE.w/2;
    var y = parseInt(monster.getAttribute("y")) + MONSTER_SIZE.w/2 - BULLET_SIZE.w/2;
    var direction = monster.getAttribute("direction");
    bullet.setAttribute("x", x);
    bullet.setAttribute("y", y);

    // Set direction of the bullet
    if (direction == "left") {
        bullet.setAttribute("motion", shootType.LEFT);
    } else {
        bullet.setAttribute("motion", shootType.RIGHT);
    }

    // Set the href of the use node to the bullet defined in the defs node
    bullet.setAttributeNS("http://www.w3.org/1999/xlink", "xlink:href", "#monsterBullet");
    svgdoc.getElementById("monsterBullets").appendChild(bullet);
}

function moveMonsterBullet() {
    var bullet = svgdoc.getElementById("monsterBullets").childNodes.item(0);
    
    if(bullet) {
        var x = parseInt(bullet.getAttribute("x"));
        var shotdir = bullet.getAttribute("motion");

        // Update the position of the bullet
        if (shotdir == shootType.RIGHT) {   
            bullet.setAttribute("x", x + BULLET_SPEED);
        } else {
            bullet.setAttribute("x", x - BULLET_SPEED);
        }

        // If the bullet is not inside the screen delete it from the group
        if (x > SCREEN_SIZE.w || x < 0) {
            svgdoc.getElementById("monsterBullets").removeChild(bullet);

            // shoot a new bullet
            var monsters = svgdoc.getElementById("monsters");
            for (var i = 0; i < monsters.childNodes.length; i++) {
                var monster = monsters.childNodes.item(i);
                var special = monster.getAttribute("special");

                if(special == "true") {
                    monsterShootBullet(monster);
                    continue;
                }
            }
        }
    }  
}

function moveBullets() {
    // Go through all bullets
    var bullets = svgdoc.getElementById("bullets");
    
    for (var i = 0; i < bullets.childNodes.length; i++) {
        var node = bullets.childNodes.item(i);
        var x = parseInt(node.getAttribute("x"));
        var shotdir = node.getAttribute("motion")

        // Update the position of the bullet
        if (shotdir == shootType.RIGHT) {   
            node.setAttribute("x", x + BULLET_SPEED);
        } else {
            node.setAttribute("x", x - BULLET_SPEED);
        }
      
        // If the bullet is not inside the screen delete it from the group
        if (x > SCREEN_SIZE.w || x < 0) {
            bullets.removeChild(node);
            i--;
        }
    }
}

function collisionDetection() {
    
    var monsters = svgdoc.getElementById("monsters");
    var bullets = svgdoc.getElementById("bullets");
    var goodthings = svgdoc.getElementById("goodthings");
    
    // Check whether the player collides with a monster
    if(!cheatmode) {
        for (var i = 0; i < monsters.childNodes.length; i++) {
            var monster = monsters.childNodes.item(i);
            var x = parseFloat(monster.getAttribute("x"));
            var y = parseFloat(monster.getAttribute("y"));
            var monsterPos = new Point(x, y);

            var monsterOverlap = intersect(monsterPos, MONSTER_SIZE, player.position, PLAYER_SIZE);
            if(monsterOverlap) {
                gameOver();
            }
        }
    }

    // Check whether the player collides with a goodthing
    for (var i = 0; i < goodthings.childNodes.length; i++) {
        var goodthing = goodthings.childNodes.item(i);
        var goodthingx = parseFloat(goodthing.getAttribute("x"));
        var goodthingy = parseFloat(goodthing.getAttribute("y"));
        var goodthingPos = new Point(goodthingx, goodthingy);

        var goodOverlap = intersect(goodthingPos, GOODTHINGD_SIZE, player.position, PLAYER_SIZE);
        if(goodOverlap) {
            goodthings.removeChild(goodthing);
            i--;
            goodthingLeft--;
            var plusscore = 20;
            updateScore(plusscore);
        }
    }

    // Check whether a bullet hits a monster   
    for (var i = 0; i < bullets.childNodes.length; i++) {
        var bullet = bullets.childNodes.item(i);
        var bulletx = parseFloat(bullet.getAttribute("x"));
        var bullety = parseFloat(bullet.getAttribute("y"));
        var bulletPos = new Point(bulletx, bullety);

        // For each bullet check if it overlaps with any monster
        // if yes, remove both the monster and the bullet
        for (var j = 0; j < monsters.childNodes.length; j++) {
            
            var monster = monsters.childNodes.item(j);
            var monsterx = parseFloat(monster.getAttribute("x"));
            var monstery = parseFloat(monster.getAttribute("y"));
            var monsterPos = new Point(monsterx, monstery);

            var bulletOverlap = intersect(bulletPos, BULLET_SIZE, monsterPos, MONSTER_SIZE);
            if(bulletOverlap) {
                bullets.removeChild(bullet);
                j--;
                monsters.removeChild(monster);
                i--; 
                
                if(monster.getAttribute("special") == "true"){
                    var plusscore = 25;
                } else {
                    var plusscore = 15;
                }                   
                updateScore(plusscore);
            }
        }  
    }

    // Check if player arrive the exit
    if(goodthingLeft == 0) {
        var exit = svgdoc.getElementById("exitcoor");
        var x =  parseInt(exit.getAttribute("x"));
        var y =  parseInt(exit.getAttribute("y"));
        var exitPos = new Point(560,0);
        var exitSize = new Size(40,40);

        var exitOverlap = intersect(player.position, PLAYER_SIZE, exitPos, exitSize);
        if(exitOverlap) {
            finishLevel();
        }
    }
}

function gameTimeCountDown() {
    var timertext = svgdoc.getElementById("timertext");
    timertext.textContent = timeRemain;
    timeRemain--;
    gametimer = setTimeout("gameTimeCountDown()", 1000);

    if(timeRemain < 5) {
        var blinking = svgdoc.createElementNS("http://www.w3.org/2000/svg", "animate");
        blinking.setAttribute("id", "timerblinking");
        blinking.setAttribute("attributeType", "CSS");
        blinking.setAttribute("attributeName", "opacity");
        blinking.setAttribute("values", "1;0;1");
        blinking.setAttribute("dur", "0.5s");
        blinking.setAttribute("repeatCount", "indefinite");

        timertext.setAttribute("style", "fill:red;font-size:30px;text-anchor:middle;font-weight:bold;")
        timertext.appendChild(blinking);
    }
    
    if(timeRemain < 0) {
        gameOver();
    }
}

function gameOver(){
    svgdoc.getElementById("endgame").style.visibility = "";
    
    var timertext = svgdoc.getElementById("timertext")
        timertext.setAttribute("style", "fill:blue;font-size:30px;text-anchor:middle;font-weight:bold;");
    var blinking = svgdoc.getElementById("timerblinking");
        if(blinking) timertext.removeChild(blinking);
    
    clearInterval(gameInterval);
    clearTimeout(gametimer);

    // remove listeners
    svgdoc.documentElement.removeEventListener("keydown", keydown, false);
    svgdoc.documentElement.removeEventListener("keyup", keyup, false);

    setTimeout("showHighScore();", 1000);
}

function showHighScore(){
    svgdoc.getElementById("endgame").style.visibility = "hidden";

    // Get the high score table from cookies
    table = getHighScoreTable();

    // Create the new score record
    var record = new ScoreRecord(username, score);

    // Insert the new score record
    var pos = table.length;
    for (var i = 0; i < table.length; i++) {
        if (record.score > table[i].score) {
            pos = i;
            break;
        }
    }
    table.splice(pos, 0, record);

    // Store the new high score table
    setHighScoreTable(table);

    // Show the high score table
    showHighScoreTable(table, username);
}

function updateScore(plusscore){
    score = score + plusscore;
    svgdoc.getElementById("scoretext").textContent = score;
}

function finishLevel(){

    // stop updating game
    clearInterval(gameInterval);
    svgdoc.documentElement.removeEventListener("keydown", keydown, false);
    svgdoc.documentElement.removeEventListener("keyup", keyup, false);

    // remove monster and bullets
    cleanUpGroup("monsters");
    cleanUpGroup("bullets");
    cleanUpGroup("goodthings");

    // reset timer
    clearTimeout(gametimer);
    var timertext = svgdoc.getElementById("timertext")
        timertext.setAttribute("style", "fill:blue;font-size:30px;text-anchor:middle;font-weight:bold;");
    var blinking = svgdoc.getElementById("timerblinking");
        if(blinking) timertext.removeChild(blinking);
    
    // add score of 100 * current level and increment level
    var plusscore = 100 * currentLevel + timeRemain;
    updateScore(plusscore);
    currentLevel++;
    svgdoc.getElementById("leveltext").textContent = currentLevel;

    // popup for next level
    svgdoc.getElementById("levelpopup").style.visibility = "";    
    svgdoc.getElementById("levelpopuptext").textContent = "Level " + currentLevel;

    setTimeout("startNewLevel()", 2000);
}

function startNewLevel(){
    svgdoc.getElementById("levelpopup").style.visibility = "hidden"; 
    
    // reset var and events
    player = new Player();
    bulletLeft = MAXBULLET;
    canShoot = true;
    timeRemain = GAMETIMELIMIT;
    svgdoc.documentElement.addEventListener("keydown", keydown, false);
    svgdoc.documentElement.addEventListener("keyup", keyup, false);

    // reset info panel
    if(!cheatmode) svgdoc.getElementById("bullettext").textContent = bulletLeft;
    svgdoc.getElementById("timertext").textContent = timeRemain;

    // create monster and good things
    var monsternum = INITIAL_MONSTER_NUM + MONSTER_INCREMENT * currentLevel - MONSTER_INCREMENT;
    createMonster(monsternum);
    var goodthingnum = INITIAL_GOOD_NUM + GOOD_INCREMENT * currentLevel - GOOD_INCREMENT;
    goodthingLeft = goodthingnum;
    creatGoodThings(goodthingnum);
    
    // start the game interval and timer again
    gameInterval = setInterval("gamePlay()", GAME_INTERVAL);
    gameTimeCountDown();
}

function updateCheatMode(){

    if (cheatmode) {
        svgdoc.getElementById("cheatmodetext").textContent = "ON";
        svgdoc.getElementById("bullettext").textContent = "unlimited";
    } else {
        svgdoc.getElementById("cheatmodetext").textContent = "OFF";
        svgdoc.getElementById("bullettext").textContent = bulletLeft;
    }
    
}
