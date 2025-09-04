import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { World } from './world.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { Sound } from './sound.js';
import { Combat } from './combat.js';
import { Minimap } from './minimap.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        this.gameState = 'explore'; // 'explore', 'combat', 'paused'
        this.sound = new Sound();
        this.ui = new UI();

        this.world = new World();
        this.player = new Player(0, 0); // Start at world origin
        this.enemies = []; // Start with no enemies, they will spawn
        this.controls = new Controls();
        this.combat = null;
        this.lastTime = 0;
        
        this.camera = {
            x: 0,
            y: 0
        };

        this.minimap = new Minimap(
            document.getElementById('minimap-canvas'),
            this.world,
            this.player,
            this.enemies
        );

        // Resize first to get dimensions. Must be called after minimap is initialized.
        this.resize();
        
        window.addEventListener('resize', () => this.resize());
    }

    async init() {
        await this.sound.init();
        await this.world.init();
        await this.player.init();
        // Initial world update to spawn first chunk without enemies
        this.world.update(this.player.x, this.player.y, true);
        
        this.startGameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
        this.minimap.resize();
    }

    startGameLoop() {
        this.gameLoop(0);
    }

    gameLoop(timestamp) {
        const deltaTime = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        if (this.gameState === 'explore') {
            this.player.update(deltaTime, this.controls.movement);
            const newSpawnPoints = this.world.update(this.player.x, this.player.y);
            this.spawnEnemies(newSpawnPoints);

            this.enemies.forEach(enemy => {
                if(enemy.isAlive) {
                    const distance = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
                    if (distance < 30) {
                        this.startCombat(enemy);
                    }
                }
            });
        } else if (this.gameState === 'combat') {
           if (this.combat && this.combat.isOver) {
               this.endCombat();
           }
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Update camera to follow player
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;

        this.world.draw(this.ctx, this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
        
        if(this.gameState !== 'combat' || (this.combat && this.combat.attackingEnemy)) {
             // Player is always drawn in the center of the screen
             this.player.draw(this.ctx, this.canvas.width / 2, this.canvas.height / 2);
        }
       
        this.enemies.forEach(enemy => {
            if(enemy.isAlive && (this.gameState !== 'combat' || this.combat.enemy === enemy)) {
                // Draw enemies relative to the camera
                const screenX = enemy.x - this.camera.x;
                const screenY = enemy.y - this.camera.y;

                // Culling: Don't draw if off-screen
                if (screenX > -enemy.width && screenX < this.canvas.width && screenY > -enemy.height && screenY < this.canvas.height) {
                    enemy.draw(this.ctx, screenX, screenY);
                }
            }
        });

        this.ui.updatePlayerHP(this.player.hp, this.player.maxHp);
        this.minimap.draw();
    }

    startCombat(enemy) {
        this.gameState = 'combat';
        this.combat = new Combat(this.player, enemy, this.ui, this.sound, this);
        this.combat.start();
    }

    endCombat() {
        if (!this.combat.enemy.isAlive) {
            const index = this.enemies.indexOf(this.combat.enemy);
            if (index > -1) {
                // Keep the enemy, just mark as dead
            }
        }
        this.combat = null;
        this.gameState = 'explore';
        this.ui.hideCombatUI();
    }

    spawnEnemies(spawnPoints) {
        spawnPoints.forEach(point => {
            const newEnemy = new Enemy(point.x, point.y);
            newEnemy.init(); // important to load image
            this.enemies.push(newEnemy);
        });
    }
}

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
game.init();