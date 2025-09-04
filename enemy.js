async function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

export class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.hp = 30;
        this.maxHp = 30;
        this.attackPower = 5;
        this.isAlive = true;
        this.image = null;
    }

    async init() {
        this.image = await loadImage('enemy.png');
    }

    draw(ctx, screenX, screenY) {
        if (!this.isAlive) return;
        if (this.image) {
             const drawX = screenX - this.width / 2;
             const drawY = screenY - this.height;
            ctx.drawImage(this.image, drawX, drawY, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            const drawX = screenX - 15;
            const drawY = screenY - 50;
            ctx.fillRect(drawX, drawY, 30, 50);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        if (this.hp <= 0) {
            this.hp = 0;
            this.isAlive = false;
        }
    }
    
    attack(target) {
        const damage = Math.floor(this.attackPower + Math.random() * 3);
        target.takeDamage(damage);
        return damage;
    }
}