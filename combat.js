export class Combat {
    constructor(player, enemy, ui, sound, game) {
        this.player = player;
        this.enemy = enemy;
        this.ui = ui;
        this.sound = sound;
        this.game = game;
        this.turn = 'player';
        this.isOver = false;
    }

    start() {
        this.ui.logMessage(`A wild ${this.enemy.constructor.name} appears!`);
        this.ui.showCombatUI();
        this.ui.updateEnemyHP(this.enemy.hp, this.enemy.maxHp);
        
        this.attackHandler = () => this.playerTurn();
        this.fleeHandler = () => this.flee();

        this.ui.attackBtn.addEventListener('click', this.attackHandler);
        this.ui.fleeBtn.addEventListener('click', this.fleeHandler);
    }

    end() {
        this.isOver = true;
        this.ui.attackBtn.removeEventListener('click', this.attackHandler);
        this.ui.fleeBtn.removeEventListener('click', this.fleeHandler);
    }
    
    playerTurn() {
        if (this.turn !== 'player' || this.isOver) return;

        const damage = this.player.attack(this.enemy);
        this.ui.logMessage(`You hit for ${damage} damage!`);
        this.ui.updateEnemyHP(this.enemy.hp, this.enemy.maxHp);
        
        if (!this.enemy.isAlive) {
            this.win();
            return;
        }

        this.turn = 'enemy';
        setTimeout(() => this.enemyTurn(), 1000);
    }

    enemyTurn() {
        if (this.turn !== 'enemy' || this.isOver) return;

        const damage = this.enemy.attack(this.player);
        this.sound.playSound('hit_damage');
        this.ui.logMessage(`Enemy hits you for ${damage} damage!`);
        this.ui.updatePlayerHP(this.player.hp, this.player.maxHp);

        if (this.player.hp <= 0) {
            this.lose();
            return;
        }

        this.turn = 'player';
    }

    win() {
        this.ui.logMessage('You defeated the enemy!');
        this.sound.playSound('victory');
        this.end();
    }

    lose() {
        this.ui.logMessage('You have been defeated... Game Over.');
        // For now, just end combat. A real game would have a game over screen.
        this.end();
    }
    
    flee() {
        if (Math.random() > 0.5) {
            this.ui.logMessage('You successfully fled!');
            this.player.x += 50; // Move player away
            this.end();
        } else {
            this.ui.logMessage('You failed to flee!');
            this.turn = 'enemy';
            setTimeout(() => this.enemyTurn(), 1000);
        }
    }
}

