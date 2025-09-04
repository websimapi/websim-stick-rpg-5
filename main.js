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
        this.ctx.imageSmoothingEnabled = false;
        this.gameState = 'explore'; // 'explore', 'combat', 'paused'
        this.sound = new Sound();
        this.ui = new UI();

        // Resize first to get dimensions.
        this.resize();

        this.world = new World();
        this.player = new Player(0, 0); // Start at world origin
        this.controls = new Controls();
        this.combat = null;
        this.lastTime = 0;
        
        this.camera = {
            x: 0,
            y: 0
        };

        this.minimap = document.getElementById('minimap');
        this.mctx = this.minimap.getContext('2d', { alpha: true });
        this.mctx.imageSmoothingEnabled = false;

        window.addEventListener('resize', () => this.resize());
    }

    async init() {
        await this.sound.init();
        await Promise.all([
            this.world.init(),
            this.player.init()
        ]);
        this.startGameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.ctx.imageSmoothingEnabled = false;
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
            this.world.update(this.player.x, this.player.y);
            const nearbyEnemies = this.world.getEnemiesInRect(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
            nearbyEnemies.forEach(enemy => {
                const distance = Math.hypot(this.player.x - enemy.x, this.player.y - enemy.y);
                if (distance < 30) this.startCombat(enemy);
            });
        } else if (this.gameState === 'combat') {
            if (this.combat && this.combat.isOver) this.endCombat();
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
       
        const enemiesToDraw = this.world.getEnemiesInRect(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
        enemiesToDraw.forEach(enemy => {
            if (enemy.isAlive && (this.gameState !== 'combat' || this.combat.enemy === enemy)) {
                const screenX = enemy.x - this.camera.x;
                const screenY = enemy.y - this.camera.y;
                enemy.draw(this.ctx, screenX, screenY);
            }
        });

        this.ui.updatePlayerHP(this.player.hp, this.player.maxHp);
        this.drawMinimap();
    }

    startCombat(enemy) {
        this.gameState = 'combat';
        this.combat = new Combat(this.player, enemy, this.ui, this.sound, this);
        this.combat.start();
    }

    endCombat() {
        this.combat = null;
        this.gameState = 'explore';
        this.ui.hideCombatUI();
    }

    drawMinimap() {
        const el = this.minimap;
        const s = Math.min(el.clientWidth || 0, el.clientHeight || 0);
        if (s === 0) return;
        el.width = el.clientWidth; el.height = el.clientHeight;
        const ctx = this.mctx;
        ctx.clearRect(0,0,el.width,el.height);

        const gridRadius = 3;
        const cell = Math.floor(el.width / (gridRadius*2 + 1));
        const centerX = Math.floor(el.width / 2);
        const centerY = Math.floor(el.height / 2);

        const playerChunkX = Math.floor(this.player.x / 512);
        const playerChunkY = Math.floor(this.player.y / 512);

        for (let dy = -gridRadius; dy <= gridRadius; dy++) {
            for (let dx = -gridRadius; dx <= gridRadius; dx++) {
                const cx = playerChunkX + dx;
                const cy = playerChunkY + dy;
                const chunk = this.world.getChunk(cx, cy);
                const px = centerX + dx * cell - cell/2;
                const py = centerY + dy * cell - cell/2;
                ctx.fillStyle = (!chunk) ? 'rgba(255,255,255,0.1)' :
                    chunk.biome.name === 'FOREST' ? '#2e7d32' :
                    chunk.biome.name === 'DESERT' ? '#c79a3b' : '#3a7bd5';
                ctx.fillRect(px, py, cell-2, cell-2);
            }
        }
        // Player
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX-2, centerY-2, 4, 4);
        // Enemies
        ctx.fillStyle = '#ff3b30';
        const enemies = this.world.getEnemiesInRect(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);
        enemies.forEach(e => {
            const dx = (e.x - this.player.x) / 512; // chunk-relative
            const dy = (e.y - this.player.y) / 512;
            const ex = centerX + dx * cell;
            const ey = centerY + dy * cell;
            ctx.fillRect(ex-2, ey-2, 4, 4);
        });
    }
}

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
game.init();