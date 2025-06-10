class CreditsScene extends Phaser.Scene {
    constructor() {
        super("creditsScene");
    }

    create() {
        this.cameras.main.setBackgroundColor('#1e1e1e');

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // --- Styles ---
        const titleStyle = { fontSize: '72px', fill: '#90ee90', fontFamily: 'Arial, sans-serif' };
        const roleStyle = { fontSize: '36px', fill: '#87ceeb', fontFamily: 'Arial, sans-serif' };
        const nameStyle = { fontSize: '48px', fill: '#ffffff', fontFamily: 'Arial, sans-serif' };
        const buttonStyle = {
            fontSize: '36px',
            fill: '#87ceeb',
            backgroundColor: '#333333',
            padding: { x: 25, y: 15 },
            fontFamily: 'Arial, sans-serif'
        };
        const buttonHoverStyle = {
            fill: '#ffffff',
            backgroundColor: '#555555'
        };

        // --- "Thanks for Playing!" Title ---
        this.add.text(centerX, centerY - 250, 'Thanks for Playing!', titleStyle).setOrigin(0.5);

        // --- Credits ---
        let currentY = centerY - 100;
        const lineSpacing = 80;

        // Developer
        this.add.text(centerX, currentY, 'Developer', roleStyle).setOrigin(0.5);
        this.add.text(centerX, currentY + 40, 'Jayson Boyanich', nameStyle).setOrigin(0.5);
        currentY += lineSpacing;

        // TileSet Art
        this.add.text(centerX, currentY + 40, 'TileSet Art', roleStyle).setOrigin(0.5);
        this.add.text(centerX, currentY + 80, 'Kenney Assets', nameStyle).setOrigin(0.5);
        currentY += lineSpacing;

        // Player Art
        this.add.text(centerX, currentY + 80, 'Player Asset', roleStyle).setOrigin(0.5);
        this.add.text(centerX, currentY + 120, 'ZeggyGames', nameStyle).setOrigin(0.5);

        // --- Main Menu Button ---
        const mainMenuButton = this.add.text(centerX, this.cameras.main.height - 80, 'Main Menu', buttonStyle)
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true });

        mainMenuButton.on('pointerdown', () => {
            this.scene.start('mainMenuScene');
        });
        mainMenuButton.on('pointerover', () => mainMenuButton.setStyle(buttonHoverStyle));
        mainMenuButton.on('pointerout', () => mainMenuButton.setStyle(buttonStyle));
    }
}