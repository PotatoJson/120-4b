// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.WEBGL,
    render: {
        pixelArt: true  // prevent pixel art from getting blurred when scaled
    },
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
            gravity: {
                x: 0,
                y: 0
            }
        }
    },
    width: 1200,
    height: 800,
    scale: {
        mode: Phaser.Scale.FIT, // Or Phaser.Scale.ENVELOP, Phaser.Scale.RESIZE
        autoCenter: Phaser.Scale.CENTER_BOTH // This will center the canvas
    },
    fps: {
        target: 60, // Set the target frame rate to 60 FPS
        forceSetTimeOut: true
    },
    scene: [Load, MainMenuScene, LevelSelectScene, LevelTutorial, LevelOG, Level1, Level2, SummaryScene, CreditsScene]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);