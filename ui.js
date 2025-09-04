export class UI {
    constructor() {
        this.playerHpBar = document.getElementById('player-hp-bar');
        this.enemyHpBar = document.getElementById('enemy-hp-bar');
        this.messageLog = document.getElementById('message-log');
        this.combatUI = document.getElementById('combat-ui');
        this.attackBtn = document.getElementById('attack-btn');
        this.fleeBtn = document.getElementById('flee-btn');
    }

    updatePlayerHP(current, max) {
        const percent = (current / max) * 100;
        this.playerHpBar.style.width = `${percent}%`;
        this.playerHpBar.style.backgroundColor = percent > 50 ? '#0f0' : percent > 25 ? '#ff0' : '#f00';
    }

    updateEnemyHP(current, max) {
        const percent = (current / max) * 100;
        this.enemyHpBar.style.width = `${percent}%`;
    }

    logMessage(message) {
        const p = document.createElement('p');
        p.textContent = message;
        this.messageLog.prepend(p);
        if (this.messageLog.children.length > 5) {
            this.messageLog.lastChild.remove();
        }
    }

    showCombatUI() {
        this.combatUI.classList.remove('hidden');
    }

    hideCombatUI() {
        this.combatUI.classList.add('hidden');
    }
}

