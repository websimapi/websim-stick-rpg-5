import { Sound } from './sound.js';

const sound = new Sound();
sound.init();

async function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

const animationStates = {
    down: ['player_down_1.png', 'player_down_2.png'],
    up: ['player_up_1.png', 'player_up_2.png'],
    left: ['player_left_1.png', 'player_left_2.png'],
    right: ['player_right_1.png', 'player_right_2.png'],
};

export class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.speed = 150;
        this.hp = 100;
        this.maxHp = 100;
        this.attackPower = 10;
        
        this.images = {};
        this.direction = 'down';
        this.isMoving = false;
        this.animationFrame = 0;
        this.animationTimer = 0;
        this.animationSpeed = 0.2; // seconds per frame
    }

    async init() {
        for (const state in animationStates) {
            this.images[state] = await Promise.all(
                animationStates[state].map(src => loadImage(src))
            );
        }
    }

    update(deltaTime, movement, world) {
        this.isMoving = movement.x !== 0 || movement.y !== 0;

        if (this.isMoving) {
            // World is now infinite, so we don't need world.isWalkable boundary checks
            this.x += movement.x * this.speed * deltaTime;
            this.y += movement.y * this.speed * deltaTime;

            // Update direction based on movement
            if (Math.abs(movement.x) > Math.abs(movement.y)) {
                this.direction = movement.x > 0 ? 'right' : 'left';
            } else {
                this.direction = movement.y > 0 ? 'down' : 'up';
            }
            
            // Update animation frame
            this.animationTimer += deltaTime;
            if (this.animationTimer > this.animationSpeed) {
                this.animationTimer = 0;
                this.animationFrame = (this.animationFrame + 1) % this.images[this.direction].length;
            }
        } else {
            this.animationFrame = 0; // Reset to idle frame when not moving
            this.animationTimer = 0;
        }
    }

    draw(ctx, screenX, screenY) {
        const currentImages = this.images[this.direction];
        if (currentImages && currentImages.length > 0) {
            const image = currentImages[this.animationFrame];
            const drawX = screenX - this.width / 2;
            const drawY = screenY - this.height;
            ctx.drawImage(image, drawX, drawY, this.width, this.height);
        } else {
            // Fallback drawing if images are not loaded
            ctx.fillStyle = 'blue';
            const drawX = screenX - 15;
            const drawY = screenY - 50;
            ctx.fillRect(drawX, drawY, 30, 50);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp < 0) this.hp = 0;
    }

    attack(target) {
        sound.playSound('sword_swing');
        const damage = Math.floor(this.attackPower + Math.random() * 5);
        target.takeDamage(damage);
        return damage;
    }
}