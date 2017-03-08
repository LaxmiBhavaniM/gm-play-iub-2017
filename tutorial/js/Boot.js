/*  -general game settings are defined
    -the assets of the preloading screen are loaded (example the loading bar). 
    -Nothing is shown to the user
    -we load the assets that will be shown in the Preload state*/

var DinoEggs = DinoEggs || {}; 

DinoEggs.Boot = function(){   
    "use strict";
    Phaser.State.call(this);
    
};
DinoEggs.Boot.prototype = Object.create(Phaser.State.prototype);
DinoEggs.Boot.prototype.constructor = DinoEggs.Boot;

//setting game configuration and loading the assets for the loading screen
DinoEggs.Boot.prototype = {
    
    //init: State initialization. If you need to send parameters to the State, this is where they’ll be accessible
    init: function(){
        this.input.maxPointers = 1; // multi-touch pointers for touch screen
        this.stage.disableVisibilityChange = true; // freeze game if player switches tab 
        
    },
    
    //assets we'll use in the loading screen
    preload:function(){
        //TO-DO: include game logo in
        this.load.image('preloadBar','assets/preloader.png');
    },
    
    create:function(){
        //loading screen will have a white background
        this.game.stage.backgroundColor = '#fff';
        
        //scaling options
	    this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
	    this.scale.minWidth = 240;
	    this.scale.minHeight = 170;
	    this.scale.maxWidth = 800;
	    this.scale.maxHeight = 600;
        
        //have the game centered horizontally
	    //this.scale.pageAlignHorizontally = true;
 
	    //screen size will be set automatically
	    //this.scale.setScreenSize(true);
 
	    //physics system for movement
	    this.game.physics.startSystem(Phaser.Physics.ARCADE);
        
        this.state.start('Preload');
    }
}

