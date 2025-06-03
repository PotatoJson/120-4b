class Player extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        // The physics body will be a separate, invisible sprite.
        // The container (this Player class instance) will follow this physics sprite.
        let physicsSprite = scene.physics.add.sprite(x, y, '__WHITE').setVisible(false);
        physicsSprite.body.setSize(25, 50).setOffset(-10, -64); // From your original code
        physicsSprite.setCollideWorldBounds(true);

        // Initialize the container at the physics body's position
        super(scene, physicsSprite.x, physicsSprite.y);
        scene.add.existing(this); // Add this container to the scene's display list

        this.scene = scene;
        this.physicsSprite = physicsSprite; // Reference to the physics-enabled sprite
        this.physics = this.physicsSprite;

        // --- Player Constants (from Platformer.init and player object) ---
        this.MAX_SPEED = 350; //
        this.DRAG = 1000; //
        this.JUMP_VELOCITY = -700 //
        this.POGO_VELOCITY = -700; //
        this.POGO_AIR_CONTROL_SPEED = 320; //
        this.AIR_SPEED = 325; //
        this.WALL_SLIDE_SPEED = 100; //
        this.WALL_JUMP_X_VELOCITY = 400; //
        this.WALL_JUMP_Y_VELOCITY = -700; //
        this.AIR_DASH_SPEED = 700; //
        this.DASH_SPEED = 700; //
        this.DASH_DURATION = 250; //
        this.DASH_COOLDOWN = 400; //
        this.WALL_JUMP_ACTION_DELAY = 150; //
        this.WALL_JUMP_GROUND_CHECK_DELAY = 60; //
        this.COYOTE_TIME_DURATION = 100; //
        this.JUMP_BUFFER_DURATION_CONST = 1000; //
        this.DASH_BUFFER_DURATION_CONST = 100; //
        this.playerScale = 2.0; //
        this.CROUCH_SLIDE_VELOCITY_FROM_IDLE = 0; // pixels/sec for the short slide from idle
        this.CROUCH_SLIDE_DURATION_FROM_IDLE = 0; // milliseconds for the short slide timer
        this.RUN_TO_CROUCH_SLIDE_DAMPING = 0.8;    // Factor to reduce running speed on crouch entry (e.g., 70%)
        this.CROUCH_SLIDE_DRAG = 300;             // Higher drag to slow down the slide from run
        this.MIN_CROUCH_SLIDE_SPEED = 150;          // Speed below which the run-to-crouch slide stops

        // --- Player Sprites (visual components) ---
        // These are added to this container, so their positions are relative to the container's origin (0,0)
        this.fullSprite = scene.add.sprite(0, 0, 'playerIdle').setOrigin(0.5, 1); //
        this.legsSprite = scene.add.sprite(0, 0, 'legs_down').setOrigin(0.5, 1).setVisible(false); //
        this.upperSprite = scene.add.sprite(0, 0, 'playerPogoslash').setOrigin(0.5, 1).setVisible(false); //
        this.add([this.legsSprite, this.fullSprite, this.upperSprite]); // Add sprites to this container

        this.normalBodySize = { width: 25, height: 50, offsetX: -10, offsetY: -64 };
        this.crouchBodySize = { width: 25, height: 30, offsetX: -10, offsetY: -44 };
        this.dashBodySize = { width: 25, height: 40, offsetX: -10, offsetY: -60 };

        this.setScale(this.playerScale); //
        this.setDepth(20); //

        // --- Attack Hitbox ---
        // This hitbox is also managed by the scene's physics, but positioned by the player.
        this.attackHitbox = scene.physics.add.sprite(0, 0, '__WHITE').setVisible(false).setSize(40, 60).setOrigin(0.5, 0); //
        this.attackHitbox.body.setAllowGravity(false); //
        this.attackHitbox.body.setEnable(false); //
        // Note: The scene will need to add overlaps for this hitbox.

        // --- Player State Properties ---
        this.isDashing = false; //
        this.canDash = true; //
        this.hasAirDashed = false; //
        this.isSliding = false; //
        this.isCrouching = false; //
        this.canWallJump = false; //
        this.lastWallSide = null; //
        this.wallJumpGraceTimer = 0; //
        this.jumpBeingHeld = false; //
        this.jumpCutoff = false; //
        this.wallContactGracePeriodDuration = 50; //
        this.timeLostWallContact = 0; //
        this.dashAwayFromWallDirection = 0; //
        this.wallJumpActionDelayTimer = 0; //
        this.wallJumpGroundCheckDelayTimer = 0; //
        this.timeLastGrounded = 0; //
        this.jumpBufferTimer = 0; //
        this.dashBufferTimer = 0; //
        this.JUMP_BUFFER_DURATION = this.JUMP_BUFFER_DURATION_CONST; //
        this.DASH_BUFFER_DURATION = this.DASH_BUFFER_DURATION_CONST; //
        this.wasAirborne = false; //

        // --- Input Handling ---
        this.cursors = scene.input.keyboard.createCursorKeys(); //
        this.jumpKey = scene.input.keyboard.addKey('Z'); //
        this.pogoKey = scene.input.keyboard.addKey('X'); //
        this.dashKey = scene.input.keyboard.addKey('C'); //

        // --- Particle Emitter References ---
        this.jumpParticlesEmitter = null; //
        this.landingParticlesEmitter = null; //
        this.runParticlesEmitter = null; //
        this.idleParticlesEmitter = null; //
        this.initParticles(); // Call initialization

        // --- State Machine ---
        // The StateMachine will need access to this Player instance.
        // Ensure your StateMachine class and individual state classes are designed to accept the player instance
        // (e.g., new StateMachine('idle', { ...states }, thisPlayerInstance))
        this.stateMachine = new StateMachine('idle', {
            idle: IdleState,
            run: RunState,
            jump: JumpState,
            airAttack: AirAttackState,
            wallSlide: WallSlideState,
            wallJump: WallJumpState,
            groundDash: GroundDashState,
            airDash: AirDashState,
            crouch: CrouchState,
        }, this); // Pass this Player instance as context to the StateMachine

        // --- Physics Body Setup for the physicsSprite ---
        this.physicsSprite.body.setDragX(this.DRAG);
        // Set a sensible max Y velocity if not already handled by gravity alone
        this.physicsSprite.setMaxVelocity(this.MAX_SPEED, 1500); // Adjust Y maxV as needed
    }

    initParticles() {
        const particleTextureKey = 'whitePixelParticle'; //

        this.jumpParticlesEmitter = this.scene.add.particles(0, 0, particleTextureKey, { //
            speed: 70, //
            angle: { min: 220, max: 320 }, //
            scale: { start: 6, end: 0 }, //
            alpha: { start: 0.8, end: 0 }, //
            gravityY: -100, //
            lifespan: { min: 300, max: 600 }, //
            quantity: 10, //
            frequency: 30, //
            duration: 1, //
            blendMode: 'ADD', //
            tint: 0xffffff, //
        });
        this.jumpParticlesEmitter.stop(); // Emitters should usually start stopped

        this.landingParticlesEmitter = this.scene.add.particles(0, 0, particleTextureKey, { //
            speed: { min: 30, max: 120 }, //
            angle: { min: 200, max: 360 }, //
            scale: { start: 3, end: 0 }, //
            lifespan: { min: 250, max: 500 }, //
            quantity: 1, //
            frequency: -1, // Stop it from emitting automatically
            blendMode: 'ADD' //
        });
        this.landingParticlesEmitter.stop();


        this.runParticlesEmitter = this.scene.add.particles(0, 0, particleTextureKey, { //
            speed: { min: 50, max: 70 }, //
            angle: () => { //
                if (this.scaleX > 0) { // Player container facing right
                    return Phaser.Math.Between(135, 225); //
                } else { // Player container facing left
                    return Phaser.Math.Between(-45, 45); //
                }
            },
            scale: { start: 2, end: 0 }, //
            lifespan: { min: 1000, max: 1500 }, //
            gravityY: -30, //
            quantity: 1, //
            frequency: 70, //
            blendMode: 'ADD' //
        });
        this.runParticlesEmitter.stop(); //

        this.idleParticlesEmitter = this.scene.add.particles(0, 0, particleTextureKey, { //
            speed: { min: 10, max: 30 }, //
            angle: { min: 250, max: 290 }, //
            scale: { start: 0.6, end: 0 }, //
            lifespan: { min: 600, max: 1200 }, //
            quantity: 1, //
            frequency: 1500, //
            blendMode: 'ADD' //
        });
        this.idleParticlesEmitter.stop(); //

        const particleDepth = 5; //
        if (this.jumpParticlesEmitter) this.jumpParticlesEmitter.setDepth(21); //
        if (this.landingParticlesEmitter) this.landingParticlesEmitter.setDepth(21); //
        if (this.runParticlesEmitter) this.runParticlesEmitter.setDepth(particleDepth); //
        if (this.idleParticlesEmitter) this.idleParticlesEmitter.setDepth(particleDepth); //
    }

    emitJumpParticles() {
        if (!this.jumpParticlesEmitter) return; //
        const x = this.physicsSprite.x; // Use physicsSprite for position
        const y = this.physicsSprite.body.bottom; // Use physicsSprite for position
        this.jumpParticlesEmitter.setPosition(x, y); //
        this.jumpParticlesEmitter.explode(Phaser.Math.Between(5, 8)); //
    }

    emitLandingParticles() {
        if (!this.landingParticlesEmitter) return; //
        const x = this.physicsSprite.x; // Use physicsSprite for position
        const y = this.physicsSprite.body.bottom; // Use physicsSprite for position
        this.landingParticlesEmitter.setPosition(x, y); //
        this.landingParticlesEmitter.explode(Phaser.Math.Between(6, 10)); //
    }

    startRunParticles() {
        if (!this.runParticlesEmitter || this.runParticlesEmitter.emitting) return; //
        // Use this.scaleX for container's facing direction
        const dir = this.scaleX > 0 ? 1 : -1; //
        // Position relative to physicsSprite
        const emitterX = this.physicsSprite.x - (dir * this.physicsSprite.displayWidth * 0.10); //
        const emitterY = this.physicsSprite.body.bottom; //
        this.runParticlesEmitter.setPosition(emitterX, emitterY); //
        this.runParticlesEmitter.start(); //
    }

    stopRunParticles() {
        if (!this.runParticlesEmitter || !this.runParticlesEmitter.emitting) return; //
        this.runParticlesEmitter.stop(); //
    }

    startIdleParticles() {
        if (!this.idleParticlesEmitter || this.idleParticlesEmitter.emitting) return; //
        const emitterY = this.physicsSprite.body.bottom - 2; //
        this.idleParticlesEmitter.setPosition(this.physicsSprite.x, emitterY); //
        this.idleParticlesEmitter.start(); //
    }

    stopIdleParticles() {
        if (!this.idleParticlesEmitter || !this.idleParticlesEmitter.emitting) return; //
        this.idleParticlesEmitter.stop(); //
    }

    setFacingDirection(dir, force = false) {
        if (!force && (this.isSliding || this.isDashing)) { //
            return; //
        }
        if (dir === 0) return; //

        // this.scaleX refers to the container's scale
        this.scaleX = dir > 0 ? this.playerScale : -this.playerScale; //
        // this.scaleY remains this.playerScale, assuming not changed by direction
    }

    shouldWallSlide() {
        if (this.isDashing) return false; //
        const body = this.physicsSprite.body; // Check physicsSprite's body
        const onWall = body.blocked.left || body.blocked.right; //
        const pressingIntoWall = (body.blocked.left && this.cursors.left.isDown) || //
                                (body.blocked.right && this.cursors.right.isDown); //
        if (onWall && !body.blocked.down && body.velocity.y > 0 && pressingIntoWall) { //
            const worldBounds = this.scene.physics.world.bounds;
            const epsilon = 2; // A small tolerance for floating point comparisons

            // Check for left world boundary
            if (body.blocked.left && body.left <= worldBounds.left + epsilon) {
                // console.log("Wall slide prevented: At left world boundary.");
                return false; // Player is at the left world boundary
            }

            // Check for right world boundary
            if (body.blocked.right && body.right >= worldBounds.right - epsilon) {
                // console.log("Wall slide prevented: At right world boundary.");
                return false; // Player is at the right world boundary
            }
            return true; // It's a valid wall (tile) for sliding
        }
        return false;
    }

    respawn(x, y) {
        this.physicsSprite.setVelocity(0, 0);
        this.physicsSprite.setPosition(x, y);

        // Reset core state variables
        this.isDashing = false; //
        this.canDash = true; // Reset dash availability
        this.hasAirDashed = false; //
        this.isSliding = false; //
        this.canWallJump = false; //
        this.lastWallSide = null; //
        this.wallJumpGraceTimer = 0; //
        this.jumpBeingHeld = false; //
        this.jumpCutoff = false; //
        this.timeLostWallContact = 0; //
        this.dashAwayFromWallDirection = 0; //
        this.wallJumpActionDelayTimer = 0; //
        this.wallJumpGroundCheckDelayTimer = 0; //
        this.timeLastGrounded = 0; // Reset to allow coyote time if respawning slightly above ground
        this.jumpBufferTimer = 0; //
        this.dashBufferTimer = 0; //
        this.wasAirborne = true; // Treat as if just became airborne to allow landing particles correctly next frame

        // Stop any active particle emitters that should not persist
        if (this.stopRunParticles) this.stopRunParticles(); //
        if (this.stopIdleParticles) this.stopIdleParticles(); //
        // Add other particle stops if necessary (e.g., dash particles)

        // Reset sprite visibility and attack hitbox (in case of death during AirAttack, etc.)
        this.fullSprite.setVisible(true); //
        this.legsSprite.setVisible(false); //
        this.upperSprite.setVisible(false); //

        if (this.attackHitbox) { // Ensure hitbox exists
            this.attackHitbox.setVisible(false); //
            this.attackHitbox.body.setEnable(false); //
        }
        // If AirAttackState specific animation handlers were set, the state's exit should handle it,
        // but a direct transition bypasses that exit.
        if (this._airAttackUpdateHandler && this.upperSprite) {
            this.upperSprite.off('animationupdate', this._airAttackUpdateHandler); //
            this._airAttackUpdateHandler = null; //
        }


        // Reset physics properties that might have been altered by states
        this.physicsSprite.body.setAllowGravity(true); //
        this.physicsSprite.setDragX(this.DRAG); //
        this.physicsSprite.setMaxVelocity(this.MAX_SPEED, 1500); // Reset to default max velocity

        // Transition to IdleState
        this.stateMachine.transition('idle', { fromRespawn: true }); //

        // Ensure the container position is synced immediately
        this.x = this.physicsSprite.x; //
        this.y = this.physicsSprite.y; //

        console.log(`Player respawned at (${x}, ${y})`);
    }

    setPlayerCrouchHitbox() {
        if (this.crouchBodySize) { // Ensure crouchBodySize is defined
            this.physics.body.setSize(this.crouchBodySize.width, this.crouchBodySize.height);
            this.physics.body.setOffset(this.crouchBodySize.offsetX, this.crouchBodySize.offsetY);
        } else {
            console.warn("Player.setPlayerCrouchHitbox: crouchBodySize not defined!");
        }
    }

    setPlayerDashHitbox() {
        if (this.dashBodySize) { // Ensure dashBodySize is defined
            this.physics.body.setSize(this.dashBodySize.width, this.dashBodySize.height);
            this.physics.body.setOffset(this.dashBodySize.offsetX, this.dashBodySize.offsetY);
        } else {
            console.warn("Player.setPlayerDashHitbox: dashBodySize not defined!");
        }
    }

    setPlayerNormalHitbox() {
        if (this.normalBodySize) { // Ensure normalBodySize is defined
            this.physics.body.setSize(this.normalBodySize.width, this.normalBodySize.height);
            this.physics.body.setOffset(this.normalBodySize.offsetX, this.normalBodySize.offsetY);
        } else {
            console.warn("Player.setPlayerNormalHitbox: normalBodySize not defined!");
        }
    }

    // This update method should be called from the Scene's update loop
    update(time, delta) {
        const onGround = this.physicsSprite.body.blocked.down; //

        // Landing particles logic
        if (onGround && this.wasAirborne) { //
            this.emitLandingParticles(); //
        }
        this.wasAirborne = !onGround; //

        // Update positions for continuous emitters
        if (this.runParticlesEmitter && this.runParticlesEmitter.emitting) { //
            const dir = this.scaleX > 0 ? 1 : -1; // Use container's scaleX for direction
            const emitterX = this.physicsSprite.x - (dir * this.physicsSprite.displayWidth * 0.25); // Adjusted from original, test this offset
            const emitterY = this.physicsSprite.body.bottom; //
            this.runParticlesEmitter.setPosition(emitterX, emitterY); //
        }
        if (this.idleParticlesEmitter && this.idleParticlesEmitter.emitting) { //
            const emitterY = this.physicsSprite.body.bottom - 2; //
            this.idleParticlesEmitter.setPosition(this.physicsSprite.x, emitterY); //
        }

        // Step the state machine
        this.stateMachine.step(time, delta); // Pass time and delta if your states use them

        // Sync container's position with the physics sprite
        this.x = this.physicsSprite.x; //
        this.y = this.physicsSprite.y; //

        // Update attack hitbox position relative to the player
        // This is a simple example; you might want more complex logic
        // based on animation frames or specific states.
        const facingDir = this.scaleX > 0 ? 1 : -1;
        // Position relative to the container's center, then adjust.
        // Since sprites inside container are origin 0.5,1, their "center" is roughly player's feet x, and middle y.
        // Physics sprite x,y is its center.
        this.attackHitbox.setPosition(
            this.physicsSprite.x + (facingDir * (this.physicsSprite.displayWidth / 2 + this.attackHitbox.width / 4)), // Rough positioning
            this.physicsSprite.y - (this.physicsSprite.displayHeight / 4) // Rough positioning
        );
    }

    // Call this if the player is destroyed or removed from scene to clean up
    destroy(fromScene) {
        // Stop and remove particle emitters
        if (this.jumpParticlesEmitter) this.jumpParticlesEmitter.destroy(); //
        if (this.landingParticlesEmitter) this.landingParticlesEmitter.destroy(); //
        if (this.runParticlesEmitter) this.runParticlesEmitter.destroy(); //
        if (this.idleParticlesEmitter) this.idleParticlesEmitter.destroy(); //

        // Destroy sprites in the container
        if (this.fullSprite) this.fullSprite.destroy(); //
        if (this.legsSprite) this.legsSprite.destroy(); //
        if (this.upperSprite) this.upperSprite.destroy(); //

        // Destroy the attack hitbox
        if (this.attackHitbox) this.attackHitbox.destroy(); //

        // Destroy the physics sprite
        if (this.physicsSprite) this.physicsSprite.destroy(); //

        // Destroy the state machine if it has a destroy method
        if (this.stateMachine && typeof this.stateMachine.destroy === 'function') {
            this.stateMachine.destroy();
        }
        
        super.destroy(fromScene); //
    }
}