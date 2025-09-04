const soundFiles = {
    sword_swing: 'sword_swing.mp3',
    hit_damage: 'hit_damage.mp3',
    victory: 'victory.mp3'
};

let audioContext;
const audioBuffers = {};

export class Sound {
    async init() {
        if (audioContext) return;
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        
        // Resume context on user gesture
        const resumeContext = () => {
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            document.body.removeEventListener('click', resumeContext);
            document.body.removeEventListener('touchstart', resumeContext);
        };
        document.body.addEventListener('click', resumeContext);
        document.body.addEventListener('touchstart', resumeContext);

        await this.loadAllSounds();
    }

    async loadSound(url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            return await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error loading sound: ${url}`, error);
            return null;
        }
    }

    async loadAllSounds() {
        const promises = Object.entries(soundFiles).map(async ([name, path]) => {
            audioBuffers[name] = await this.loadSound(path);
        });
        await Promise.all(promises);
    }
    
    playSound(name) {
        if (!audioContext || audioContext.state !== 'running' || !audioBuffers[name]) return;
        
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffers[name];
        source.connect(audioContext.destination);
        source.start(0);
    }
}

