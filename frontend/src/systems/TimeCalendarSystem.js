import Phaser from 'phaser';
/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║            NUSATOPIA TIME & CALENDAR SYSTEM              ║
 * ║  Sistem Musim Nusantara (Hujan, Kemarau, Pancaroba),     ║
 * ║  Waktu In-Game, Ambient Lighting, & Weather              ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export const SEASONS = {
    HUJAN: { id: 'hujan', name: 'Musim Hujan', icon: '🌧️', bonusCrop: 'padi', color: '#4eb4ac' },
    KEMARAU: { id: 'kemarau', name: 'Musim Kemarau', icon: '☀️', bonusCrop: 'rempah', color: '#e67e22' },
    PANCAROBA: { id: 'pancaroba', name: 'Musim Pancaroba', icon: '🍃', bonusCrop: 'jagung', color: '#27ae60' }
};

export class TimeCalendarSystem {
    constructor(scene) {
        this.scene = scene;

        // State waktu
        this.hour = 6;       // 06:00 pagi
        this.minute = 0;
        this.day = 1;        // Hari 1 - 28
        this.seasonIndex = 0; // 0=Hujan, 1=Kemarau, 2=Pancaroba
        this.year = 1;

        this.seasonList = [SEASONS.HUJAN, SEASONS.KEMARAU, SEASONS.PANCAROBA];
        this.weather = 'Cerah'; // Cerah, Hujan, Hujan Lebat

        // Timer pergerakan waktu (1 detik nyata = 2 menit in-game)
        this.tickRateMs = 1000;
        this.timerEvent = null;
    }

    init() {
        if (this.timerEvent) this.timerEvent.destroy();

        this.timerEvent = this.scene.time.addEvent({
            delay: this.tickRateMs,
            callback: this.tick,
            callbackScope: this,
            loop: true
        });

        this.updateAmbientLighting();
        this.updateUI();
    }

    tick() {
        this.minute += 10;
        if (this.minute >= 60) {
            this.minute = 0;
            this.hour += 1;
        }

        // Jika lewat pukul 02:00 malam -> Player dipaksa tidur/reset hari
        if (this.hour >= 26 || (this.hour >= 2 && this.hour < 6)) {
            this.nextDay();
            return;
        }

        this.updateAmbientLighting();
        this.updateUI();
    }

    nextDay() {
        this.hour = 6;
        this.minute = 0;
        this.day += 1;

        if (this.day > 28) {
            this.day = 1;
            this.seasonIndex = (this.seasonIndex + 1) % this.seasonList.length;
            if (this.seasonIndex === 0) {
                this.year += 1;
            }
        }

        // Tentukan cuaca hari ini
        const currentSeason = this.getCurrentSeason();
        const rand = Math.random();
        if (currentSeason.id === 'hujan') {
            this.weather = rand < 0.65 ? 'Hujan' : (rand < 0.85 ? 'Hujan Lebat' : 'Cerah');
        } else if (currentSeason.id === 'kemarau') {
            this.weather = rand < 0.85 ? 'Cerah' : 'Hujan';
        } else {
            this.weather = rand < 0.5 ? 'Cerah' : 'Hujan';
        }

        // Callback ke FarmingSystem & NPCManager
        if (this.scene.farmingSystem) {
            this.scene.farmingSystem.onNewDay(this.weather === 'Hujan' || this.weather === 'Hujan Lebat');
        }
        if (this.scene.npcManager) {
            this.scene.npcManager.onNewDay(this.getCurrentSeason().id);
        }

        // Trigger Auto-Save Asinkron saat pemain berganti hari/tidur
        if (this.scene.saveManager) {
            this.scene.saveManager.autoSave();
        }

        this.updateAmbientLighting();
        this.updateUI();

        // Notifikasi Selamat Pagi
        if (window.showToast) {
            window.showToast(`Selamat Pagi! Hari ${this.day} - ${this.getCurrentSeason().name} (${this.weather})`);
        }
    }

    getCurrentSeason() {
        return this.seasonList[this.seasonIndex];
    }

    getFormattedTime() {
        const h = String(this.hour % 24).padStart(2, '0');
        const m = String(this.minute).padStart(2, '0');
        return `${h}:${m}`;
    }

    updateAmbientLighting() {
        if (!this.scene || !this.scene.cameras || !this.scene.cameras.main) return;

        // Buat overlay layer jika belum ada
        if (!this.ambientOverlay) {
            const w = this.scene.physics.world.bounds.width;
            const h = this.scene.physics.world.bounds.height;
            this.ambientOverlay = this.scene.add.rectangle(w/2, h/2, w, h, 0x000000);
            this.ambientOverlay.setDepth(9998); // Di bawah UI (9999) tapi di atas semuanya
            this.ambientOverlay.setBlendMode(Phaser.BlendModes.MULTIPLY);
            this.ambientOverlay.setAlpha(0);
        }

        const hour = this.hour;

        // Reset tween yang sedang berjalan agar warna transisi mulus
        this.scene.tweens.killTweensOf(this.ambientOverlay);

        if (hour >= 6 && hour < 16) {
            // Pagi - Siang Cerah (Warna Normal)
            this.scene.tweens.add({ targets: this.ambientOverlay, alpha: 0, duration: 3000 });
        } else if (hour >= 16 && hour < 19) {
            // Sore Kemarau (Sunset Jingga)
            this.ambientOverlay.fillColor = 0xe67e22; 
            this.scene.tweens.add({ targets: this.ambientOverlay, alpha: 0.35, duration: 4000 });
        } else if (hour >= 19 || hour < 4) {
            // Malam Hari (Malam Biru Gelap)
            this.ambientOverlay.fillColor = 0x0a0a2a; 
            this.scene.tweens.add({ targets: this.ambientOverlay, alpha: 0.70, duration: 4000 });
        } else {
            // Fajar (Dawn / Transisi ke Siang)
            this.ambientOverlay.fillColor = 0xffa07a; 
            this.scene.tweens.add({ targets: this.ambientOverlay, alpha: 0.3, duration: 3000 });
        }
    }

    updateUI() {
        const timeEl = document.getElementById('hud-time');
        const seasonEl = document.getElementById('hud-season');
        const dayEl = document.getElementById('hud-day');
        const weatherEl = document.getElementById('hud-weather');

        if (timeEl) timeEl.textContent = this.getFormattedTime();
        if (seasonEl) {
            const season = this.getCurrentSeason();
            seasonEl.textContent = `${season.icon} ${season.name}`;
        }
        if (dayEl) dayEl.textContent = `Hari ${this.day}, Thn ${this.year}`;
        if (weatherEl) weatherEl.textContent = `☁️ ${this.weather}`;
    }
}
