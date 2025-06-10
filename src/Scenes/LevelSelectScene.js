class LevelSelectScene extends Phaser.Scene {
    constructor() {
        super("levelSelectScene");
    }

    create() {
        this.cameras.main.setBackgroundColor('#1e1e1e');

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // --- Styles for buttons ---
        const buttonStyle = {
            fontSize: '52px',
            fill: '#87ceeb',
            backgroundColor: '#333333',
            padding: { x: 30, y: 15 },
            fontFamily: 'Arial, sans-serif',
        };

        const backButtonStyle = { ...buttonStyle, fontSize: '32px', padding: {x: 20, y: 10} };

        const buttonHoverStyle = {
            fill: '#ffffff',
            backgroundColor: '#555555',
        };

        // --- "Back" Button (Top Left) ---
        const backButton = this.add.text(100, 75, 'Back', backButtonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        backButton.on('pointerdown', () => {
            this.scene.start('mainMenuScene');
        });
        backButton.on('pointerover', () => backButton.setStyle(buttonHoverStyle));
        backButton.on('pointerout', () => backButton.setStyle(backButtonStyle));


        // --- Centered Level Buttons ---
        const buttonSpacing = 120;

        // Level 1 Button
        const level1Button = this.add.text(centerX, centerY - buttonSpacing, 'Level 1', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });
            
        level1Button.on('pointerdown', () => {
            // Tell the next scene it was started from the level select screen
            this.scene.start('level1Scene', { from: 'levelSelect' });
        });
        level1Button.on('pointerover', () => level1Button.setStyle(buttonHoverStyle));
        level1Button.on('pointerout', () => level1Button.setStyle(buttonStyle));

        // Level 2 Button
        const level2Button = this.add.text(centerX, centerY, 'Level 2', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        level2Button.on('pointerdown', () => {
            // Tell the next scene it was started from the level select screen
            this.scene.start('level2Scene', { from: 'levelSelect' });
        });
        level2Button.on('pointerover', () => level2Button.setStyle(buttonHoverStyle));
        level2Button.on('pointerout', () => level2Button.setStyle(buttonStyle));

        // "OG" Button (Placeholder)
        const ogButton = this.add.text(centerX, centerY + buttonSpacing, 'OG', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            // .setAlpha(0.5); // Make it slightly transparent to indicate it's disabled

        ogButton.on('pointerdown', () => {
            this.scene.start('levelOGScene', { from: 'levelSelect' });
        });
        ogButton.on('pointerover', () => ogButton.setStyle(buttonHoverStyle));
        ogButton.on('pointerout', () => ogButton.setStyle(buttonStyle));
    }
}
