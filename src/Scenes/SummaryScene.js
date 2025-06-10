
class SummaryScene extends Phaser.Scene {
    constructor() {
        super("summaryScene");
    }

    init(data) {
        // Data from Level: deaths, collectibles, totalCollectibles, levelKey, nextLevelKey, isEndOfGame, timeTakenMs
        this.stats = data;
    }

    formatTime(milliseconds) {
        if (typeof milliseconds === 'undefined' || milliseconds < 0) {
            return "N/A";
        }
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10);

        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');
        const paddedMs = String(ms).padStart(2, '0');

        return `${paddedMinutes}:${paddedSeconds}.${paddedMs}`;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1e1e1e');

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // --- Styles ---
        const titleStyle = { fontSize: '60px', fill: '#90ee90', fontFamily: 'Arial, sans-serif' };
        const statsStyle = { fontSize: '40px', fill: '#ffffff', fontFamily: 'Arial, sans-serif' };
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

        // --- Title and Stats ---
        const completeText = this.stats.isEndOfGame ? 'Game Complete!' : 'Level Complete';
        this.add.text(centerX, centerY - 200, completeText, titleStyle).setOrigin(0.5);

        this.add.text(centerX, centerY - 110, `Level Stats`, { fontSize: '44px', fill: '#cccccc', fontFamily: 'Arial, sans-serif' }).setOrigin(0.5);
        this.add.text(centerX, centerY - 60, `Time: ${this.formatTime(this.stats.timeTakenMs)}`, statsStyle).setOrigin(0.5);
        this.add.text(centerX, centerY - 10, `Deaths: ${this.stats.deaths}`, statsStyle).setOrigin(0.5);
        this.add.text(centerX, centerY + 40, `Collectibles: ${this.stats.collectibles} / ${this.stats.totalCollectibles}`, statsStyle).setOrigin(0.5);

        // --- Horizontal Button Layout ---
        const buttonY = this.cameras.main.height - 80;
        const buttonSpacing = 300;

        // Check if the level was started from the level select screen
        if (this.stats.cameFrom === 'levelSelect') {
            // --- LEVEL SELECT BUTTON SET ---

            // 'Retry' Button (Left)
            const retryButton = this.add.text(centerX - buttonSpacing, buttonY, 'Retry', buttonStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
            retryButton.on('pointerdown', () => this.scene.start(this.stats.levelKey));
            // ... (add pointerover/out events)

            // 'Level Select' Button (Center)
            const levelSelectButton = this.add.text(centerX, buttonY, 'Level Select', buttonStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
            levelSelectButton.on('pointerdown', () => this.scene.start('levelSelectScene'));
            // ... (add pointerover/out events)

            // 'Main Menu' Button (Right)
            const mainMenuButton = this.add.text(centerX + buttonSpacing, buttonY, 'Main Menu', buttonStyle).setOrigin(0.5).setInteractive({ useHandCursor: true });
            mainMenuButton.on('pointerdown', () => this.scene.start('mainMenuScene'));
            // ... (add pointerover/out events)

        } else {
            // --- DEFAULT CAMPAIGN BUTTON SET ---

            // "Retry" Button (Center)
            const retryButton = this.add.text(centerX, buttonY, 'Retry', buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            retryButton.on('pointerdown', () => {
                this.scene.start(this.stats.levelKey);
            });
            retryButton.on('pointerover', () => retryButton.setStyle(buttonHoverStyle));
            retryButton.on('pointerout', () => retryButton.setStyle(buttonStyle));

            // "Main Menu" Button (Now on the Right)
            const mainMenuButton = this.add.text(centerX + buttonSpacing, buttonY, 'Main Menu', buttonStyle)
                .setOrigin(0.5)
                .setInteractive({ useHandCursor: true });
            mainMenuButton.on('pointerdown', () => {
                this.scene.start('mainMenuScene');
            });
            mainMenuButton.on('pointerover', () => mainMenuButton.setStyle(buttonHoverStyle));
            mainMenuButton.on('pointerout', () => mainMenuButton.setStyle(buttonStyle));

            // "Next Level" or "Next" Button (Now on the Left)
            if (!this.stats.isEndOfGame) {
                const nextLevelButton = this.add.text(centerX - buttonSpacing, buttonY, 'Next Level', buttonStyle)
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                nextLevelButton.on('pointerdown', () => {
                    this.scene.start(this.stats.nextLevelKey);
                });
                nextLevelButton.on('pointerover', () => nextLevelButton.setStyle(buttonHoverStyle));
                nextLevelButton.on('pointerout', () => nextLevelButton.setStyle(buttonStyle));
            } else {
                const finishButton = this.add.text(centerX - buttonSpacing, buttonY, 'Next', buttonStyle)
                    .setOrigin(0.5)
                    .setInteractive({ useHandCursor: true });
                finishButton.on('pointerdown', () => {
                    // On finish, go to the credits screen
                    this.scene.start('creditsScene');
                });
                finishButton.on('pointerover', () => finishButton.setStyle(buttonHoverStyle));
                finishButton.on('pointerout', () => finishButton.setStyle(buttonStyle));
            }
        }
    }
}