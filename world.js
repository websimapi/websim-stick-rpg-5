async function loadImage(src) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = src;
    });
}

export class World {
    constructor() {
        this.backgroundImage = null;
        this.width = 800; // Corresponds to canvas size
        this.height = 450;
    }

    async init() {
        this.backgroundImage = await loadImage('background.png');
    }

    draw(ctx) {
        if (this.backgroundImage) {
            const pattern = ctx.createPattern(this.backgroundImage, 'repeat');
            ctx.fillStyle = pattern;
            ctx.fillRect(0, 0, this.width, this.height);
        } else {
            ctx.fillStyle = '#5a842f';
            ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    isWalkable(x, y, width, height) {
        // Simple boundary check for now
        const halfWidth = width / 2;
        const fullHeight = height;
        if (x - halfWidth < 0 || x + halfWidth > this.width || y - fullHeight < 0 || y > this.height) {
            return false;
        }
        return true;
    }
}

