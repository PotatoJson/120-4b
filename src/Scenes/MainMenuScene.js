class MainMenuScene extends Phaser.Scene {
    constructor() {
        super("mainMenuScene");
    }

    create() {
        this.cameras.main.setBackgroundColor('#1e1e1e'); // A dark, clean background

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // --- Game Title ---
        const titleStyle = {
            fontSize: '80px',
            fill: '#ffffff',
            fontFamily: 'Arial, sans-serif',
            stroke: '#000000',
            strokeThickness: 6
        };
        this.add.text(centerX, centerY - 200, 'Platfomer Game (title WIP)', titleStyle).setOrigin(0.5);

        // --- Button Styles ---
        const buttonStyle = {
            fontSize: '48px',
            fill: '#87ceeb', // A pleasant sky blue
            backgroundColor: '#333333',
            padding: { x: 20, y: 10 },
            fontFamily: 'Arial, sans-serif',
        };

        const buttonHoverStyle = {
            fill: '#ffffff', // White text on hover
            backgroundColor: '#555555', // A slightly lighter background on hover
        };

        // --- Play Button ---
        const playButton = this.add.text(centerX, centerY - 50, 'Play', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        playButton.on('pointerdown', () => {
            // Tell the next scene it was started from the main menu
            this.scene.start('level1Scene', { from: 'mainMenu' });
        });

        playButton.on('pointerover', () => playButton.setStyle(buttonHoverStyle));
        playButton.on('pointerout', () => playButton.setStyle(buttonStyle));

        // --- Tutorial Button ---
        const tutorialButton = this.add.text(centerX, centerY + 50, 'Tutorial', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        tutorialButton.on('pointerdown', () => {
            this.scene.start('levelTutorialScene', { from: 'levelSelect' });
        });

        tutorialButton.on('pointerover', () => tutorialButton.setStyle(buttonHoverStyle));
        tutorialButton.on('pointerout', () => tutorialButton.setStyle(buttonStyle));

        // --- Level Select Button ---
        const levelSelectButton = this.add.text(centerX, centerY + 150, 'Level Select', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        levelSelectButton.on('pointerdown', () => {
            // This leads to a scene where players can choose which level to play.
            Example: this.scene.start('levelSelectScene');
        });

        levelSelectButton.on('pointerover', () => levelSelectButton.setStyle(buttonHoverStyle));
        levelSelectButton.on('pointerout', () => levelSelectButton.setStyle(buttonStyle));
    }

    update() {
        // The main menu is static, so the update loop is not needed.
    }
}