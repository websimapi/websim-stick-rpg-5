export class Controls {
    constructor() {
        this.movement = { x: 0, y: 0 };
        this.keys = {};
        this.touch = {};

        // Keyboard
        window.addEventListener('keydown', (e) => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', (e) => this.keys[e.key.toLowerCase()] = false);

        // On-screen D-pad
        const dpadButtons = document.querySelectorAll('.d-pad-btn');
        dpadButtons.forEach(btn => {
            btn.addEventListener('touchstart', (e) => this.handleTouch(e, btn.id, true));
            btn.addEventListener('touchend', (e) => this.handleTouch(e, btn.id, false));
            btn.addEventListener('touchcancel', (e) => this.handleTouch(e, btn.id, false));
            btn.addEventListener('mousedown', (e) => this.handleTouch(e, btn.id, true));
            btn.addEventListener('mouseup', (e) => this.handleTouch(e, btn.id, false));
            btn.addEventListener('mouseleave', (e) => this.handleTouch(e, btn.id, false));
        });

        setInterval(() => this.updateMovement(), 16);
    }

    handleTouch(e, id, isPressed) {
        e.preventDefault();
        this.touch[id] = isPressed;
    }

    updateMovement() {
        let x = 0;
        let y = 0;

        if (this.keys['arrowup'] || this.keys['w'] || this.touch['up']) y = -1;
        if (this.keys['arrowdown'] || this.keys['s'] || this.touch['down']) y = 1;
        if (this.keys['arrowleft'] || this.keys['a'] || this.touch['left']) x = -1;
        if (this.keys['arrowright'] || this.keys['d'] || this.touch['right']) x = 1;
        
        // Normalize for diagonal movement
        if (x !== 0 && y !== 0) {
            const L = Math.sqrt(x*x + y*y);
            x = x / L;
            y = y / L;
        }

        this.movement.x = x;
        this.movement.y = y;
    }
}

