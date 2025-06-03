class Load extends Phaser.Scene {
    constructor() {
        super("loadScene");
    }

    preload() {
        this.load.setPath("./assets/");

        // Load characters spritesheet
        this.load.spritesheet("playerIdle", "playerIdle.png", {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet("playerRun", "playerRun.png", {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet("playerJump", "playerJump.png", {
            frameWidth: 48,
            frameHeight: 48
        });
        this.load.spritesheet("playerWallSlide", "playerWallSlide.png", {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.spritesheet("playerPogoslash", "playerPogoslash.png", { frameWidth: 80, frameHeight: 64 });
        this.load.image("legs_up", "legs_up_-_Pogoslash.png");
        this.load.image("legs_down", "legs_down_-_Pogoslash.png");
        this.load.image("legs_max", "legs_max_-_Pogoslash.png");

        this.load.spritesheet("playerDash", "playerDash.png", {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.spritesheet("playerSlide", "playerSlide.png", {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.spritesheet("playerCrouch", "playerCrouch.png", {
            frameWidth: 48,
            frameHeight: 48
        });

        this.load.audio("collectibleSound", "collectible.wav",{
            loop: false,
            volume: 0.5
        });

        // Load tilemap information
        this.load.spritesheet("tilemap_tiles", "monochrome_tilemap_packed.png", {
            frameWidth: 16,
            frameHeight: 16
            // You can also add 'endFrame: 399' if you want to be explicit,
            // as your Tiled map indicates a tilecount of 400 (frames 0-399).
            // Phaser usually figures this out if margin and spacing are 0.
        });                         // Packed tilemap
        this.load.tilemapTiledJSON("playground", "1bit_playground.tmj");   // Tilemap in JSON
    }

    create() {
        let graphics = this.add.graphics();
        graphics.fillStyle(0xffffff, 1); // White color
        // You can adjust the size; 3x3 or 4x4 is usually good for small, crisp particles
        graphics.fillRect(0, 0, 3, 3);
        graphics.generateTexture('whitePixelParticle', 3, 3);
        graphics.destroy(); // Clean up the graphics object
        
        this.anims.create({
            key: 'run',
            frames: this.anims.generateFrameNumbers("playerRun", { start: 0, end: 7 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers("playerIdle", { start: 0, end: 9 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'jump',
            frames: this.anims.generateFrameNumbers("playerJump", { start: 0, end: 5 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'wallSlide',
            frames: this.anims.generateFrameNumbers("playerWallSlide", { start: 0, end: 2 }), // Assuming 3 frames for wall slide
            frameRate: 3,
            repeat: -1
        });

        this.anims.create({
            key: 'pogoslash1',
            frames: this.anims.generateFrameNumbers('playerPogoslash', { start: 0, end: 4 }),
            frameRate: 12,
            repeat: 0
        });
        
        this.anims.create({
            key: 'pogoslash2',
            frames: this.anims.generateFrameNumbers('playerPogoslash', { start: 5, end: 6 }),
            frameRate: 12,
            repeat: 0
        });

        this.anims.create({
            key: 'dash',
            frames: this.anims.generateFrameNumbers("playerDash", { start: 0, end: 8 }),
            frameRate: 20,
            repeat: 0
        });

        this.anims.create({
            key: 'slide',
            frames: this.anims.generateFrameNumbers("playerSlide", { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'crouch',
            frames: this.anims.generateFrameNumbers("playerCrouch", { start: 0, end: 9 }),
            frameRate: 8,
            repeat: -1
        });
         // ...and pass to the next Scene
         this.scene.start("level1Scene");
    }

    // Never get here since a new scene is started in create()
    update() {
    }
}
