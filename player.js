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
        this.image = null;
    }

    async init() {
        this.image = await loadImage('player.png');
    }

    update(deltaTime, movement, world) {
        if (movement.x !== 0 || movement.y !== 0) {
            // World is now infinite, so we don't need world.isWalkable boundary checks
            this.x += movement.x * this.speed * deltaTime;
            this.y += movement.y * this.speed * deltaTime;
        }
    }

    draw(ctx, screenX, screenY) {
        if (this.image) {
            const drawX = screenX - this.width / 2;
            const drawY = screenY - this.height;
            ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
        } else {
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