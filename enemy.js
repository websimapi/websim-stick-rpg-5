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

    draw(ctx) {
        if (!this.isAlive) return;
        if (this.image) {
            ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height, this.width, this.height);
        } else {
            ctx.fillStyle = 'red';
            ctx.fillRect(this.x - 15, this.y - 50, 30, 50);
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

