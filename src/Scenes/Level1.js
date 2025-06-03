class Level1 extends Phaser.Scene {
    constructor() {
        super("level1Scene"); // Unique key for this level
    }

    init() {
        // Global physics settings can stay here or move to a game config file
        this.physics.world.gravity.y = 1500;
        this.physics.world.TILE_BIAS = 32; //

        // Initialize stats for the current level attempt
        this.playerDeaths = 0;
        this.collectiblesGathered = 0;
        this.totalCollectiblesInLevel = 3;
        this.levelStartTime = 0; // Initialize start time

        // console.log("Level1 init: Stats reset.");
    }

    create() {
        // --- Level Specific Setup ---
        this.map = this.add.tilemap("playground", 16, 16, 100, 60); // Level 1 map
        this.tileset = this.map.addTilesetImage("monochrome_tilemap_packed", "tilemap_tiles"); //
        this.backgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0).setScale(2.0).setDepth(0); //
        this.groundLayer = this.map.createLayer("Ground&Platforms", this.tileset, 0, 0).setScale(2.0); //
        this.groundLayer.setCollisionByProperty({ collides: true }); //
        this.groundLayer.setDepth(10); //

        // Set world bounds based on the current map
        this.physics.world.setBounds(0, 0, this.map.widthInPixels * this.groundLayer.scaleX, this.map.heightInPixels * this.groundLayer.scaleY); //
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * this.groundLayer.scaleX, this.map.heightInPixels * this.groundLayer.scaleY); //

        // --- Player Creation ---
        // Determine player's starting position for this level (e.g., from Tiled object layer or hardcoded)
        this.playerStartX = 20;
        this.playerStartY = 1850; // Assuming player starts on the ground layer
        // this.playerStartX = 1600; // Example starting X position
        // this.playerStartY = 0; // Example starting Y position (on the ground layer)
        this.player = new Player(this, this.playerStartX, this.playerStartY); // Pass `this` (the scene)


        // --- Camera ---
        this.cameras.main.startFollow(this.player.physicsSprite, true, 0.1, 0.1); // Follow the player's physics sprite

        // --- Level Specific Objects (Spikes, Collectibles) ---
        this.spikeGroup = this.physics.add.staticGroup(); //
        this.collectiblesGroup = this.physics.add.group({ allowGravity: false }); //

        // --- Colliders ---
        this.physics.add.collider(this.player.physicsSprite, this.groundLayer); // Collider with player's physics body
        this.physics.add.overlap(this.player.attackHitbox, this.spikeGroup, this.handlePogoHit, null, this); // handle pogo collision checks within the level scene.
        this.physics.add.collider(this.player.physicsSprite, this.spikeGroup, this.handlePlayerSpikeCollision, null, this); // Player damage collision (player body vs spikes)

        // Record level start time *after* main setup and player creation
        this.levelStartTime = this.time.now; // Phaser's scene time in milliseconds
        console.log(`Level timer started at: ${this.levelStartTime}ms (scene time)`);

        // --- Debug Mode Setup ---
        this.debugKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

        // Enable physics debug drawing capabilities for the world.
        // If your game config's arcade: { debug: true } is set, this line might reinforce it.
        // If arcade: { debug: false } or not set, this ensures the debug system is active.
        this.physics.world.drawDebug = true;
        // But start with the debug visuals OFF.
        this.physics.world.debugGraphic.setVisible(false);

        // --- Display Controls (World Space, Background Element) ---
        const controlStyle = {
            fontSize: '16px',
            fill: '#FFFFFF',
            fontFamily: 'Arial, sans-serif', // Consider using a game-specific font if you have one loaded
            stroke: '#000000',
            strokeThickness: 3
        };

        // Position controls in the world, near the player's spawn point's bottom-left.
        // Player spawns at this.playerStartX, this.playerStartY.
        // We'll place the text slightly to the right and below the direct spawn point.
        const textBlockX = this.playerStartX ; // X position in the world
        const textBlockBottomY = this.playerStartY - 90; // Y position in the world for the bottom line of text

        const lineHeight = 22;
        let currentTextY = textBlockBottomY; // Start from this Y and stack text upwards

        const controlsDepth = 5; // Render behind player (20) and ground (10), but above far background (0)

        this.add.text(textBlockX, currentTextY, "D: Toggle Debug", controlStyle)
            .setOrigin(0, 1) // Bottom-left origin for easy stacking from bottom up
            // .setScrollFactor(0) // REMOVED - Text will now scroll with the camera
            .setDepth(controlsDepth);

        currentTextY -= lineHeight;
        this.add.text(textBlockX, currentTextY, "C: Dash", controlStyle)
            .setOrigin(0, 1)
            .setDepth(controlsDepth);

        currentTextY -= lineHeight;
        this.add.text(textBlockX, currentTextY, "X: Pogo Slash", controlStyle)
            .setOrigin(0, 1)
            .setDepth(controlsDepth);

        currentTextY -= lineHeight;
        this.add.text(textBlockX, currentTextY, "Z: Jump", controlStyle)
            .setOrigin(0, 1)
            .setDepth(controlsDepth);

        currentTextY -= lineHeight;
        this.add.text(textBlockX, currentTextY, "Arrow Keys: Move", controlStyle)
            .setOrigin(0, 1)
            .setDepth(controlsDepth);

        currentTextY -= (lineHeight + 5); // Extra space for the title
        this.add.text(textBlockX, currentTextY, "Controls:", { ...controlStyle, fontSize: '18px' })
            .setOrigin(0, 1)
            .setDepth(controlsDepth);
        // --- End Display Controls ---

        const objectLayer = this.map.getObjectLayer('Spikes&Objects'); //
        const layerScale = this.groundLayer.scaleX; //

        if (objectLayer) {
            objectLayer.objects.forEach(obj => { //
                const scaledX = obj.x * layerScale; //
                const scaledY = obj.y * layerScale; //
                const scaledWidth = obj.width * layerScale; //
                const scaledHeight = obj.height * layerScale; //

                if (obj.name === "Spikes") { //
                    const spikeCollider = this.spikeGroup.create(scaledX, scaledY, null) //
                        .setOrigin(0, 0) //
                        .setVisible(false) //
                        .setPushable(false); //
                    spikeCollider.body.setSize(scaledWidth, scaledHeight); //
                    spikeCollider.body.setOffset(16,16); // Adjust as needed
                    spikeCollider.pogoable = obj.properties?.find(p => p.name === 'pogoable')?.value ?? true; //
                } else if (obj.name === "Collectible") { //
                    let collectibleCenterX = scaledX + (scaledWidth / 2); //
                    let collectibleCenterY = scaledY + (scaledHeight / 2); //
                    let collectible = this.collectiblesGroup.create(collectibleCenterX, collectibleCenterY, 'tilemap_tiles', 82); //
                    collectible.setOrigin(0.5, 1.5).setScale(layerScale); //
                    this.physics.add.overlap(this.player.physicsSprite, collectible, this.handleCollectItem, null, this); // Changed to player.physicsSprite
                }
                 // Add an object for "LevelEnd" or similar
                else if (obj.name === "LevelEnd") {
                    let endZone = this.physics.add.sprite(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2)
                        .setSize(scaledWidth, scaledHeight)
                        .setVisible(false); // Make it invisible or use a visual cue
                    endZone.body.setAllowGravity(false);
                    endZone.setOrigin(0.5, 1.5); // Center the end zone
                    this.physics.add.overlap(this.player.physicsSprite, endZone, () => { //
                        const levelEndTime = this.time.now; // Get current time
                        const timeTakenMs = levelEndTime - this.levelStartTime; // Calculate duration

                        console.log("Reached end of level 1!"); //
                        console.log(`Level complete with Deaths: ${this.playerDeaths}, Collectibles: ${this.collectiblesGathered}/${this.totalCollectiblesInLevel}`);
                        this.scene.start("summaryScene", {
                            deaths: this.playerDeaths,
                            collectibles: this.collectiblesGathered,
                            totalCollectibles: this.totalCollectiblesInLevel,
                            levelKey: "level1Scene", // So the summary scene knows which level was just played
                            // nextLevelKey: "level2Scene" // So the summary scene knows where to go next
                            isEndOfGame: true, // Add a flag to indicate it's the end
                            timeTakenMs: timeTakenMs
                        });
                    }, null, this); //
                }
            });
        }
    }

    update(time, delta) {
        this.player.update(time, delta); // Call the player's update method
        // Any other level-specific updates

        if (Phaser.Input.Keyboard.JustDown(this.debugKey)) {
            const currentVisibility = this.physics.world.debugGraphic.visible;
            this.physics.world.debugGraphic.setVisible(!currentVisibility);
            console.log(`Physics Debug Mode: ${!currentVisibility ? 'ON' : 'OFF'}`);
        }
    }

    handlePlayerSpikeCollision(playerPhysicsSprite, spike) {
        const playerInstance = this.player;
        // Check if the player might be immune (e.g., recently respawned, dashing through if you implement such a feature)
        // For now, any body touch is damage.

        this.playerDeaths++;


        // Prevent respawn if player is already in a "death" or "respawning" state if you add one.
        // if (playerInstance.isInvulnerable || playerInstance.stateMachine.currentState instanceof DeadState) return;
        console.log('[Spike Collision] Attempting respawn with X:', this.playerStartX, 'Y:', this.playerStartY);

        console.log("Player collided with spike. Respawning.");
        // You could add a small delay, screen flash, or sound effect here.
        // e.g., this.cameras.main.flash(250, 255, 0, 0);
        //       this.sound.play('playerDeathSound');
        playerInstance.respawn(this.playerStartX, this.playerStartY);
    }

    handlePogoHit(attackHitbox, target) { // attackHitbox is player's, target is spike
        // Ensure player is in AirAttackState
        if (!(this.player.stateMachine.currentState instanceof AirAttackState)) return; //

        const playerBottom = this.player.physicsSprite.body.bottom; //
        const targetTop = target instanceof Phaser.Tilemaps.Tile ? target.pixelY * this.groundLayer.scaleY : target.getBounds().top; //
        const isPogoable = target.properties?.pogoable || target.pogoable === true; //

        if (isPogoable) { //
            this.player.attackHitbox.setVisible(false).body.setEnable(false); //
            this.player.physicsSprite.setVelocityY(this.player.POGO_VELOCITY); //
            this.player.hasAirDashed = false; //

            const currentState = this.player.stateMachine.currentState; //
            if (currentState.attackTimer) currentState.attackTimer.remove(); //
            this.player.stateMachine.transition('jump'); //
        }
    }

    handleCollectItem(playerPhysicsSprite, collectibleObject) { //
        console.log("Collectible picked up!"); //
        collectibleObject.disableBody(true, true); //
        // Add score, sound, etc.
        this.sound.play("collectibleSound"); // Play sound effect
        this.collectiblesGathered++;


    }
}