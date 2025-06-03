class IdleState extends State {
    enter({ fromRespawn = false } = {}) {
        if (this.player.setPlayerNormalHitbox) {
            this.player.setPlayerNormalHitbox();
        }

        this.player.isCrouching = false;
        
        this.player.fullSprite.play('idle');
        this.player.physics.setVelocityX(0);
        this.player.physics.setDragX(this.player.DRAG);
        if (this.player.physics.body.blocked.down) { // Reset if entering idle while grounded
            this.player.hasAirDashed = false;
            this.player.timeLastGrounded = this.player.scene.time.now; // Update timeLastGrounded
        }
        // Manage particles
        if (this.player.stopRunParticles) this.player.stopRunParticles();
        if (this.player.startIdleParticles) this.player.startIdleParticles();
    }

    execute() {
        
        if (!this.player.isCrouching && !this.player.cursors.down.isDown && !this.player.canStandUp()) {
            console.log("IdleState: Space too tight (cannot stand), forcing crouch!");
            this.stateMachine.transition('crouch', { fromState: 'idle_forced_by_ceiling' });
            return;
        }

        // Update timeLastGrounded if player is currently on the ground
        if (this.player.physics.body.blocked.down) {
            this.player.timeLastGrounded = this.player.scene.time.now;
            // If player becomes grounded in IdleState (e.g. after a short fall without moving)
            this.player.hasAirDashed = false;
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.player.dashKey) && this.player.canDash) {
            if (this.player.physics.body.blocked.down) { // Check if grounded
                this.stateMachine.transition('groundDash');
            }
            // Note: You generally wouldn't dash from idle if in the air,
            // but if that logic changes, you'd add an else for airDash.
            return;
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.player.jumpKey)) {
            this.player.jumpBufferTimer = this.player.scene.time.now; // Set jump buffer timer
            const jumpBufferedAndValid = this.player.jumpBufferTimer > 0 &&
                           (this.player.scene.time.now - this.player.jumpBufferTimer < this.player.JUMP_BUFFER_DURATION);

            if (jumpBufferedAndValid) {
                const isOnGround = this.player.physics.body.blocked.down;
                const coyoteTimeAvailable = this.player.timeLastGrounded > 0 &&
                                        (this.player.scene.time.now - this.player.timeLastGrounded < this.player.COYOTE_TIME_DURATION);

                if (isOnGround || coyoteTimeAvailable) {
                    if (!isOnGround && coyoteTimeAvailable) {
                        console.log("Jumped using Coyote Time (via buffer)!");
                    } else {
                        console.log("Jumped from Ground (via buffer)!");
                    }
                    this.player.timeLastGrounded = 0; // Consume coyote/ground status
                    this.player.jumpBufferTimer = 0;  // IMPORTANT: Consume the buffered jump

                    console.log("IdleState: Attempting particle calls before jump transition...");
                    if (this.player.emitJumpParticles) {
                        console.log("IdleState: Calling player.emitJumpParticles()");
                        this.player.emitJumpParticles();
                    } else {
                        console.error("IdleState: ERROR - player.emitJumpParticles is NOT defined!");
                    }
                    
                    if (this.player.stopIdleParticles) {
                        // console.log("IdleState: Calling player.stopIdleParticles()");
                        this.player.stopIdleParticles();
                    } else {
                        console.warn("IdleState: player.stopIdleParticles is not defined (this might be okay if no idle particles were started).");
                    }

                    // if (this.player.emitJumpParticles) this.player.emitJumpParticles(); // Emit before transition
                    // if (this.player.stopIdleParticles) this.player.stopIdleParticles();

                    this.stateMachine.transition('jump', { isActualJump: true });
                    return; // Exit after transitioning
                }
            }
        }

        // Transition to Crouch State
        if (this.player.cursors.down.isDown) { // Or use Phaser.Input.Keyboard.JustDown(this.player.cursors.down) for a tap
            this.stateMachine.transition('crouch', { fromState: 'idle' });
            return; // Important to exit after transition
        }
        
        if (this.player.physics.body.blocked.down) {
            if (this.player.cursors.left.isDown || this.player.cursors.right.isDown) {
                this.stateMachine.transition('run');
            } 
            // else if (Phaser.Input.Keyboard.JustDown(this.player.jumpKey)) {
            //     this.stateMachine.transition('jump');
            // }
        } else {
            if (this.player.timeLastGrounded === 0 || // Coyote time consumed by a previous jump
                (this.player.timeLastGrounded > 0 && this.player.scene.time.now - this.player.timeLastGrounded >= this.player.COYOTE_TIME_DURATION)) { // Coyote time expired
                this.stateMachine.transition('jump'); // Fall (isActualJump will be false by default)
            }            
        }
    }
    exit() {
        if (this.player.stopIdleParticles) this.player.stopIdleParticles();
    }
}

class RunState extends State {
    enter() {
        this.player.fullSprite.play('run');
        if (this.player.physics.body.blocked.down) { // Reset if entering run while grounded
            this.player.hasAirDashed = false;
            this.player.timeLastGrounded = this.player.scene.time.now; // Update timeLastGrounded
        }
        // Manage particles
        if (this.player.stopIdleParticles) this.player.stopIdleParticles();
        if (this.player.startRunParticles) {
            console.log("RunState.enter: Starting run particles"); // For debugging
            this.player.startRunParticles();
        }
    }

    execute() {
        
        if (!this.player.isCrouching && !this.player.canStandUp()) {
            console.log("RunState: Space too tight (cannot stand), forcing crouch!");
            this.stateMachine.transition('crouch', {
                fromState: 'run_forced_by_ceiling',
                initialVelocityX: this.player.physics.body.velocity.x
            });
            return;
        }

        if (this.player.physics.body.blocked.down) {
            this.player.timeLastGrounded = this.player.scene.time.now;
            this.player.hasAirDashed = false; // If player becomes grounded in RunState
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.player.dashKey) && this.player.canDash) {
            // Run state implies player is on the ground
            if (this.player.stopRunParticles) this.player.stopRunParticles();
            this.stateMachine.transition('groundDash');
            return;
        }

        // Jump (Ground or Coyote)
        if (Phaser.Input.Keyboard.JustDown(this.player.jumpKey)) {
            this.player.jumpBufferTimer = this.player.scene.time.now; // Set jump buffer timer
            const jumpBufferedAndValid = this.player.jumpBufferTimer > 0 &&
                           (this.player.scene.time.now - this.player.jumpBufferTimer < this.player.JUMP_BUFFER_DURATION);

            if (jumpBufferedAndValid) {
                const isOnGround = this.player.physics.body.blocked.down;
                const coyoteTimeAvailable = this.player.timeLastGrounded > 0 &&
                                        (this.player.scene.time.now - this.player.timeLastGrounded < this.player.COYOTE_TIME_DURATION);

                if (isOnGround || coyoteTimeAvailable) {
                    if (!isOnGround && coyoteTimeAvailable) {
                        console.log("Jumped using Coyote Time (via buffer)!");
                    } else {
                        console.log("Jumped from Ground (via buffer)!");
                    }
                    this.player.timeLastGrounded = 0; // Consume coyote/ground status
                    this.player.jumpBufferTimer = 0;  // IMPORTANT: Consume the buffered jump

                    if (this.player.stopRunParticles) this.player.stopRunParticles();
                    if (this.player.emitJumpParticles) this.player.emitJumpParticles();
                    this.stateMachine.transition('jump', { isActualJump: true });
                    return; // Exit after transitioning
                }
            }
        }

        // Transition to Crouch State
        if (this.player.cursors.down.isDown) { // Or use Phaser.Input.Keyboard.JustDown(this.player.cursors.down)
            this.stateMachine.transition('crouch', {
                fromState: 'run',
                initialVelocityX: this.player.physics.body.velocity.x // Pass current speed for the slide
            });
            return; // Important to exit after transition
        }
        
        if (this.player.cursors.left.isDown) {
            this.player.physics.setVelocityX(-this.player.MAX_SPEED);
            this.player.setFacingDirection(-1);
        } else if (this.player.cursors.right.isDown) {
            this.player.physics.setVelocityX(this.player.MAX_SPEED);
            this.player.setFacingDirection(1);
        } else {
            if (this.player.physics.body.blocked.down) { // <<< CRITICAL CHANGE
                if (this.player.stopRunParticles) this.player.stopRunParticles();
                this.stateMachine.transition('idle');
                return;
            }
        }

        // Check for falling off an edge into a wall slide
        if (!this.player.physics.body.blocked.down) {
            // Coyote jump was handled above.
            // Now, check for wall slide or transition to fall if coyote time expired.
            const onWall = (this.player.physics.body.blocked.left || this.player.physics.body.blocked.right);
            const pressingIntoWall =
                (this.player.physics.body.blocked.left && this.player.cursors.left.isDown) ||
                (this.player.physics.body.blocked.right && this.player.cursors.right.isDown);

            if (this.player.scene.time.now > this.player.wallJumpGraceTimer &&
                onWall && pressingIntoWall && this.player.physics.body.velocity.y > 0) {
                    if (this.player.stopRunParticles) this.player.stopRunParticles();
                    this.stateMachine.transition('wallSlide');
            } else {
                // If not wall sliding, and coyote time has expired (or was consumed), transition to fall.
                if (this.player.timeLastGrounded === 0 || // Coyote time consumed by a previous jump
                    (this.player.timeLastGrounded > 0 && this.player.scene.time.now - this.player.timeLastGrounded >= this.player.COYOTE_TIME_DURATION)) { // Coyote time expired
                        if (this.player.stopRunParticles) this.player.stopRunParticles();
                        this.stateMachine.transition('jump'); // Fall (isActualJump will be false by default)
                }
                // If coyote time is still active and jump wasn't pressed, player stays in RunState (while in air for a bit)
            }
            return; // In air, so further ground checks in this state are not needed.
        }
    }

    exit() {
        this.player.physics.setVelocityX(0);
        if (this.player.stopRunParticles) {
            console.log("RunState.exit: Stopping run particles"); // For debugging
            this.player.stopRunParticles();
        }
    }
}

class JumpState extends State {
    enter({ isActualJump = false } = {}) {
    
        if (this.player.setPlayerNormalHitbox) { 
            this.player.setPlayerNormalHitbox();
        }
        this.player.isCrouching = false;
    
        this.player.fullSprite.play('jump');
        this.player.physics.setDragX(0);

        if (isActualJump) {
                // This jump was initiated by player input (ground or coyote)
                this.player.physics.setVelocityY(this.player.JUMP_VELOCITY);
                this.player.jumpBeingHeld = true;
                this.player.jumpCutoff = false;
                this.player.hasAirDashed = false; // Reset air dash for a "fresh" jump from ground/coyote
        }
}


    execute() {
        if (this.player.jumpBeingHeld && !this.player.jumpKey.isDown && !this.player.jumpCutoff && this.player.physics.body.velocity.y < 0) {
            this.player.physics.setVelocityY(this.player.physics.body.velocity.y * 0.35);
            this.player.jumpCutoff = true;
        }
        if (this.player.jumpKey.isDown) {
            this.player.jumpCutoff = false;
        }
        
        if (Phaser.Input.Keyboard.JustDown(this.player.dashKey) && this.player.canDash && !this.player.hasAirDashed) {
            this.stateMachine.transition('airDash');
            return;
        }

        if (!this.player.isDashing && this.player.shouldWallSlide()) { //
            if (this.player.scene.time.now > this.player.wallJumpGraceTimer) { //
                // console.log(`JumpState: Transitioning to WallSlide. Grace timer allows. Now: ${this.player.scene.time.now}, Grace End: ${this.player.wallJumpGraceTimer}`);
                this.stateMachine.transition('wallSlide');
                return;
            } else {
                // This log helps confirm if the grace timer is the reason for not sliding
                // console.log(`JumpState: shouldWallSlide() is true, but wallJumpGraceTimer is active. Time: ${this.player.scene.time.now}, Grace ends: ${this.player.wallJumpGraceTimer}`);
            }
        }


        // Horizontal movement
        if (this.player.cursors.left.isDown) {
            this.player.physics.setVelocityX(-this.player.AIR_SPEED);
            this.player.setFacingDirection(-1);
        } else if (this.player.cursors.right.isDown) {
            this.player.physics.setVelocityX(this.player.AIR_SPEED);
            this.player.setFacingDirection(1);
        } else {
            this.player.physics.setVelocityX(0);
        }

        // Air Attack
        if (Phaser.Input.Keyboard.JustDown(this.player.pogoKey)) {
            this.stateMachine.transition('airAttack');
            return; // Prevent immediate transition back if grounded
        }

        // Transition to Idle when grounded
        if (this.player.physics.body.blocked.down) {
            const jumpBufferedAndValid = this.player.jumpBufferTimer > 0 &&
                                    (this.player.scene.time.now - this.player.jumpBufferTimer < this.player.JUMP_BUFFER_DURATION);

            if (jumpBufferedAndValid) {
                console.log("Buffered jump executed upon landing!");
                this.player.jumpBufferTimer = 0;  // Consume buffer
                this.stateMachine.transition('jump', { isActualJump: true });
                return; 
            }

            // CHECK IF CAN STAND BEFORE TRANSITIONING TO IDLE/RUN
            if (!this.player.canStandUp()) {
                console.log("JumpState: Landing in tight spot, transitioning to crouch.");
                this.stateMachine.transition('crouch', { fromState: 'jump_land_forced' });
                return;
            }

            // If no buffered jump, then transition to idle or run as normal
            if (this.player.cursors.left.isDown || this.player.cursors.right.isDown) {
                this.stateMachine.transition('run');
            } else {
                this.stateMachine.transition('idle');
            }
            return; // Exit after transitioning
        }
    }

    exit() {
        this.player.jumpBeingHeld = false;
        this.player.physics.setVelocityX(0);
        // this.player.canWallJump = false; // Reset this here too, just in case
    }
}

class AirAttackState extends State {
    enter() {
        this.player.attackHitbox.setVisible(true);
        this.player.attackHitbox.body.setEnable(true);
        this.player.attackHitbox.x = this.player.physics.x;
        this.player.attackHitbox.y = this.player.physics.y + 40;

        // Delay hitbox activation slightly to avoid instant abuse
        this.hitboxDelayTimer = this.player.scene.time.delayedCall(100, () => {
        this.player.attackHitbox.setVisible(true);
        this.player.attackHitbox.body.setEnable(true);
        this.player.attackHitbox.x = this.player.physics.x;
        this.player.attackHitbox.y = this.player.physics.y + 40;
       });

        this.player.fullSprite.setVisible(false);
        this.player.legsSprite.setVisible(true);
        this.player.upperSprite.setVisible(true);
        this.player.legsSprite.setTexture('legs_up');
        this.player.upperSprite.play('pogoslash1', true);

        this.player._airAttackUpdateHandler = () => {
            let vY = this.player.physics.body.velocity.y;
            if (vY < -600) {
                this.player.legsSprite.setTexture('legs_up');
            } else if (vY < -200) {
                this.player.legsSprite.setTexture('legs_max');
            } else {
                this.player.legsSprite.setTexture('legs_down');
            }
        };

        this.player.upperSprite.on('animationupdate', this.player._airAttackUpdateHandler);

        this.player.upperSprite.once('animationcomplete', () => {
            this.player.fullSprite.setVisible(true);
            this.player.legsSprite.setVisible(false);
            this.player.upperSprite.setVisible(false);
            this.player.upperSprite.off('animationupdate', this.player._airAttackUpdateHandler);
            this.player._airAttackUpdateHandler = null;
        });

        this.attackTimer = this.player.scene.time.delayedCall(400, () => {
            this.stateMachine.transition('jump');
        });

        this.player.isSliding = false; // Ensure not considered sliding during air attack
        this.player.canWallJump = false;
    }

    execute() {
        if (Phaser.Input.Keyboard.JustDown(this.player.dashKey) && this.player.canDash && !this.player.hasAirDashed) {
            // Clear attack timer and other attack-specific cleanup if dashing out of attack
            if (this.attackTimer) this.attackTimer.remove();
            if (this.hitboxDelayTimer) this.hitboxDelayTimer.remove();
            this.player.attackHitbox.setVisible(false);
            this.player.attackHitbox.body.setEnable(false);
            if (this.player._airAttackUpdateHandler) {
                this.player.upperSprite.off('animationupdate', this.player._airAttackUpdateHandler);
                this.player._airAttackUpdateHandler = null;
            }
            this.player.fullSprite.setVisible(true); // Ensure full sprite is visible for dash
            this.player.legsSprite.setVisible(false);
            this.player.upperSprite.setVisible(false);

            this.stateMachine.transition('airDash');
            return;
        }

        if (this.player.cursors.left.isDown) {
            this.player.physics.setVelocityX(-this.player.POGO_AIR_CONTROL_SPEED);
            // For pogo, usually, you don't change facing direction, but if you want to:
            // this.player.setFacingDirection(-1);
        } else if (this.player.cursors.right.isDown) {
            this.player.physics.setVelocityX(this.player.POGO_AIR_CONTROL_SPEED);
            // this.player.setFacingDirection(1);
        } else {
            // What happens when no horizontal input is pressed during pogo:
            // Option 1: Actively stop horizontal movement (makes pogo feel very deliberate).
            // this.player.physics.setVelocityX(0);

            // Option 2: Gradually decay existing horizontal momentum (feels more natural if you had speed entering the pogo).
            this.player.physics.setVelocityX(this.player.physics.body.velocity.x * 0.95); // Tune the multiplier (0.90 to 0.98)

            // Option 3: Maintain existing horizontal velocity (comment out any setVelocityX(0) or decay).
            // No line here means velocityX remains as it was from before the pogo or from the last frame.
        }

        const onWall = (this.player.physics.body.blocked.left || this.player.physics.body.blocked.right);
        const pressingIntoWall =
            (this.player.physics.body.blocked.left && this.player.cursors.left.isDown) ||
            (this.player.physics.body.blocked.right && this.player.cursors.right.isDown);

        if (!this.attackTimer || this.attackTimer.getProgress() === 1) { // If attack timer is done or doesn't exist
             if (onWall && !this.player.physics.body.blocked.down && this.player.physics.body.velocity.y > 0 && pressingIntoWall) {
                this.stateMachine.transition('wallSlide');
                return;
            }
        }


        if (!this.player.attackHitbox.body.enable) return;
        this.player.attackHitbox.x = this.player.physics.x;
        this.player.attackHitbox.y = this.player.physics.y - 10;
    }

    exit() {
        this.player.attackHitbox.setVisible(false);
        this.player.attackHitbox.body.setEnable(false);

        if (this.hitboxDelayTimer) this.hitboxDelayTimer.remove();
        this.player.attackHitbox.setVisible(false);
        this.player.attackHitbox.body.setEnable(false);

        if (this.attackTimer) this.attackTimer.remove();
        if (this.player._airAttackUpdateHandler) {
            this.player.upperSprite.off('animationupdate', this.player._airAttackUpdateHandler);
            this.player._airAttackUpdateHandler = null;
        }
    }
}

class WallSlideState extends State {
    enter() {
        this.player.fullSprite.play('wallSlide');
        this.player.physics.setVelocityY(0); // Initially stop vertical movement
        this.player.physics.setVelocityX(0); // CRITICAL: Stop horizontal movement that might pull away from the wall

        const body = this.player.physics.body;
        let facingDirectionToSet = 0;
        let determinedLastWallSide = null;
        let wallSideBasedOnBlocked = null; // <<< DECLARED HERE


        

        // Determine wall and facing direction
        // It's possible body.blocked is not yet true if shouldWallSlide was based on a tile edge graze
        // So, prioritize current input if body.blocked isn't definitive yet.
        if (body.blocked.left) {
            facingDirectionToSet = -1; // Face right (away from left wall)
            determinedLastWallSide = 'left';
        } else if (body.blocked.right) {
            facingDirectionToSet = 1; // Face left (away from right wall)
            determinedLastWallSide = 'right';
        } else if (this.player.cursors.left.isDown && this.player.physics.body.velocity.y > 0) {
            // If pressing left and falling, likely trying to attach to a left wall
            // Check if a wall is *actually* there if body.blocked.left isn't true yet.
            // For now, assume input means intent if body.blocked isn't yet set from a hard collision.
            facingDirectionToSet = 1;
            determinedLastWallSide = 'left';
        } else if (this.player.cursors.right.isDown && this.player.physics.body.velocity.y > 0) {
            // If pressing right and falling
            facingDirectionToSet = -1;
            determinedLastWallSide = 'right';
        }


        if (determinedLastWallSide) {
            this.player.lastWallSide = determinedLastWallSide;
            if (facingDirectionToSet !== 0) {
                this.player.setFacingDirection(facingDirectionToSet, true); // Force the direction
            }

            const immediateNudgeForce = 15; // Or try 20-30
            if (wallSideBasedOnBlocked === 'left') {
                this.player.physics.setVelocityX(-immediateNudgeForce);
            } else if (wallSideBasedOnBlocked === 'right') {
                this.player.physics.setVelocityX(immediateNudgeForce);
            }
        } else {
            // If still no wall determined (e.g., entered from a state where input wasn't held, or no wall nearby)
            console.warn("WallSlideState enter: Could not determine a wall to slide on based on current body.blocked or input. Transitioning to jump.");
            this.stateMachine.transition('jump'); // Bail out
            return;
        }

        // console.log(`Entering WallSlide, lastWallSide: ${this.player.lastWallSide}, Facing: ${this.player.container.scaleX > 0 ? 1 : -1}, VelX After Nudge: ${this.player.physics.body.velocity.x.toFixed(2)}`); // Keep your log
        
        this.player.timeLostWallContact = 0;

        this.player.isSliding = true;
        this.player.canWallJump = true;
        this.player.hasAirDashed = false;
    }

    execute() {
        const body = this.player.physics.body;
        const cursors = this.player.cursors;
        const sceneTime = this.player.scene.time; // Get reference to scene.time


        // --- Primary Exits (Should interrupt sliding immediately) ---

        // 1. Dash Off Wall
        if (Phaser.Input.Keyboard.JustDown(this.player.dashKey) && this.player.canDash && !this.player.hasAirDashed) {
            if (this.player.lastWallSide === 'left') {
                this.player.dashAwayFromWallDirection = 1; // Dash Right (away from left wall)
            } else if (this.player.lastWallSide === 'right') {
                this.player.dashAwayFromWallDirection = -1; // Dash Left (away from right wall)
            } else {
                this.player.dashAwayFromWallDirection = 0; // Fallback to normal dash if lastWallSide is unknown
            }
            this.stateMachine.transition('airDash');
            return;
        }

        // 2. Wall Jump
        if (Phaser.Input.Keyboard.JustDown(this.player.jumpKey)) {
            this.stateMachine.transition('wallJump');
            return;
        }

        // 3. Explicit Detach (Pressing away from the wall)
        let explicitlyDetaching = false;
        if (this.player.lastWallSide === 'left' && cursors.right.isDown && !cursors.left.isDown) {
            explicitlyDetaching = true;
        } else if (this.player.lastWallSide === 'right' && cursors.left.isDown && !cursors.right.isDown) {
            explicitlyDetaching = true;
        }

        if (explicitlyDetaching) {
            this.player.wallJumpGraceTimer = this.player.scene.time.now + 150; // Grace of 150ms for explicit detach
            this.player.physics.setVelocityX(0); // Stop any inward hold if detaching
            this.stateMachine.transition('jump');
            return;
        }

        // --- Apply Slide Dynamics ---
        this.player.physics.setVelocityY(this.player.WALL_SLIDE_SPEED);

        // Apply a slight inward force to maintain contact IF NOT detaching AND pressing into wall
        const wallStickForce = 100; // Small force, adjust as needed.
        if (this.player.lastWallSide === 'left' && cursors.left.isDown) {
            this.player.physics.setVelocityX(-wallStickForce);
        } else if (this.player.lastWallSide === 'right' && cursors.right.isDown) {
            this.player.physics.setVelocityX(wallStickForce);
        } else {
            // If not pressing into the wall, don't apply stick force. Player might detach.
            // Set X velocity to 0 to prevent carrying over old stick force or other momentum.
            this.player.physics.setVelocityX(0);
        }

        // --- Conditions to Stop Sliding (and transition) ---

        // A. Hit the ground
        if (body.blocked.down) {
            this.stateMachine.transition('idle');
            return;
        }

        // B. No longer falling (e.g., hit an overhang that's not ground but stops Y movement)
        // Only transition if Y velocity is not already being driven by WALL_SLIDE_SPEED.
        // This check is usually for external forces stopping the slide.
        // If WALL_SLIDE_SPEED is positive, this means something else made velocity Y <= 0.
        if (body.velocity.y <= 0 && this.player.WALL_SLIDE_SPEED > 0 && !body.blocked.down) {
            console.log(`WS: Vertical movement stopped unexpectedly. VelY: ${body.velocity.y.toFixed(2)}. Transitioning to jump.`);
            this.stateMachine.transition('jump');
            return;
        }

        // C. "Stickiness" Logic: Check if still intending to slide and if the specific wall contact is maintained.
        let isPressingIntoCorrectWall = false;
        let specificWallIsCurrentlyBlocked = false;

        if (this.player.lastWallSide === 'left' && cursors.left.isDown) {
            isPressingIntoCorrectWall = true;
            if (body.blocked.left) {
                specificWallIsCurrentlyBlocked = true;
            }
        } else if (this.player.lastWallSide === 'right' && cursors.right.isDown) {
            isPressingIntoCorrectWall = true;
            if (body.blocked.right) {
                specificWallIsCurrentlyBlocked = true;
            }
        }

        if (isPressingIntoCorrectWall) {
        if (specificWallIsCurrentlyBlocked) {
            // Solid contact with the expected wall, continue wall sliding.
            this.player.timeLostWallContact = 0; // Reset lost contact timer

            // Inner corner switch logic (your existing logic for this is good)
            if (body.blocked.right && this.player.lastWallSide === 'left' && cursors.right.isDown && !cursors.left.isDown) {
                console.log("WS: Switched to right wall in inner corner.");
                this.player.lastWallSide = 'right';
                this.player.setFacingDirection(-1, true);
            } else if (body.blocked.left && this.player.lastWallSide === 'right' && cursors.left.isDown && !cursors.right.isDown) {
                console.log("WS: Switched to left wall in inner corner.");
                this.player.lastWallSide = 'left';
                this.player.setFacingDirection(1, true);
            }
        } else {
            // Pressing into the wall, but the specific wall is NOT currently blocked.
            // Start or check the grace period timer.
            if (this.player.timeLostWallContact === 0) {
                // First frame contact was lost according to physics, start the timer.
                this.player.timeLostWallContact = sceneTime.now + this.player.wallContactGracePeriodDuration;
                // console.log(`WS: Initial lost contact with ${this.player.lastWallSide} wall. Grace period started (until ${this.player.timeLostWallContact}). Blocked L/R: <span class="math-inline">\{body\.blocked\.left\}/</span>{body.blocked.right}.`);
            } else if (sceneTime.now > this.player.timeLostWallContact) {
                // Grace period has expired, and contact was not re-established. Detach.
                // console.log(`WS: Grace period for ${this.player.lastWallSide} wall EXPIRED. Lost contact. Blocked L/R: <span class="math-inline">\{body\.blocked\.left\}/</span>{body.blocked.right}. VelY: ${body.velocity.y.toFixed(2)}. Transitioning to jump.`);
                this.stateMachine.transition('jump');
                return;
            } else {
                // Grace period is active, still "sliding" for a few frames hoping for re-contact.
                // console.log(`WS: Lost contact grace period active for ${this.player.lastWallSide} wall. Time: ${scene.time.now}, Expires: ${this.player.timeLostWallContact}`);
            }
        }
    } else {
        // Not pressing into the correct wall direction anymore. This should still be an immediate detach.
        // console.log(`WS: Detaching - No longer pressing into ${this.player.lastWallSide} wall. Blocked L/R: <span class="math-inline">\{body\.blocked\.left\}/</span>{body.blocked.right}. VelY: ${body.velocity.y.toFixed(2)}. Transitioning to jump.`);
        this.player.physics.setVelocityX(0); // Ensure X velocity is neutral
        this.stateMachine.transition('jump');
        return;
    }
    }

    exit() {
        this.player.isSliding = false;
        this.player.canWallJump = false;
        // this.player.physics.setVelocityX(0); // Optional: reset X velocity on exit if needed by subsequent states

        const explicitDetachGracePeriod = 150; //
        // Check if wallJumpGraceTimer was ALREADY set by an explicit detach in execute()
        // If not, then set the general grace period.
        if (!(this.player.wallJumpGraceTimer > this.player.scene.time.now &&
              this.player.wallJumpGraceTimer < this.player.scene.time.now + explicitDetachGracePeriod + 10)) { //
             this.player.wallJumpGraceTimer = this.player.scene.time.now + 200; // General grace period //
        }
    }
}

class WallJumpState extends State {
    enter() {
        this.player.fullSprite.play('jump'); // Or a specific wall jump animation

        let wallJumpDirection = 0;
        // Try to use current blocked status first as it's most immediate
        if (this.player.physics.body.blocked.left) {
            wallJumpDirection = 1; // Push right
            this.player.lastWallSide = 'left'; // Update lastWallSide based on definitive contact
            // console.log("WallJump ENTER: Wall contact on left.");
        } else if (this.player.physics.body.blocked.right) {
            wallJumpDirection = -1; // Push left
            this.player.lastWallSide = 'right'; // Update lastWallSide
            // console.log("WallJump ENTER: Wall contact on right.");
        } else if (this.player.lastWallSide === 'left') {
            // Fallback: No direct body.blocked, but we were just on the left wall
            // console.log("WallJump ENTER: No direct wall contact, using lastWallSide 'left' to jump right.");
            wallJumpDirection = 1;
        } else if (this.player.lastWallSide === 'right') {
            // Fallback: No direct body.blocked, but we were just on the right wall
            // console.log("WallJump ENTER: No direct wall contact, using lastWallSide 'right' to jump left.");
            wallJumpDirection = -1;
        }

        if (wallJumpDirection !== 0) {
            this.player.physics.setVelocityX(this.player.WALL_JUMP_X_VELOCITY * wallJumpDirection);
            this.player.physics.setVelocityY(this.player.WALL_JUMP_Y_VELOCITY); // Upward velocity
            this.player.setFacingDirection(wallJumpDirection, true); // Force facing away from wall
            // console.log(`WallJumpState ENTER: Applied jump. Direction: ${wallJumpDirection}, VelX=${this.player.physics.body.velocity.x.toFixed(2)}, VelY=${this.player.physics.body.velocity.y.toFixed(2)}`);
        } else {
            // Truly no wall information to act on (should be very rare now)
            // console.error("WallJumpState ENTER: Critical - No wall detected AND no lastWallSide! Transitioning to jump.");
            this.stateMachine.transition('jump');
            return; // Essential to stop further execution in this enter() call
        }

        this.player.hasAirDashed = false;   // Reset air dash
        this.player.jumpBeingHeld = true;   // Allow variable jump height if key is held/re-pressed
        this.player.jumpCutoff = false;

        // Timer to delay when the player can regain air control or re-attach to a wall slide
        this.player.wallJumpActionDelayTimer = this.player.scene.time.now + 150; // e.g., 150ms

        // Timer to briefly delay the ground check, allowing player to get off the ground
        this.player.wallJumpGroundCheckDelayTimer = this.player.scene.time.now + 60; // e.g., ~3-4 frames
    }

    execute() {
        const scene = this.player.scene;
        const body = this.player.physics.body;
        const cursors = this.player.cursors;

        // Log current state values for debugging
        // console.log(`WallJump EXECUTE: blocked.down=${body.blocked.down}, Y=${this.player.physics.y.toFixed(2)}, VelY=${body.velocity.y.toFixed(2)}, GroundCheckAllowed=${scene.time.now > this.player.wallJumpGroundCheckDelayTimer}`);

        // 1. Check for landing (only after the brief ground check delay)
        if (scene.time.now > this.player.wallJumpGroundCheckDelayTimer && body.blocked.down) {
            // console.log("WallJumpState: Transitioning to idle (ground detected after delay).");
            this.stateMachine.transition('idle');
            return;
        }

        // 2. Air Dash
        if (Phaser.Input.Keyboard.JustDown(this.player.dashKey) && this.player.canDash && !this.player.hasAirDashed) {
            this.stateMachine.transition('airDash');
            return;
        }

        // Pogo Slash
        if (Phaser.Input.Keyboard.JustDown(this.player.pogoKey)){
            this.stateMachine.transition('airAttack');
            return;
        }
        
        const allowActions = scene.time.now > this.player.wallJumpActionDelayTimer; // Can regain control / re-slide

        // 3. Check for re-attaching to wall slide (only after action delay)
        if (allowActions && this.player.shouldWallSlide()) {
            // Ensure the GENERAL wallJumpGraceTimer (the 200ms one from WallSlideState.exit)
            // is also respected if you want to prevent quick re-attachment from any wall slide exit.
            // However, wallJumpActionDelayTimer is specific to *this* wall jump.
            this.stateMachine.transition('wallSlide');
            return; 
        }

        // 4. Horizontal Air Control (only after action delay)
        if (allowActions) {
            if (cursors.left.isDown) {
                this.player.physics.setVelocityX(-this.player.AIR_SPEED);
                this.player.setFacingDirection(-1);
            } else if (cursors.right.isDown) {
                this.player.physics.setVelocityX(this.player.AIR_SPEED);
                this.player.setFacingDirection(1);
            } else {
                // If you want horizontal momentum to stop when no keys are pressed (Hollow Knight like)
                this.player.physics.setVelocityX(0);
                // Or, for some air drift:
                // this.player.physics.setVelocityX(body.velocity.x * 0.98); 
            }
        }

        // 5. Variable Jump Height cut-off for the wall jump (if jump key released)
        if (this.player.jumpBeingHeld && !this.player.jumpKey.isDown && !this.player.jumpCutoff && body.velocity.y < 0) {
            this.player.physics.setVelocityY(body.velocity.y * 0.35); // Adjust multiplier as needed
            this.player.jumpCutoff = true;
        }

        // Note: The original WallJumpState had a second, unguarded if(this.player.shouldWallSlide()) check.
        // That is removed here as the check is now gated by `allowActions`.
    }

    exit() {
        // Resetting horizontal velocity on exit can be good if the next state
        // shouldn't inherit wall jump's potentially high horizontal speed by default.
        // However, if going into 'jump' state, JumpState's air control will take over.
        // this.player.physics.setVelocityX(0); 

        this.player.jumpBeingHeld = false; // Reset jump holding state
        // console.log("Exiting WallJumpState");
    }
}

class GroundDashState extends State {
    enter({ fromCrouch = false } = {}) {
        this.player.fullSprite.setVisible(true); //
        this.player.legsSprite.setVisible(false); //
        this.player.upperSprite.setVisible(false); //
        
        this.isCrouchDash = fromCrouch; //

        if (this.isCrouchDash) {
            this.player.fullSprite.play('slide'); // Assumes 'slide' is your crouch dash/slide animation
            if (this.player.setPlayerCrouchHitbox) this.player.setPlayerCrouchHitbox(); //
        } else {
            this.player.fullSprite.play('dash'); // Your existing normal dash animation
            if (this.player.setPlayerNormalHitbox) this.player.setPlayerNormalHitbox(); //
            // if (this.player.setPlayerDashHitbox && !this.isCrouchDash) this.player.setPlayerDashHitbox(); // This was in your file, ensure it's needed/defined
        }
        
        this.player.isDashing = true; //
        this.player.canDash = false; //
        this.player.physics.setMaxVelocity(this.player.DASH_SPEED, 1500); //

        let dashDirection = 0; //
        if (this.player.cursors.left.isDown) { //
            dashDirection = -1; //
        } else if (this.player.cursors.right.isDown) { //
            dashDirection = 1; //
        } else {
            dashDirection = this.player.scaleX > 0 ? 1 : -1; //
        }

        if (dashDirection !== 0) {
            this.player.setFacingDirection(dashDirection, true); //
        }

        this.player.physics.setVelocityX(this.player.DASH_SPEED * dashDirection); //
        this.player.physics.setVelocityY(0); //
        this.player.physics.body.setAllowGravity(false); //

        this.dashTimer = this.player.scene.time.delayedCall(this.player.DASH_DURATION, () => { // Arrow function for correct 'this' scope
            // This is the outer timer, marking the end of the dash's active movement
            if (this.stateMachine.currentState === this) { // Check if still in GroundDashState
                console.log(`GroundDash Outer Timer Fired. Re-enabling gravity. VelY: ${this.player.physics.body.velocity.y}`);
                this.player.physics.body.setAllowGravity(true); //

                // Now, wait one more frame (approx 16ms) for physics to apply gravity and update body state
                this.player.scene.time.delayedCall(16, () => { // Arrow function for correct 'this' scope
                    // This is the inner timer, firing after physics should have processed gravity
                    if (this.stateMachine.currentState === this) { // CRITICAL: Check state again, might have changed in 16ms
                        const body = this.player.physics.body; //
                        const isOnFloor = body.onFloor(); //
                        const isBlockedDown = body.blocked.down; //
                        const isDownHeld = this.player.cursors.down.isDown; //

                        console.log(`Dash End Check (DELAYED 16ms): isCrouchDash: ${this.isCrouchDash}, down.isDown: ${isDownHeld}, isOnFloor: ${isOnFloor}, isBlockedDown: ${isBlockedDown}, VelY: ${body.velocity.y}`); //

                        if (this.isCrouchDash && isDownHeld && (isOnFloor || isBlockedDown)) { //
                            console.log("Transitioning to CROUCH from dash end (DELAYED)."); //
                            this.stateMachine.transition('crouch', { fromState: 'dash_end' }); //
                        } else {
                            if (isOnFloor || isBlockedDown) { // Landed on ground
                                // NOW, check if the player CAN stand where they landed if they are to go to Idle
                                if (!this.player.canStandUp()) {
                                    console.log("GroundDashState: Dash ended in tight spot (cannot stand), transitioning to CROUCH (DELAYED).");
                                    this.stateMachine.transition('crouch', { fromState: 'dash_land_forced' });
                                } else {
                                    console.log(`Transitioning to IDLE from dash end (DELAYED). isOnFloor: ${isOnFloor}, isBlockedDown: ${isBlockedDown}`);
                                    this.stateMachine.transition('idle');
                                }
                            } else { // Still in air after dash
                                console.log(`Transitioning to JUMP from dash end (DELAYED). isOnFloor: ${isOnFloor}, isBlockedDown: ${isBlockedDown}`);
                                this.stateMachine.transition('jump');
                            }
                        }
                    } else {
                        console.log("GroundDashState: State changed during 16ms ground check delay. Aborting transition from ground check.");
                    }
                });
            }
        });

        this.player.scene.time.delayedCall(this.player.DASH_COOLDOWN, () => { //
            this.player.canDash = true; //
        });
    }

    execute() {
        if (Phaser.Input.Keyboard.JustDown(this.player.pogoKey)) { //
            this.stateMachine.transition('airAttack'); //
            return; //
        }
    }

    exit() {
        this.player.isDashing = false; //
        // Gravity should be re-enabled by the timer, but ensure it is here too for other exit paths.
        this.player.physics.body.setAllowGravity(true); //
        this.player.physics.setDragX(this.player.DRAG); //

        if (this.dashTimer) { // Check if dashTimer exists
            this.dashTimer.remove(); //
            // Note: Also need to manage/remove the *nested* timer if dash is interrupted before it fires.
            // However, typical interruption (e.g. hitting a wall) would transition out, and the nested timer
            // check 'if (this.stateMachine.currentState === this)' should prevent it from acting.
        }

        // This complex exit logic for animations and hitboxes can often be simplified
        // by letting each state's `enter` method fully manage its own setup.
        // For now, I'm keeping your existing exit logic below but with animation key correction.
        // The simplified 'exit' from previous advice is generally more robust.

        if (!this.isCrouchDash) { // If it was a normal ground dash
            if (this.player.setPlayerNormalHitbox) this.player.setPlayerNormalHitbox(); //
        }

        // The following block was in your uploaded file.
        // It attempts to set animations/hitboxes for the *next* state, which can be tricky.
        if (this.isCrouchDash) { //
            // If NOT holding down OR NOT on ground when crouch dash ends AND going to a non-crouch state
            if (!this.player.cursors.down.isDown || !(this.player.physics.body.onFloor() || this.player.physics.body.blocked.down) ) { //
                 if (this.player.setPlayerNormalHitbox) this.player.setPlayerNormalHitbox(); //
            }
        }

        if (this.player.physics.body.onFloor() || this.player.physics.body.blocked.down) { //
            if (this.isCrouchDash && this.player.cursors.down.isDown) { //
                 // If the next state isn't already crouch, play crouch anim.
                 // This can conflict if the next state (e.g. Idle from releasing down) plays its own anim.
                 // Best to let next state's enter() handle this.
                 if (this.stateMachine.nextStateName !== 'CrouchState' && this.stateMachine.currentState.constructor.name !== 'CrouchState') { //
                    this.player.fullSprite.play('crouch'); // Use 'crouch' if that's your crouch idle animation
                 }
            } else {
                // Only play idle if not a crouch dash still holding down, and not already handled by a state transition
                if (!(this.isCrouchDash && this.player.cursors.down.isDown)) {
                   // this.player.fullSprite.play('idle'); // Let IdleState.enter handle this
                }
            }
        } else { // Player is in air
            // this.player.fullSprite.play('jump'); // Let JumpState.enter handle this
            if (this.isCrouchDash) { // If crouch dashed into the air
                 if (this.player.setPlayerNormalHitbox) this.player.setPlayerNormalHitbox(); //
            }
        }
    }
}

class AirDashState extends State {
    enter() {
        this.player.fullSprite.setVisible(true);
        this.player.legsSprite.setVisible(false);
        this.player.upperSprite.setVisible(false);
        this.player.fullSprite.play('dash');
        this.player.isDashing = true;
        if (this.player.setPlayerDashHitbox) this.player.setPlayerDashHitbox();
        this.player.canDash = false;

        // Temporarily increase max velocity for the dash
        this.player.physics.setMaxVelocity(this.player.DASH_SPEED, 1500);

        let dashDirection; // Will store the final direction of the dash

        // Check if a forced dash direction is set (e.g., from wall slide)
        if (this.player.dashAwayFromWallDirection !== 0) {
            dashDirection = this.player.dashAwayFromWallDirection;
            // console.log(`AirDash from Wall: Forced direction ${dashDirection}`);
        } else {
            // Normal air dash direction logic (based on input or current facing)
            if (this.player.cursors.left.isDown) {
                dashDirection = -1;
            } else if (this.player.cursors.right.isDown) {
                dashDirection = 1;
            } else {
                // Default to current facing direction if no input is pressed
                dashDirection = this.player.scaleX > 0 ? 1 : -1;            }
            // console.log(`AirDash Normal: Direction ${dashDirection}`);
        }

        // Reset the flag now that we've used it
        this.player.dashAwayFromWallDirection = 0;

        this.player.physics.setVelocityX(this.player.AIR_DASH_SPEED * dashDirection);
        this.player.physics.setVelocityY(0); // Air dash is purely horizontal
        this.player.physics.body.setAllowGravity(false);

        this.player.hasAirDashed = true; // Mark that an air dash has been performed

        this.dashTimer = this.player.scene.time.delayedCall(this.player.DASH_DURATION, () => {
            if (this.stateMachine.currentState === this) { // Ensure still in AirDashState
                this.stateMachine.transition('jump'); // Transition to jump/fall after dash
            }
        });

    // Cooldown for when the player can dash again
    this.player.scene.time.delayedCall(this.player.DASH_COOLDOWN, () => {
        this.player.canDash = true;
    });

        // Set facing direction based on dash
        if (dashDirection !== 0) {
            this.player.setFacingDirection(dashDirection, true); // Force face direction during dash
        }

        this.player.physics.setVelocityX(this.player.AIR_DASH_SPEED * dashDirection);
        this.player.physics.setVelocityY(0); // Air dash is purely horizontal
        this.player.physics.body.setAllowGravity(false);

        this.player.hasAirDashed = true;

        this.dashTimer = this.player.scene.time.delayedCall(this.player.DASH_DURATION, () => {
            if (this.stateMachine.currentState === this) {
                this.stateMachine.transition('jump'); // Or a dedicated 'fall' state
            }
        });

        this.player.scene.time.delayedCall(this.player.DASH_COOLDOWN, () => {
            this.player.canDash = true;
        });
    }

    execute() {
        // Optional: interrupt conditions for air dash (e.g., hitting a wall)
        if (Phaser.Input.Keyboard.JustDown(this.player.pogoKey)) {
            this.stateMachine.transition('airAttack');
            return; // Prevent immediate transition back if grounded
        }
    }

    exit() {
        this.player.isDashing = false;
        if (this.player.setPlayerNormalHitbox) this.player.setPlayerNormalHitbox();
        this.player.physics.body.setAllowGravity(true);
        this.player.physics.setDragX(this.player.DRAG); // Or maybe less drag for air control after dash

        if (this.dashTimer && this.dashTimer.getProgress() < 1) {
            this.dashTimer.remove();
        }
        // Always transition to an aerial animation
        this.player.fullSprite.play('jump', true);
    }
}

class CrouchState extends State {
enter({ fromState = 'idle', initialVelocityX = 0 } = {}) {
        this.player.isCrouching = true;
        if (this.player.setPlayerCrouchHitbox) this.player.setPlayerCrouchHitbox();
        if (this.player.stopRunParticles) this.player.stopRunParticles();
        if (this.player.stopIdleParticles) this.player.stopIdleParticles();

        this.slideFrom = fromState;
        this.slideCompleted = false;

        if (this.slideFrom === 'idle') {
            // For the short slide from idle, we can play the crouch_idle animation
            // as the movement is minimal, or use slide if you prefer a visual slide.
            // Let's use crouch for the "settled" look during the short slide.
            this.player.fullSprite.play('crouch'); // From Player Crouch-Idle 48x48.png

            const slideDirection = this.player.scaleX > 0 ? 1 : -1;
            this.player.physics.setVelocityX(slideDirection * this.player.CROUCH_SLIDE_VELOCITY_FROM_IDLE);
            this.player.physics.setDragX(this.player.DRAG);

            this.slideTimer = this.player.scene.time.delayedCall(this.player.CROUCH_SLIDE_DURATION_FROM_IDLE, () => {
                if (this.stateMachine.currentState === this) {
                    this.player.physics.setVelocityX(0);
                    // Animation should already be 'crouch' and looping
                    this.slideCompleted = true;
                }
            });
        } else if (this.slideFrom === 'run') {
            this.player.fullSprite.play('crouch'); // From Player Slide 48x48.png
            this.player.physics.setVelocityX(initialVelocityX * this.player.RUN_TO_CROUCH_SLIDE_DAMPING);
            this.player.physics.setDragX(this.player.CROUCH_SLIDE_DRAG);
        } else {
            this.player.fullSprite.play('crouch'); // Default
            this.player.physics.setVelocityX(0);
            this.slideCompleted = true;
        }
    }

    execute() {
        if (this.slideFrom === 'run' && !this.slideCompleted) {
            if (Math.abs(this.player.physics.body.velocity.x) < this.player.MIN_CROUCH_SLIDE_SPEED) {
                this.player.physics.setVelocityX(0);
                this.player.physics.setDragX(this.player.DRAG);
                this.player.fullSprite.play('crouch'); // Switch to idle crouch anim
                this.slideCompleted = true;
            }
        }

        // Check if player tries to stand up
        if (!this.player.cursors.down.isDown) {
            if (this.player.canStandUp()) { // <<< CHECK IF SPACE TO STAND
                // Enough space, transition as normal
                if (this.player.cursors.left.isDown || this.player.cursors.right.isDown) {
                    this.stateMachine.transition('run');
                } else {
                    this.stateMachine.transition('idle');
                }
                return;
            } else {
                // Not enough space, remain crouched
                // Ensure player is visually in crouch idle and not moving if slide was completed
                if (this.slideCompleted) {
                    this.player.fullSprite.play('crouch'); // Play crouch idle
                    this.player.physics.setVelocityX(0);   // Stop horizontal movement
                }
                // Player stays in CrouchState implicitly
            }
        }   

        if (!this.player.cursors.down.isDown) {
        if (this.player.canStandUp()) { // <<< CHECK IF SPACE TO STAND
            // Enough space, transition as normal
            if (this.player.cursors.left.isDown || this.player.cursors.right.isDown) {
                this.stateMachine.transition('run');
            } else {
                this.stateMachine.transition('idle');
            }
            return;
        } else {
            // Not enough space, remain crouched
            if (this.slideCompleted) {
                this.player.fullSprite.play('crouch'); 
                this.player.physics.setVelocityX(0);   
            }
        }
    }

        if (Phaser.Input.Keyboard.JustDown(this.player.jumpKey)) {
            this.stateMachine.transition('jump', { isActualJump: true });
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.player.dashKey) && this.player.canDash) {
            this.stateMachine.transition('groundDash', { fromCrouch: true });
            return;
        }

        if (this.slideCompleted) {
            this.player.physics.setVelocityX(0);
        }
    }

    exit() {
        this.player.isCrouching = false;
        if (this.player.setPlayerNormalHitbox) this.player.setPlayerNormalHitbox();
        this.player.physics.setDragX(this.player.DRAG);

        if (this.slideTimer) {
            this.slideTimer.remove();
        }
    }    
} //add crouch dash in the dround dash state

//class AttackState extends State {} // Might add not confirmed yet




