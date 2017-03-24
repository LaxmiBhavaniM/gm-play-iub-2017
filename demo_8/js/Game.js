//the actual game
var DinoEggs = DinoEggs || {}; 

DinoEggs.Game = function(){
    Phaser.State.call(this);
    
    this._levelNumber = 3;
    
    this._eggsGroup = null;
    this._rocksGroup = null;
    this._platforms = null;
    this._spawnRockTimer = 0;
    this.g_x_start = 32;
    this.g_x_end = 400;
    this.matchExpCanvas = null;
    this.solveEqCanvas = null;
    this.selectedEgg = null;
    this.g_numEggs = 4;
    this.score = 0;
    this.scoreText = null;
    this.boardText1 = null;
    this.boardText2 = null;
    this.board = null;
    this.matchExpDerivation = null;

    //------[ROCKS] set problem mode according to problem set. 0:match expression, 1: solve equation , 2: simplify expression---------
    //including two types of problem-formats from simplify expression set
    this.rock_levelProblemSet = g_matchExpressionFormat[4];
    this.rock_problemMode = 0;
    //--------------------------------------------------------------------
    
    //------[EGGS] set problem mode according to problem set. 0:match expression, 1: solve equation , 2: simplify expression---------
    //including two types of problem-formats from simplify expression set
    this.egg_levelProblemSet = g_solveForXEqProblemsFormat[0];
    this.egg_problemMode = 1;
    //--------------------------------------------------------------------
    this.g_canvasExpression = this.rock_levelProblemSet[0];
    this.g_parsedCanvasExpression = this.g_canvasExpression.replace(/\*/g, "");
    this.g_equation="";
    this.g_parsedEquation="";
    this.g_rockProducedIndex = -1;
    this.g_numRocks = 5;
    this.g_rockInterval = 1;
    
    this.music=null;
    
    this.rockPositions =[];
    
    this.undoBtn = null;
    
    this.currentCanvasEqu ="";
    this.g_powerupDuration = 20;
    this.isPowerupActivated = false;

};
DinoEggs.Game.prototype = Object.create(Phaser.State.prototype);
DinoEggs.Game.prototype.constructor = DinoEggs.Game;

DinoEggs.Game.prototype = {

    create:function(){    
        
        //load both GM canvases
        //!preserve bindings
        var currentObj = this;
        loadGM(function(){
         currentObj.initCanvas();   
        
        }, { version: '0.12.6' });
        
        
        this.hatchlingXRightLimit = 200;
        this.hatchlingXFinalPos = this.hatchlingXRightLimit;
        this.hatchlingXSpacing = 50;
        
        this.hatchlingYUpperLimit = 40;
        this.hatchlingYLowerLimit = 80;
        this.hatchlingYFinalPos = this.hatchlingYLowerLimit;
        this.hatchlingYRange = this.hatchlingYUpperLimit - this.hatchlingYLowerLimit;
        this.hatchlingYSpacing = 10;
        
        
        //background
        this.game.add.tileSprite(0, 0, this.game.width, this.game.height, 'sky');
        
        //set ground
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this._platforms = this.game.add.group();
        this._platforms.enableBody = true;
        var ground = this._platforms.create(0, this.game.world.height - 12, 'ground');
        ground.scale.setTo(2,6);
        ground.body.immovable = true;
        
        //dino mom
        this.dino = this.game.add.sprite(567, 275, 'dino');
        var move = this.dino.animations.add('move',['1.png','2.png','3.png','4.png'],24,true);
        
        //  Rocks group
        this._rocksGroup = this.game.add.group();
        this._rocksGroup.enableBody = true;
        this._rocksGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.rocksTospawn = [];
        
        //  Eggs group
        this._eggsGroup = this.game.add.group();
        this._eggsGroup.enableBody = true;
        this._eggsGroup.physicsBodyType = Phaser.Physics.ARCADE;
         
        
        //  The score
        this.scoreText = this.game.add.text(600, 16, 'Score: 0', { fontSize: '32px', fill: '#000' });
        
        //music 
        this.music = this.game.add.audio('bg_music');
        this.music.play();
        
        //create Eggs
        this.createEggs(this.g_numEggs);
        
        rockwave = this.game.add.sprite(0,0, "rockwave");
		rockwave.anchor.setTo(0.5,0.5);
        rockwave.x=this.game.width/2;
        rockwave.y=this.game.height/3;
	    rockwave.scale.setTo(0,0);

        //create Rocks
        this.createRocks(this.g_numRocks);     
        
        //create rock wave - (rockinterval between consecutive rocks, number of rocks)       
        this.startRockWave(this.g_rockInterval,this.g_numRocks,this.g_numEggs);
        
        //end celebration 
        this.celebrationEmitter = this.game.add.emitter(this.game.world.centerX, -32, 50);
        
         //Here we're passing an array of image keys. It will pick one at random when emitting a new particle.
         this.celebrationEmitter.makeParticles(['jewel_red', 'jewel_purple', 'jewel_white','jewel_green','jewel_yellow']);
        this.celebrationEmitter.gravity = 0;    
        this.celebrationEmitter.width = 800;
        this.celebrationEmitter.maxParticleScale = 1;
        this.celebrationEmitter.minParticleScale = 0.5;
        this.celebrationEmitter.setYSpeed(100, 200);
        this.celebrationEmitter.gravity = 0;
        this.celebrationEmitter.width = this.game.world.width * 1.5;
        this.celebrationEmitter.minRotation = 0;
        this.celebrationEmitter.maxRotation = 40;
   
       
        awesome = this.game.add.sprite(0,0, "awesome");
		awesome.anchor.setTo(0.5,0.5);
        awesome.x=this.game.width/2;
        awesome.y=this.game.height/3;
	    awesome.scale.setTo(0,0);
           
        //lightning group 
         this._lightningGroup = this.game.add.group();
         this._lightningGroup.enableBody = true;
         this._lightningGroup.physicsBodyType = Phaser.Physics.ARCADE;
        this.lightRockMap ={}
        
        //show instructions after 2 seconds
        this.game.time.events.add(Phaser.Timer.SECOND * 2, this.showRockInstructions, this);
        
        
        this.pterodactyl = this.game.add.sprite(0, 0, 'pterodactyl');
        this.pterodactyl.scale.setTo(0.2,0.2);
        this.pterodactyl.visible = false;
    },
    showRockInstructions:function(){
        this.showBoard('Match rock ','expression to burst');
        this.dino.animations.play('move', 10, true);
    },
    update:function(){
        this.game.physics.arcade.collide(this._eggsGroup, this._platforms);
        this.game.physics.arcade.overlap(this._rocksGroup, this._platforms, this.disappearRockOnGround, null, this);
        this.game.physics.arcade.overlap(this._rocksGroup, this._eggsGroup, this.hitEgg, null, this);
        
        //check collision for lightning
         this.game.physics.arcade.overlap(this._lightningGroup, this._rocksGroup, this.lightningStruck, null, this);
        
        //check if the rocks are falling:
        if(this._rocksGroup.countLiving() != 0){    
            this.game.input.enabled = false;
        }
        else{
            this.game.input.enabled = true;
        }
        
        //render egg equations
        this._eggsGroup.forEach(function(egg){
          egg.equationText.x = Math.floor(egg.x + egg.width / 2);
          egg.equationText.y = Math.floor(egg.y + egg.height / 2);          
        });
        
        //render rock equations
        this._rocksGroup.forEach(function(rock){
          rock.equationText.x = Math.floor(rock.x + rock.width / 2);
          rock.equationText.y = Math.floor(rock.y + rock.height / 2);          
        });
        
        if(this.pterodactyl.visible == true){
          this.powerupText.x = Math.floor(this.pterodactyl.x + this.pterodactyl.width / 2);
          this.powerupText.y = Math.floor(this.pterodactyl.y + this.pterodactyl.height / 2);   
        }

    },
    
    disappearRockOnGround: function(rock, platform){
        this.rockBurst(rock);
    },
    
    createEggs: function(numEggs){
        //eggs fall from center of canvas onto ground 
        var egg_y = this.game.world.height/2;

        //  Here we'll create eggs evenly spaced apart
        var egg_x_array = this.linspace(this.g_x_start,this.g_x_end,numEggs);

        for (var i = 0; i < numEggs; i++){
            var egg = new Egg(this.game,egg_x_array[i],egg_y,this.createEggEquation());
            
            //add animation callback on complete !maintain parameter bindings
             egg.animations.getAnimation('hatch').onComplete.add(function(eggSprite, animation){
                //get x position for egg to hatch
                var egg_x = eggSprite.x;
                var isSad = false;
                if(eggSprite.hitCounter > 2 && eggSprite.hitCounter != 10000){
                    isSad = true;
                }
                
                //get score
                var score = this.calculateScore(eggSprite.hitCounter); 
                
                //Add score text here
                var obtainedScoreText = this.game.add.text(eggSprite.x, eggSprite.y, score, { fontSize: '32px', fill: '#000' });
                
                //score animation
//                this.clearBoard();
                var scoreTween = this.game.add.tween(obtainedScoreText).to({x: 700, y: 16}, 3000, Phaser.Easing.Quadratic.InOut, true);
                scoreTween.onComplete.addOnce(this.updateScore,this,obtainedScoreText); 
                
                //check for any existing black eggs
                if(eggSprite.hitCounter <= 2){
                    for (var j = 0; j < this._eggsGroup.length; j++){
                        if(this._eggsGroup.children[j].hitCounter > 2){
                            var blackEggScoreText = this.game.add.text(this._eggsGroup.children[j].x, this._eggsGroup.children[j].y, "-10", { fontSize: '32px', fill: '#000' });
                            var blackEggTween = this.game.add.tween(blackEggScoreText).to({x: 700, y: 16}, 3000, Phaser.Easing.Quadratic.InOut, true);
                            //blackEggTweenArray.push(blackEggTween);
                        blackEggTween.onComplete.addOnce(this.updateScore,this,blackEggScoreText); 
                        }
                    }
                }
                
                eggSprite.equationText.destroy();
                this._eggsGroup.remove(eggSprite); 
                this.runToMom(egg_x, isSad);
                
                if(this._eggsGroup.countLiving() > 0 && !this.isPowerupActivated  ){
                    this.clearGMCanvas(this.solveEqCanvas);
                    this.clearGMCanvas(this.matchExpCanvas);
                    document.getElementById("eq-match-div").style.display="block";
                    document.getElementById("eq-solve-div").style.display="none";
                    this.matchExpDerivation = this.matchExpCanvas.model.createElement('derivation', { eq: this.g_parsedCanvasExpression, pos: { x: "center", y: 10 } }); 
                    this.currentCanvasEqu = this.g_parsedCanvasExpression;
                    //_________________________________________________________________________
                    //create Rocks and start rockwave
                    this.createRocks(this.g_numRocks);        
                    //create rock wave - (rockinterval between consecutive rocks, number of rocks)       
                  this.startRockWave(this.g_rockInterval,this.g_numRocks,this.g_numEggs);
                   //__________________________________________________________________________
                }
                else{
                    this.isPowerupActivated = false;  
                }
            }, this);
            
            //add click event to egg
            egg.inputEnabled = true;
            egg.events.onInputDown.add(this.populateSolveEqCanvas, this, egg);
            this._eggsGroup.add(egg);
    
        }
    },
    createRocks: function(numRocks){
        //  create rocks
        this.rockPositions = this.linspace(this.g_x_start,this.g_x_end,this.g_numEggs);
        if(this.rockPositions.length>0){
            
            for (var i = 0; i < numRocks; i++){
                var randIndex = Math.floor(Math.random() * this.rockPositions.length);
                var randposX = this.rockPositions[randIndex];
                this.rockPositions.splice(randIndex,1);
                //place the postionX at the end of array for reuse
                this.rockPositions.push(randposX);
                var rock = new Rock(this.game,randposX, 0, this.getMatchEquationOnRock());
                rock.body.velocity.y = 0;
                rock.visible = false;
                rock.equationText.visible = false;
                this._rocksGroup.add(rock);
                this.rocksTospawn.push(rock);
    
            }
        }
        
    },
    calculateScore: function(hitCount){
        if (hitCount == 0) {
            return "+50";
        } else if (hitCount == 1){
            return "+40";
        } else if (hitCount == 2){
             return "+30";
        } else if(hitCount == 10000){ //golden egg
            return "+100";
        }else{
            return "+20";
        }
    },

    runToMom: function(egg_x, isSad){
        var hatchling = this.game.add.sprite(egg_x,this.game.world.height-100, 'hatchling');
        if(isSad){
            hatchling.tint = 0xff0000;
        }

        hatchling.anchor.setTo(0.5, 0.5);
        hatchling.animations.add('run');
        hatchling.animations.play('run', 10, true);

        // params are: properties to tween, time in ms, easing and auto-start tweenthis.
        var runningDinoTween = this.game.add.tween(hatchling).to({x: this.game.world.width - this.hatchlingXFinalPos, y: this.game.world.height-this.hatchlingYFinalPos}, 3000, Phaser.Easing.Quadratic.InOut, true);
        
        this.hatchlingYFinalPos -= this.hatchlingYSpacing;
        if(this.hatchlingYFinalPos <= this.hatchlingYUpperLimit){
            this.hatchlingXFinalPos += this.hatchlingXSpacing;
            this.hatchlingYFinalPos = this.hatchlingYLowerLimit;
        }
        runningDinoTween.onComplete.addOnce(this.stopDino, this,hatchling);  


    },
    stopDino: function(hatchling){
        //  This method will reset the frame to frame 1 after stopping
        hatchling.animations.stop(null, true);
        if(this._eggsGroup.countLiving() == 0)
        {
           this.gameOver();   
        }
    },
    updateScore: function(currentScoreText){
        var scoreString = currentScoreText.text;
        currentScoreText.destroy();
        
        // update the actual score
        var operation = scoreString.substring(0,1);
        if(operation == '+'){
            this.score += parseInt(scoreString.substring(1));
        }else{
            this.score -= parseInt(scoreString.substring(1));
            
            //do not allow negative scores
            if(this.score < 0){
                this.score = 0;
            }
        } 
        this.scoreText.text = 'Score: ' + this.score;
    },
    
    populateSolveEqCanvas: function(selectedEgg){
       
        if(this.board){    
            this.clearBoard();
            this.dino.animations.stop(null, true); 
        }
        document.getElementById("eq-solve-div").style.display="block";
        document.getElementById("eq-match-div").style.display="none";        
        this.selectedEgg = selectedEgg;
        this.clearGMCanvas(this.solveEqCanvas);
        this.clearGMCanvas(this.matchExpCanvas);
        this.solveEqCanvas.model.createElement('derivation', { eq: selectedEgg.equ, pos: { x: 'center', y: 50 } });
    },
    
    startRockWave: function(rockIntervalSec, numRocks,numEggs){
        var t = this.game.add.tween(rockwave.scale).to({ x: 1,y:1}, 5000,  Phaser.Easing.Bounce.Out,true);
                        t.onComplete.add(exitTween, this);
                        function exitTween () {
                            this.game.add.tween(rockwave.scale).to({ x: 0,y:0}, 500,  Phaser.Easing.Bounce.Out,true);
                        }
        //this.game.time.events.add(Phaser.Timer.SECOND * 2, this.shakeCamera, this);
        this.g_rockProducedIndex = -1;
        this.rockPositions = this.linspace(this.g_x_start,this.g_x_end,numRocks);
        this.game.time.events.repeat(Phaser.Timer.SECOND * rockIntervalSec, numRocks, this.spawnRock, this);
    },
    shakeCamera: function(){
      this.game.camera.shake(0.005, 1000);  
    },
    spawnRock: function(){
        
        if(this.rocksTospawn){
            this.g_rockProducedIndex++;
            
            var rock = this.rocksTospawn.pop();
            
            //replace rock equation
            if(rock.getEquation() == this.currentCanvasEqu){
                
                rock.setEquation(this.getMatchEquationOnRock());
                while(rock.getEquation() == this.currentCanvasEqu){
                    rock.setEquation(this.getMatchEquationOnRock());
                }
            }
            
            rock.body.velocity.y = 15;
            rock.visible = true;
            rock.equationText.visible=true;
        }
        
        if(this.g_rockProducedIndex == 2){
            this.pterodactyl.visible = true;  
            this.powerupText = this.game.add.text(this.pterodactyl.x , this.pterodactyl.y, this.getMatchEquationOnRock(), { fontSize: '20px', fill: '#000' });
            x_pos = this.game.world.randomX;
            y_pos = this.game.world.randomY;
            this.powerUpTween = this.game.add.tween(this.pterodactyl).to( { x: x_pos , y: 400 }, 7000, Phaser.Easing.Quadratic.InOut, true); 
            this.powerUpTween.onComplete.addOnce(this.handlePowerupTween, this);  
        }
    
    },
    handlePowerupTween:function(){
        this.g_powerupDuration--;
        
        if(this.g_powerupDuration > 0){
            x_pos = this.game.world.randomX;
            y_pos = this.game.world.randomY;
            this.powerUpTween = this.game.add.tween(this.pterodactyl).to( { x: x_pos , y: 400 }, 7000, Phaser.Easing.Quadratic.InOut, true);

            this.powerUpTween.onComplete.addOnce(this.handlePowerupTween, this);  
        }else{
            this.pterodactyl.kill();
            this.powerupText.kill();    
            //reset the powerup duration
            this.g_powerupDuration = 7;
        }
        
    },

    hitEgg: function(rock, egg){
        
        this.rockBurst(rock);

        if(this._rocksGroup.countLiving() == 0 && this.g_rockProducedIndex +1 == this.g_numRocks){    
            this.clearGMCanvas(this.matchExpCanvas);    
        }
        
        //if this egg is not golden egg, only then change the egg color
        if(egg.tint != 0xccac00){
            var hits = ++egg.hitCounter;
            switch(hits){
                case 1 : egg.tint = 0x00ff00; 
                        egg.animations.play('wiggleOnce');
                         break;
                case 2 : egg.tint = 0xff0000;
                        var style = {font: "20px Arial", fill: "#111111", wordWrap: true, wordWrapWidth: egg.width, align: "center"};
                        egg.setEquStyle(style);
                        egg.animations.play('wiggleOnce');
                        break
                case 3 :  egg.tint = 0x2412ff;
                        blackdino_popup = true;

                         this.showBoard('Sad dino','Please hatch eggs!')
                         egg.animations.play('wiggleContinous');
                        this.dino.animations.play('move', 10, true);
                         break;

            }
        }else{
            egg.animations.play('wiggleOnce');
        }
    },
    
    rockBurst: function(rock){    
    
         //burst emitter for rocks
        var rock_emitter = this.game.add.emitter(0, 0, 100);

        rock_emitter.makeParticles('star');
        rock_emitter.gravity = 0;

        rock_emitter.x = rock.x;
        rock_emitter.y = rock.y;

        //explode / milliseconds before particle disappear/ doesn't matter/ number of particles emitted at a time
        rock_emitter.start(true, 2000, null, 5);
        
        rock.equationText.destroy();
        this._rocksGroup.remove(rock);

        //  And 2 seconds later we'll destroy the emitter
        this.game.time.events.add(2000, this.destroyObject, this, rock_emitter);
        
        if(this._rocksGroup.countLiving() == 0 && this.g_rockProducedIndex +1 == this.g_numRocks){
            this.clearGMCanvas(this.matchExpCanvas);
            if(this._eggsGroup.countLiving()>0){
                this.showBoard('Click egg ','and solve for x');
                this.dino.animations.play('move', 10, true);
                this._eggsGroup.callAll('animations.play', 'animations', 'wiggleOnce');
            }
        }

    },
    
    destroyObject: function(obj) {
        if(obj != undefined)
            obj.destroy();
    },
    
    managePause:function(){
        //To be implemented
    },
    
    gameOver: function() {    
        //pass the score as a parameter 
       
        this.scoreText.destroy();
        this.clearGMCanvas(this.solveEqCanvas);
        this.clearGMCanvas(this.matchExpCanvas);
        var gameOverText = this.game.add.text( this.game.world.width*0.5 - 50, this.game.world.height*0.5 - 40, 'Score:' + this.score, { fontSize: '22px', fill: '#000' });
        
        var stars = this.endStar();
        if (stars>0){
            this.updatePlayerData(stars);
        }        
        var restartButton = this.game.add.button(this.game.world.width*0.5, this.game.world.height*0.5 + 20, 'restart', function(){
            this.state.start('Game');
        }, this.game, 1, 0, 2);
        restartButton.anchor.set(0.5);
        
        var mainMenuButton = this.game.add.button(this.game.world.width*0.5, this.game.world.height*0.5 + 50, 'menu', function(){
            this.state.start('MainMenu');
        }, this.game, 1, 0, 2);
        mainMenuButton.anchor.set(0.5);
        
        this.music.stop();
        
        //add celebration
         this.celebrationEmitter.start(false, 10000, 100);
        var elem = document.getElementById("undo_button");
        if(elem){
            elem.parentNode.removeChild(elem);
        }
    },
    updatePlayerData: function(stars) {
		// set number of stars for this level
		DinoEggs.PLAYER_DATA[this._levelNumber-1] = stars;

		// unlock next level
		if (this._levelNumber < DinoEggs.PLAYER_DATA.length) {
			if (DinoEggs.PLAYER_DATA[this._levelNumber] < 0) { // currently locked (=-1)
				DinoEggs.PLAYER_DATA[this._levelNumber] = 0; // set unlocked, 0 stars
			}
		};
		// and write to local storage
		window.localStorage.setItem('DinoGame_Progress', JSON.stringify(DinoEggs.PLAYER_DATA));
        
	},   
    
    endStar: function() {
        var starPostion =0;
        var scoreBase =50;
        var starNumber=0;
        while (this.score > 0){
           this.game.add.sprite(this.game.world.width*0.5 - 50 + starPostion, this.game.world.height*0.5 - 80, 'star');
            starPostion = starPostion + 20;
            this.score = this.score - scoreBase; 
            starNumber++;
            if (starNumber == 3){
                break;
            }
        }
        var greyStar = 3 - starNumber;
        while(greyStar > 0){
            var star1 =  this.game.add.sprite(this.game.world.width*0.5 - 50 + starPostion, this.game.world.height*0.5 - 80, 'star');
            star1.tint= 0x232323;
            starPostion = starPostion + 20;
            greyStar--;
        }
        return starNumber;
    },
    
    showBoard: function(line1,line2) {
        if(this.board)
            this.clearBoard();
        this.board = this.game.add.sprite(500,250,'board');
        this.board.scale.setTo(0.8,0.7);
        this.boardText1 = this.game.add.text(520,270, line1, { fontSize: '15px', fill: '#000' });
        this.boardText2 = this.game.add.text(510,300, line2, { fontSize: '15px', fill: '#000' });
    },
    
    clearBoard: function() {
        this.board.destroy();
        this.boardText1.destroy();
        this.boardText2.destroy();
},
    
    matchEquationOnRocks: function(equation){
        var matchedEqRocks= [];
        var parsedEq = equation.replace(/\*/g, "");
        this.currentCanvasEqu = parsedEq;
        for(var i = 0 ; i < this._rocksGroup.children.length ; i++){
            if(this._rocksGroup.children[i].visible && this._rocksGroup.children[i].equ == parsedEq){
                //add rock obj to array;
                matchedEqRocks.push(this._rocksGroup.children[i]);
            }
            
        }
        return matchedEqRocks;
    },
    matchEqCheck:function(evt){
        if(this.board)
            this.clearBoard();
            this.dino.animations.stop(null, true);
        this.undoBtn.disabled = false;
        var lastEq = evt.last_eq;
        
        //first check for powerup and then
        if(this.pterodactyl.visible == true){
            var parsedEq = lastEq.replace(/\*/g, "");
            if(this.powerupText.text == parsedEq){
                
                //acquired a new power up
                this.acquirePowerup();
            }
        }else{
            var matchedEqRockArray = this.matchEquationOnRocks(lastEq);
            if (matchedEqRockArray.length > 0 && this._rocksGroup.countLiving() > 0) {
                for(var j = 0; j < matchedEqRockArray.length ; j++){
                     //set the rock velocity to 0
                     var matchedRock = matchedEqRockArray[j];                    
                     matchedRock.body.velocity.y = 0;

                     //initiate lightning weapon from match exp canvas towards the rock to burst it open
                     this.initiateLightningWeaponForRock(matchedRock);

                }
                if(this._rocksGroup.countLiving() == 0 && this.g_rockProducedIndex == this.g_numRocks){
                    this.clearGMCanvas(this.matchExpCanvas); 
                    this.showBoard('Click egg ','and solve for x');
                     this.dino.animations.play('move', 10, true);
                }

            }
        }
        
    },
    acquirePowerup:function(){
        console.log("Power up acquired");
        this.isPowerupActivated = true;
        
        //kill pterodactyl, power up text and show a cool message that player acquired a powerup
        this.pterodactyl.kill();
        this.powerupText.kill();
        this.g_powerupDuration = 7;
        
        //randomly choose available powerups
        
        //Move below code somewhere else while refactoring
        var powerupsArray = [];
        var freezePowerup = {"id": "1", "name" : "Rocks Freeze", "handler" : "freezeRocks"};
        powerupsArray.push(freezePowerup);
        var destroyAllRocksPowerup = {id: "2", name : "Destroy All Rocks", handler : "destroyRocks"};
        powerupsArray.push(destroyAllRocksPowerup);
        var goldenEggPowerup = {id: "3", name : "Unlocked Golden Egg", handler : "addGoldenEgg"};   
        powerupsArray.push(goldenEggPowerup);
        var hatchEggPowerup = {id: "4", name : "Hatch any egg", handler : "hatchRandomEgg"};
        powerupsArray.push(hatchEggPowerup);
        
        var indexToChoose = 2;
        //var indexToChoose = this.getRandomRange(0, powerupsArray.length - 1);
        console.log("Index chosen : "+indexToChoose);
        
        var chosenPowerup = powerupsArray[indexToChoose];
        console.log(chosenPowerup);
        
        //Show powerup name
        powerName = this.game.add.text(0,0, chosenPowerup.name, { fontSize: '32px', fill: '#000' });
		powerName.anchor.setTo(0.5,0.5);
        powerName.x=this.game.width/2;
        powerName.y=this.game.height/3;
        var powerNameTween = this.game.add.tween(powerName.scale).to({ x: 1,y:1}, 2000,  Phaser.Easing.Bounce.Out,true);
        powerNameTween.onComplete.add(exitTween, this);
        function exitTween () {
            this.game.add.tween(powerName.scale).to({ x: 0,y:0}, 50,  Phaser.Easing.Bounce.Out,true);
        }

        //handle selected powerup
        console.log(chosenPowerup.name);
        this[chosenPowerup.handler]();
    },
    freezeRocks:function(){
        console.log("freezeRocks Handler called");
        for(var i = 0 ; i < this._rocksGroup.children.length ; i++){
            this._rocksGroup.children[i].body.velocity.y = 0;
        }
        this.game.time.events.add(Phaser.Timer.SECOND * 15, this.unfreezeRocks, this);
    },
    unfreezeRocks:function(){
        console.log("Unfreezing rocks");
        for(var i = 0 ; i < this._rocksGroup.children.length ; i++){
            this._rocksGroup.children[i].body.velocity.y = 15;
        }
        this.isPowerupActivated = false; 
    },
    destroyRocks:function(){
        console.log("destroyRocks Handler called");
        while(this._rocksGroup.countLiving() > 0){
            this.rockBurst(this._rocksGroup.children[0]);
        }
        this.isPowerupActivated = false; 
    },
    addGoldenEgg:function(){
        console.log("addGoldenEgg Handler called");
        var eggIndex = this.getRandomRange(0, this._eggsGroup.countLiving() - 1);
        //Can we get a dead egg here ?
        var eggToReplace = this._eggsGroup.children[eggIndex];  
        eggToReplace.tint = 0xccac00;
        eggToReplace.hitCounter = 10000; // provide a better logic to recognize the golden egg
    },
    hatchRandomEgg:function(){
        console.log("hatchRandomEgg Handler called");
        var eggIndex = this.getRandomRange(0, this._eggsGroup.children.length - 1);
        console.log("eggIndex : "+eggIndex);
        this.selectedEgg = this._eggsGroup.children[eggIndex];
        this.selectedEgg.animations.play('hatch', 6, false);
        this.selectedEgg = null;
        
    },
    initiateLightningWeaponForRock:function(rock){
        
         var lightning = this.game.add.sprite(this.game.world.centerX,600, 'lightning');
         lightning.anchor.setTo(0.5, 0.5);
         this.game.physics.enable(lightning, Phaser.Physics.ARCADE);
         lightning.body.allowRotation = false;
         lightning.nameId = this.makeid(); 
         this._lightningGroup.add(lightning);
         lightning.rotation = this.game.physics.arcade.moveToObject(lightning, rock, 5, 500); 
         
         //Add to map
         this.lightRockMap[lightning.nameId] = rock;
     },
    makeid: function()
    {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for( var i=0; i < 5; i++ )
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    },
     lightningStruck:function(lightning, rock){
         
     
         var currentMatchExp = this.matchExpDerivation.getLastModel().to_ascii().replace(/\*/g, "");
         
         if(this.lightRockMap[lightning.nameId] == rock){
             if(rock.equationText.text != currentMatchExp){
                return;
             }
             var obtainedScoreText = this.game.add.text(rock.x, rock.y, "+10", { fontSize: '32px', fill: '#000' });
             this.rockBurst(rock);
             delete this.lightRockMap[lightning.nameId];
             this._lightningGroup.remove(lightning);

             //animate and update score 
             var scoreTween = this.game.add.tween(obtainedScoreText).to({x: 700, y: 16}, 3000, Phaser.Easing.Quadratic.InOut, true);
             scoreTween.onComplete.addOnce(this.updateScore,this,obtainedScoreText); 
         }
     },
    solveEqCheck:function(evt){
       
                //condition to check if equation is solved  
                if ((evt.last_eq.startsWith("x=") && !isNaN(evt.last_eq.slice(2)))||
                   (evt.last_eq.endsWith("=x")&& !isNaN(evt.last_eq.slice(0,-2)))){
                    if(this.selectedEgg){
                        
                        var t = this.game.add.tween(awesome.scale).to({ x: 1,y:1}, 2000,  Phaser.Easing.Bounce.Out,true);
                        t.onComplete.add(exitTween, this);
                        function exitTween () {
                            this.game.add.tween(awesome.scale).to({ x: 0,y:0}, 50,  Phaser.Easing.Bounce.Out,true);
                        }
                        
                        this.selectedEgg.animations.play('hatch', 6, false);
                        this.selectedEgg = null;
                    }

                }
    },
    simplifyEqCheck:function(evt){
        this.undoBtn.disabled = false;
                //condition to check if equation is solved  
                if (!isNaN(evt.last_eq)){
                    if(this.selectedEgg){
                        var t = this.game.add.tween(awesome.scale).to({ x: 1,y:1}, 2000,  Phaser.Easing.Bounce.Out,true);
                        t.onComplete.add(exitTween, this);
                        function exitTween () {
                            this.game.add.tween(awesome.scale).to({ x: 0,y:0}, 50,  Phaser.Easing.Bounce.Out,true);
                        }
                        this.selectedEgg.animations.play('hatch', 6, false);
                        this.selectedEgg = null;

                    }

                }
    },
    initCanvas: function(){

        //GM Code
            document.getElementById("eq-match-div").style.display="block";
            document.getElementById("eq-solve-div").style.display="none";

            //solveEqCanvas is for Equation Solving
            //matchExpCanvas is for Pattern Matching
            this.solveEqCanvas = new gmath.Canvas('#gmath1-div', {use_toolbar: false, vertical_scroll: false });
            this.matchExpCanvas = new gmath.Canvas('#gmath2-div', {use_toolbar: false, vertical_scroll: false });

            this.matchExpDerivation = this.matchExpCanvas.model.createElement('derivation', { eq: this.g_parsedCanvasExpression, pos: { x: "center", y: 10 } });
            this.currentCanvasEqu = this.g_parsedCanvasExpression;
            //disabling the solveEq canvas
            
            //!preserve binding
            var thisObj =this;
            this.matchExpCanvas.model.on('el_changed', function(evt) {	
                thisObj.matchEqCheck(evt);
            });
            //!preserve binding
            this.solveEqCanvas.model.on('el_changed', function(evt) {
                if(thisObj.egg_problemMode==1){
                    thisObj.solveEqCheck(evt);
                }
                else if(thisObj.egg_problemMode==2){
                    thisObj.simplifyEqCheck(evt);
                }
            });
        
       //Create the search button
       this.undoBtn = document.createElement("input");
        
       //Set the attributes
       this.undoBtn.setAttribute("type","button");
       this.undoBtn.setAttribute("value","Undo");
       this.undoBtn.setAttribute("name","undobtn");
       this.undoBtn.setAttribute("id","undo_button");
       this.undoBtn.style.postion = "absolute";
       this.undoBtn.style.top = "0";
       this.undoBtn.style.marginLeft = "100px";
       this.undoBtn.style.cssFloat = "left";
    
       var contextRef = this;
       this.undoBtn.onclick = function(){
           if(contextRef._rocksGroup.countLiving() > 0){
               contextRef.matchExpCanvas.controller.undo();
           }else{
                contextRef.solveEqCanvas.controller.undo();
           }
           
       };
        
       //Add the button to the body
        document.getElementById("game-div").appendChild(this.undoBtn);
       
       this.undoBtn.disabled = true;
        $('#undo_button').addClass('btn-warning');
        $('#undo_button').addClass('btn-lg');
        
    },
    
    clearGMCanvas: function(canvasObj){
        //clear canvas
        while(canvasObj.model.elements().length > 0){
        canvasObj.model.removeElement(canvasObj.model.elements()[0]); 
     }
    },
    
    //utility functions
    //.............................................................
    // random range generator
    getRandomRange: function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    getMatchEquationOnRock: function(){
        var indexToChoose = this.getRandomRange(1, this.rock_levelProblemSet.length - 1);
        this.g_equation =  this.rock_levelProblemSet[indexToChoose];
        this.g_parsedEquation = this.g_equation.replace(/\*/g, "");
        return this.g_parsedEquation;
    },
    createEggEquation: function(){
            //get random expression format from current level ProblemSet
            equation_format = this.egg_levelProblemSet[Math.floor(Math.random()*this.egg_levelProblemSet.length)];
            num_of_coefficients = (equation_format.match(/N/g)||[]).length;
            equation = equation_format;
        
            for(var i=0;i<num_of_coefficients;i++){
                equation=equation.replace(/N/, Math.floor((Math.random() * 10) + 1));                
            }
   
            return equation;
    },
    //http://www.numericjs.com/index.php
    linspace: function(a,b,n) {
        if(typeof n === "undefined") n = Math.max(Math.round(b-a)+1,1);
        if(n<2) { return n===1?[a]:[]; }
        var i,ret = Array(n);
        n--;
        for(i=n;i>=0;i--) { ret[i] = (i*b+(n-i)*a)/n; }
        return ret;
    }
    

}

