// SummaryScene.js
class SummaryScene extends Phaser.Scene {
    constructor() {
        super("summaryScene"); // Keep the same key for simplicity
    }

    init(data) {
        this.stats = data; // Data from Level1: deaths, collectibles, totalCollectibles, levelKey, isEndOfGame
    }

    formatTime(milliseconds) {
        if (typeof milliseconds === 'undefined' || milliseconds < 0) {
            return "N/A";
        }
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        const ms = Math.floor((milliseconds % 1000) / 10); // Show centiseconds (hundredths of a second)

        const paddedMinutes = String(minutes).padStart(2, '0');
        const paddedSeconds = String(seconds).padStart(2, '0');
        const paddedMs = String(ms).padStart(2, '0');

        return `${paddedMinutes}:${paddedSeconds}.${paddedMs}`;
    }

    create() {
        this.cameras.main.setBackgroundColor('#1e1e1e'); // Dark background

        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;

        // Define font styles (use your loaded fonts if available, otherwise fallback)
        const titleStyle = { fontSize: '60px', fill: '#90ee90', fontFamily: 'Arial, sans-serif' }; // Light green
        const statsStyle = { fontSize: '40px', fill: '#ffffff', fontFamily: 'Arial, sans-serif' };
        const buttonStyle = { fontSize: '36px', fill: '#87ceeb', backgroundColor: '#333333', padding: { x: 25, y: 15 }, fontFamily: 'Arial, sans-serif' }; // Sky blue text

        this.add.text(centerX, centerY - 200, 'Thanks for Playing!', titleStyle).setOrigin(0.5);

        this.add.text(centerX, centerY - 110, `Final Stats`, { fontSize: '44px', fill: '#cccccc', fontFamily: 'Arial, sans-serif' }).setOrigin(0.5);
        this.add.text(centerX, centerY - 60, `Time: ${this.formatTime(this.stats.timeTakenMs)}`, statsStyle).setOrigin(0.5);
        this.add.text(centerX, centerY - 10, `Deaths: ${this.stats.deaths}`, statsStyle).setOrigin(0.5); //
        this.add.text(centerX, centerY + 40, `Collectibles: ${this.stats.collectibles} / ${this.stats.totalCollectibles}`, statsStyle).setOrigin(0.5); //

        

        // "Play Again?" Button
        const playAgainButton = this.add.text(centerX, centerY + 180, 'Play Again?', buttonStyle)
            .setOrigin(0.5)
            .setInteractive();

        playAgainButton.on('pointerdown', () => {
            // Restart the level that was just played (Level1 in this case)
            if (this.stats.levelKey && this.scene.manager.keys[this.stats.levelKey]) {
                this.scene.start(this.stats.levelKey);
            } else {
                // Fallback if something went wrong with the levelKey
                console.warn("Could not determine which level to restart. Defaulting to level1Scene.");
                this.scene.start('level1Scene');
            }
        });

        // You could add a "Main Menu" button here if you had a main menu scene
        // const mainMenuButton = this.add.text(centerX, centerY + 260, 'Main Menu', buttonStyle)
        // .setOrigin(0.5)
        // .setInteractive();
        // mainMenuButton.on('pointerdown', () => {
        // this.scene.start('MainMenuScene'); // Assuming you have a 'MainMenuScene'
        // });
    }
}