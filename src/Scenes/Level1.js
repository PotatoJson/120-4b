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

        //checkpoint system
        this.lastCheckpoint = { x: 0, y: 0 };
    }

    create() {
        // --- Level Specific Setup ---
        this.map = this.add.tilemap("playground", 16, 16, 100, 60); // Level 1 map
        this.tileset = this.map.addTilesetImage("monochrome_tilemap_packed", "tilemap_tiles"); //
        this.backgroundLayer = this.map.createLayer("Background", this.tileset, 0, 0).setScale(2.0).setDepth(0); //
        this.groundLayer = this.map.createLayer("Ground&Platforms", this.tileset, 0, 0).setScale(2.0); //
        this.semiSolidLayer = this.map.createLayer("SemiSolidPlatforms", this.tileset, 0, 0).setScale(2.0); //
        this.semiSolidLayer.setCollisionByProperty({ isSemiSolid: true }); // Enable collision for semi-solid platforms
        this.groundLayer.setCollisionByProperty({ collides: true }); //
        this.groundLayer.setDepth(10); //

        // Set world bounds based on the current map
        this.physics.world.setBounds(0, 0, this.map.widthInPixels * this.groundLayer.scaleX, this.map.heightInPixels * this.groundLayer.scaleY); //
        this.cameras.main.setBounds(0, 0, this.map.widthInPixels * this.groundLayer.scaleX, (this.map.heightInPixels * this.groundLayer.scaleY) - 320); //

        // --- Player Creation ---
        // Determine player's starting position for this level (e.g., from Tiled object layer or hardcoded)
        this.playerStartX = 20;
        this.playerStartY = 1835; // Assuming player starts on the ground layer
        // this.playerStartX = 1600; // Example starting X position
        // this.playerStartY = 0; // Example starting Y position (on the ground layer)
        this.player = new Player(this, this.playerStartX, this.playerStartY); // Pass `this` (the scene)

        // Set initial checkpoint to player's starting position
        this.lastCheckpoint.x = this.playerStartX;
        this.lastCheckpoint.y = this.playerStartY;

        // --- Camera ---
        this.cameras.main.startFollow(this.player.physicsSprite, true, 0.1, 0.1); // Follow the player's physics sprite
        this.cameras.main.setZoom(1.0); // Set camera zoom level
        this.cameras.main.setRoundPixels(true); // Ensure pixel-perfect rendering
        


        // --- Level Specific Objects (Spikes, Collectibles, Checkpoints) ---
        this.spikeGroup = this.physics.add.staticGroup(); //
        this.collectiblesGroup = this.physics.add.group({ allowGravity: false }); //
        this.checkpointGroup = this.physics.add.staticGroup();
        this.refreshCrystalGroup = this.physics.add.group({ allowGravity: false });


        // --- Colliders ---
        this.physics.add.collider(this.player.physicsSprite, this.groundLayer); // Collider with player's physics body
        this.physics.add.overlap(this.player.attackHitbox, this.spikeGroup, this.handlePogoHit, null, this); // handle pogo collision checks within the level scene.
        this.physics.add.collider(this.player.physicsSprite, this.spikeGroup, this.handlePlayerSpikeCollision, null, this); // Player damage collision (player body vs spikes)
        this.physics.add.collider(this.player.physicsSprite, this.semiSolidLayer, null, this.processSemiSolidCollision, this);
        this.physics.add.overlap(this.player.physicsSprite, this.checkpointGroup, this.activateCheckpoint, null, this);
        this.physics.add.overlap(this.player.physicsSprite, this.refreshCrystalGroup, this.handleRefreshCrystalOverlap, null, this);


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
                    endZone.setScale(1);
                    endZone.setOffset(0, -scaledHeight - 140 ); // Adjust offset to match the Tiled object
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
                // --- Checkpoint Object ---
                else if (obj.name === "Checkpoint") {
                    // Assuming checkpoint origin is top-left in Tiled
                    // We'll use the object's (x,y) as the respawn point.
                    // You might want to use a visual sprite, or just an invisible zone.
                    // For an invisible zone:
                    let checkpointZone = this.checkpointGroup.create(scaledX, scaledY, null) // No texture
                        .setOrigin(0, 0) // Top-left origin for the zone
                        .setVisible(false) // Invisible
                        .setPushable(false)
                        .setScale(layerScale); // Not pushable
                    checkpointZone.body.setSize(scaledWidth, scaledHeight); // Set its physics size
                    checkpointZone.body.setOffset(16, -50); // No offset, matches the Tiled object
                    // Store its intended respawn position (which is its top-left corner)
                    // The player's respawn method will place the player's physicsSprite center there.
                    // If you want the player to stand ON TOP of a checkpoint visual,
                    // you'd adjust the Y coordinate based on player height and checkpoint visual.
                    // For simplicity, we'll use the checkpoint's (scaledX, scaledY) as the direct respawn point.
                    checkpointZone.setData('respawnX', scaledX);
                    checkpointZone.setData('respawnY', scaledY);

                    // Optional: If you want a visual cue for the checkpoint
                    // let checkpointSprite = this.checkpointGroup.create(scaledX + scaledWidth / 2, scaledY + scaledHeight / 2, 'yourCheckpointSpriteKey');
                    // checkpointSprite.setData('respawnX', scaledX + scaledWidth / 2); // Center respawn
                    // checkpointSprite.setData('respawnY', scaledY + scaledHeight);   // Bottom-center respawn
                    // checkpointSprite.refreshBody(); // if you setSize after creation
                }
                else if (obj.name === "RefreshCrystal") {
                    let crystalCenterX = scaledX + (scaledWidth / 2); let crystalCenterY = scaledY + (scaledHeight / 2);
                    let crystal = this.refreshCrystalGroup.create(crystalCenterX, crystalCenterY, 'tilemap_tiles', 22); 
                    crystal.setOrigin(0.5, 0.5).setScale(layerScale); 
                    crystal.setData('respawnTime', 2000);                }
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

    activateCheckpoint(playerPhysicsSprite, checkpointSprite) {
        const newCheckpointX = checkpointSprite.getData('respawnX');
        const newCheckpointY = checkpointSprite.getData('respawnY');

        // Only update and provide feedback if it's a new checkpoint
        if (this.lastCheckpoint.x !== newCheckpointX || this.lastCheckpoint.y !== newCheckpointY) {
            this.lastCheckpoint.x = newCheckpointX;
            this.lastCheckpoint.y = newCheckpointY;

            console.log(`Checkpoint activated at: (${this.lastCheckpoint.x}, ${this.lastCheckpoint.y})`);

            // Optional: Provide feedback
            // this.sound.play('checkpointSound'); // Add a sound
            checkpointSprite.setTint(0x00ff00); // Tint it green
            // To make it one-time activatable, you could disable its body:
            // checkpointSprite.disableBody(true, false); // Keeps it visible but non-interactive
            // Or destroy it if you don't need it anymore:
            // checkpointSprite.destroy();
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
        playerInstance.respawn(this.lastCheckpoint.x, this.lastCheckpoint.y);
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

    handleRefreshCrystalOverlap(playerPhysicsSprite, crystal) {
        const player = this.player; 

        player.canDash = true;        // Refresh dash cooldown
        player.hasAirDashed = false;  // Allow another air dash
        player.canAirJump = true;     // Grant the crystal-powered air jump

        console.log("Player touched RefreshCrystal: Dash & Air Dash refreshed! Crystal Air Jump ENABLED!");
        
        // ... (crystal despawn and respawn logic remains the same as your previous implementation) ...
        crystal.disableBody(true, true); 
        const respawnTime = crystal.getData('respawnTime');
        this.time.delayedCall(respawnTime, () => {
            if (crystal && crystal.scene) { 
                // console.log(`Attempting to respawn crystal: ${crystal.name}`);
                
                // enableBody will set the crystal to active and visible if the last two arguments are true.
                // It also re-enables its physics body and places it at the specified x, y.
                crystal.enableBody(true, crystal.x, crystal.y, true, true);
                
                // If your crystals are Arcade Sprites and should not fall with gravity:
                if (crystal.body && typeof crystal.body.setAllowGravity === 'function') {
                    crystal.body.setAllowGravity(false);
                }
                // console.log(`Crystal ${crystal.name} respawned. Active: ${crystal.active}, Visible: ${crystal.visible}`);
            } else {
                // console.warn("RefreshCrystal: Could not respawn. Crystal object no longer valid or removed from scene.");
            }
        }, [], this);
    }

    handleCollectItem(playerPhysicsSprite, collectibleObject) { //
        console.log("Collectible picked up!"); //
        collectibleObject.disableBody(true, true); //
        // Add score, sound, etc.
        this.sound.play("collectibleSound"); // Play sound effect
        this.collectiblesGathered++;


    }


    processSemiSolidCollision(playerSprite, tile) {
        const player = this.player; // Reference to your Player class instance
        const playerBody = playerSprite.body;
        const tilemapLayer = tile.tilemapLayer; // The TilemapLayer the tile belongs to

        // --- 1. PRIORITIZED: Holding Down + Jump to fall through ---
        // If player is actively holding the key combination, always ignore semi-solid platforms.
        if (player.isHoldingFallThroughKeys) {
            // console.log("ProcessCollision: Player actively holding Down+Jump. IGNORING.");
            return false; // Ignore collision
        }

        // --- 2. Timed Drop-Through (e.g., from a "tap") ---
        // If player is in the "dropping through" state (usually after a tap-to-drop).
        if (player.isDroppingThrough) {
            if (this.time.now < player.timeToStopDropping) {
                // console.log("ProcessCollision: Player in timed 'isDroppingThrough' state. IGNORING.");
                return false; // Continue ignoring collision while timer is active
            } else {
                player.isDroppingThrough = false; // Timer expired, reset flag
                // console.log("ProcessCollision: Timed 'isDroppingThrough' state ENDED.");
            }
        }

        // --- 3. Initiating a "Tap-to-Drop" ---
        // 'isAttemptingDropThrough' is set true by PlayerStates for one frame on Down + JustDown(Jump).
        const recentlyBlockedDown = (playerBody.blocked.down ||
                                    (this.time.now - player.timeLastBlockedDown < player.DROP_BLOCKED_DOWN_GRACE_PERIOD));

        if (player.isAttemptingDropThrough && recentlyBlockedDown) {
            const tileTopWorldY = tile.pixelY * tilemapLayer.scaleY;
            // Ensure player is reasonably "on top" of this specific platform to drop from it.
            const onThisTileThreshold = 4 * tilemapLayer.scaleY; // Adjust tolerance as needed

            if (Math.abs(playerBody.bottom - tileTopWorldY) < onThisTileThreshold) {
                // console.log("%cProcessCollision: Tap-to-Drop INITIATED.", "color: green; font-weight: bold;");
                player.isDroppingThrough = true;
                player.timeToStopDropping = this.time.now + 250; // Duration (ms) to ignore platforms after a tap
                // player.isAttemptingDropThrough is reset in Player.update() for the next frame
                playerBody.y += 2; // A small nudge can help disengage from the platform
                return false;      // Ignore collision to start dropping
            }
        }

        // --- 4. Standard Semi-Solid Behavior (Land on Top, Pass Through From Below/Side) ---
    // This applies only if not holding fall-through keys and not in an active timed drop.
    const tileTopWorldY = tile.pixelY * tilemapLayer.scaleY; //
    // Tolerance for landing: player's feet must be within this range above or at the platform's top.
    const landingTolerance = 4 * tilemapLayer.scaleY; //

    if (playerBody.velocity.y >= 0 && // Player is moving downwards or stationary (gravity will act)
        playerBody.bottom <= tileTopWorldY + landingTolerance) { // Player's feet are at or slightly above the platform top

        // Additional check to prevent "snapping up" when walking into the side of a platform.
        // Ensures player was above the platform in the previous frame to confirm a downward landing.
        const prevFramePlayerBottom = playerBody.prev.y + playerBody.height; // <<< CORRECTED LINE

        if (prevFramePlayerBottom <= tileTopWorldY) { //
            // console.log("ProcessCollision: Standard LANDING on semi-solid platform.");
            return true; // Allow collision (player lands on the platform)
        }
    }

    // console.log("ProcessCollision: Default PASS-THROUGH (from below/side or not meeting landing criteria).");
    return false; // Otherwise, ignore collision (player passes through)
    }

    
}
