import { Player } from './player.js';
import { Enemy } from './enemy.js';
import { World } from './world.js';
import { Controls } from './controls.js';
import { UI } from './ui.js';
import { Sound } from './sound.js';
import { Combat } from './combat.js';

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gameState = 'explore'; // 'explore', 'combat', 'paused'
        this.sound = new Sound();
        this.ui = new UI();

        // Resize first to get dimensions.
        this.resize();

        this.world = new World(this.canvas.width, this.canvas.height);
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2);
        this.enemies = [
            new Enemy(this.canvas.width * 0.75, this.canvas.height * 0.5), 
            new Enemy(this.canvas.width * 0.25, this.canvas.height * 0.75)
        ];
        this.controls = new Controls();
        this.combat = null;
        this.lastTime = 0;
        
        window.addEventListener('resize', () => this.resize());
    }

    async init() {
        await this.sound.init();
        await Promise.all([
            this.world.init(),
            this.player.init(),
            ...this.enemies.map(e => e.init())
        ]);
        this.startGameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        if (this.world) {
            this.world.width = this.canvas.width;
            this.world.height = this.canvas.height;
        }
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
            this.player.update(deltaTime, this.controls.movement, this.world);
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
        this.world.draw(this.ctx);
        if(this.gameState !== 'combat' || (this.combat && this.combat.attackingEnemy)) {
             this.player.draw(this.ctx);
        }
       
        this.enemies.forEach(enemy => {
            if(enemy.isAlive && (this.gameState !== 'combat' || this.combat.enemy === enemy)) {
                enemy.draw(this.ctx);
            }
        });

        this.ui.updatePlayerHP(this.player.hp, this.player.maxHp);
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
}

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
game.init();