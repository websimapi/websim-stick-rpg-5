const CHUNK_SIZE = 512;

const BIOMES = {
    GRASSLAND: {
        name: 'GRASSLAND',
        texture: 'background.png',
        color: '#7CFC00', // lawn green for minimap
        spawnChance: 0.3,
        maxEnemies: 2,
        neighbors: [ // Biome, weight
            ['GRASSLAND', 10],
            ['FOREST', 2],
            ['DESERT', 1]
        ]
    },
    FOREST: {
        name: 'FOREST',
        texture: 'forest_background.png',
        color: '#228B22', // forest green
        spawnChance: 0.5,
        maxEnemies: 3,
        neighbors: [
            ['GRASSLAND', 2],
            ['FOREST', 10]
        ]
    },
    DESERT: {
        name: 'DESERT',
        texture: 'desert_background.png',
        color: '#F4A460', // sandy brown
        spawnChance: 0.2,
        maxEnemies: 1,
        neighbors: [
            ['GRASSLAND', 2],
            ['DESERT', 10]
        ]
    }
};

async function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

class Chunk {
    constructor(chunkX, chunkY, biome) {
        this.x = chunkX;
        this.y = chunkY;
        this.biome = biome;
        this.backgroundImage = null;
        this.pattern = null;
        this.hasSpawned = false; // To prevent respawning on chunk reload
    }

    async init() {
        this.backgroundImage = await loadImage(this.biome.texture);
    }

    draw(ctx, offsetX, offsetY) {
        if (!this.backgroundImage) return;

        if (!this.pattern) {
             this.pattern = ctx.createPattern(this.backgroundImage, 'repeat');
        }
        
        ctx.save();
        ctx.fillStyle = this.pattern;
        
        // Translate the canvas so the pattern's origin aligns with the world's origin
        // This makes the pattern scroll with the camera.
        ctx.translate(-offsetX, -offsetY);
        
        // Fill a rectangle covering the entire canvas. The pattern will be correctly positioned.
        // We do this inside each chunk's draw but it's for the specific biome texture.
        ctx.fillRect(offsetX, offsetY, ctx.canvas.width, ctx.canvas.height);
        
        ctx.restore();
    }
}

export class World {
    constructor() {
        this.chunks = new Map();
        this.loadedTextures = new Map();
    }

    async init() {
        // No-op, chunks init themselves
    }
    
    getChunkKey(chunkX, chunkY) {
        return `${chunkX},${chunkY}`;
    }

    getChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);
        return this.chunks.get(key);
    }

    generateChunk(chunkX, chunkY) {
        const key = this.getChunkKey(chunkX, chunkY);
        if (this.chunks.has(key)) return { chunk: this.chunks.get(key), spawnPoints: [] };
        
        // Biome generation based on neighbors
        const neighborBiomes = [];
        const neighbors = [
            this.getChunk(chunkX + 1, chunkY),
            this.getChunk(chunkX - 1, chunkY),
            this.getChunk(chunkX, chunkY + 1),
            this.getChunk(chunkX, chunkY - 1)
        ].filter(Boolean);

        if (neighbors.length > 0) {
             neighbors.forEach(n => {
                const biomeData = BIOMES[n.biome.name];
                if (biomeData && biomeData.neighbors) {
                    neighborBiomes.push(...biomeData.neighbors);
                }
            });
        } else {
            // First chunk
             neighborBiomes.push(...BIOMES.GRASSLAND.neighbors);
        }
        
        const totalWeight = neighborBiomes.reduce((sum, [, weight]) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        let chosenBiomeName = 'GRASSLAND';

        for (const [biomeName, weight] of neighborBiomes) {
            if (random < weight) {
                chosenBiomeName = biomeName;
                break;
            }
            random -= weight;
        }

        const biome = BIOMES[chosenBiomeName];
        const chunk = new Chunk(chunkX, chunkY, biome);
        chunk.init(); // Start loading texture
        this.chunks.set(key, chunk);
        
        const spawnPoints = this.getSpawnPointsForChunk(chunk);

        return { chunk, spawnPoints };
    }

    getSpawnPointsForChunk(chunk) {
        if (chunk.hasSpawned) return [];

        const spawnPoints = [];
        const biome = chunk.biome;

        if (Math.random() < biome.spawnChance) {
            const numEnemies = Math.floor(Math.random() * biome.maxEnemies) + 1;
            for (let i = 0; i < numEnemies; i++) {
                const x = chunk.x * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
                const y = chunk.y * CHUNK_SIZE + Math.random() * CHUNK_SIZE;
                spawnPoints.push({ x, y });
            }
        }
        chunk.hasSpawned = true;
        return spawnPoints;
    }

    update(playerX, playerY, isInitialLoad = false) {
        const playerChunkX = Math.floor(playerX / CHUNK_SIZE);
        const playerChunkY = Math.floor(playerY / CHUNK_SIZE);
        
        let allNewSpawnPoints = [];

        const loadDistance = 3; // Match minimap view distance

        // Load chunks in a grid around the player
        for (let y = -loadDistance; y <= loadDistance; y++) {
            for (let x = -loadDistance; x <= loadDistance; x++) {
                const { spawnPoints } = this.generateChunk(playerChunkX + x, playerChunkY + y);
                
                // Only spawn enemies in the immediate 3x3 area around the player
                if (!isInitialLoad && Math.abs(x) <= 1 && Math.abs(y) <= 1) {
                    allNewSpawnPoints.push(...spawnPoints);
                }
            }
        }
        return allNewSpawnPoints;
    }

    draw(ctx, cameraX, cameraY, canvasWidth, canvasHeight) {
        const startChunkX = Math.floor(cameraX / CHUNK_SIZE);
        const startChunkY = Math.floor(cameraY / CHUNK_SIZE);
        const endChunkX = Math.floor((cameraX + canvasWidth) / CHUNK_SIZE);
        const endChunkY = Math.floor((cameraY + canvasHeight) / CHUNK_SIZE);

        for (let y = startChunkY; y <= endChunkY; y++) {
            for (let x = startChunkX; x <= endChunkX; x++) {
                const chunk = this.getChunk(x, y);
                if(chunk) {
                    // Set clipping region for this chunk
                    ctx.save();
                    const screenX = x * CHUNK_SIZE - cameraX;
                    const screenY = y * CHUNK_SIZE - cameraY;
                    ctx.beginPath();
                    ctx.rect(screenX, screenY, CHUNK_SIZE, CHUNK_SIZE);
                    ctx.clip();

                    // Draw the chunk's background, which will be clipped to its area
                    chunk.draw(ctx, cameraX, cameraY);
                    
                    ctx.restore();
                }
            }
        }
    }
    
    isWalkable(x, y, width, height) {
        // World is infinite, so no boundary checks.
        // This can be expanded later for collision with objects within chunks.
        return true;
    }
}