// Jim Whitehead
// Created: 4/14/2024
// Phaser: 3.70.0
//
// Cubey
//
// An example of putting sprites on the screen using Phaser
// 
// Art assets from Kenny Assets "Shape Characters" set:
// https://kenney.nl/assets/shape-characters

// debug with extreme prejudice
"use strict"

// game config
let config = {
    parent: 'phaser-game',
    type: Phaser.CANVAS,
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
    scene: [Load, Level1, SummaryScene]
}

var cursors;
const SCALE = 2.0;
var my = {sprite: {}, text: {}};

const game = new Phaser.Game(config);