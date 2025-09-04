const CHUNK_SIZE = 512; 

export class Minimap {
    constructor(canvas, world, player, enemies) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.world = world;
        this.player = player;
        this.enemies = enemies;
        this.viewDistance = 3; 
        this.resize();
    }

    resize() {
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
    }

    draw() {
        if (!this.canvas.width || !this.canvas.height) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const playerChunkX = Math.floor(this.player.x / CHUNK_SIZE);
        const playerChunkY = Math.floor(this.player.y / CHUNK_SIZE);

        const totalChunks = this.viewDistance * 2 + 1;
        const minimapChunkSize = this.canvas.width / totalChunks;

        for (let y = -this.viewDistance; y <= this.viewDistance; y++) {
            for (let x = -this.viewDistance; x <= this.viewDistance; x++) {
                const chunkX = playerChunkX + x;
                const chunkY = playerChunkY + y;
                const chunk = this.world.getChunk(chunkX, chunkY);

                const drawX = (x + this.viewDistance) * minimapChunkSize;
                const drawY = (y + this.viewDistance) * minimapChunkSize;

                if (chunk) {
                    this.ctx.fillStyle = chunk.biome.color || '#333';
                } else {
                    this.ctx.fillStyle = '#111'; 
                }
                this.ctx.fillRect(drawX, drawY, minimapChunkSize, minimapChunkSize);
            }
        }

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.ctx.lineWidth = 1;
        for (let i = 1; i < totalChunks; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * minimapChunkSize, 0);
            this.ctx.lineTo(i * minimapChunkSize, this.canvas.height);
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.moveTo(0, i * minimapChunkSize);
            this.ctx.lineTo(this.canvas.width, i * minimapChunkSize);
            this.ctx.stroke();
        }

        this.ctx.fillStyle = 'blue';
        const playerDrawX = this.canvas.width / 2;
        const playerDrawY = this.canvas.height / 2;
        this.ctx.beginPath();
        this.ctx.arc(playerDrawX, playerDrawY, Math.max(2, minimapChunkSize / 8), 0, 2 * Math.PI);
        this.ctx.fill();

        this.enemies.forEach(enemy => {
            if (!enemy.isAlive) return;

            const dx = enemy.x - this.player.x;
            const dy = enemy.y - this.player.y;

            const mapRange = (this.viewDistance + 0.5) * CHUNK_SIZE;
            if (Math.abs(dx) < mapRange && Math.abs(dy) < mapRange) {
                const enemyMapX = playerDrawX + (dx / CHUNK_SIZE) * minimapChunkSize;
                const enemyMapY = playerDrawY + (dy / CHUNK_SIZE) * minimapChunkSize;

                this.ctx.fillStyle = 'red';
                this.ctx.beginPath();
                this.ctx.arc(enemyMapX, enemyMapY, Math.max(1.5, minimapChunkSize / 10), 0, 2 * Math.PI);
                this.ctx.fill();
            }
        });
    }
}

