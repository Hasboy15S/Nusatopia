/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║            NUSATOPIA CULTURE JURNAL SYSTEM               ║
 * ║  Buku Jurnal Nusantara Collectible & Integrasi API       ║
 * ║  Laravel GET /api/trivia/{item_id}                       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export class CultureJurnalSystem {
    constructor(scene) {
        this.scene = scene;
        // Map item_id -> { namaItem, funFact, unlockedAt }
        this.unlockedEntries = new Map();
        this.totalEntriesCount = 3; // Borobudur, Batik, Angklung
    }

    init() {
        // Preset beberapa entry jika ada
    }

    async unlockEntry(itemId) {
        if (this.unlockedEntries.has(itemId)) {
            const existing = this.unlockedEntries.get(itemId);
            this.showJurnalModal(existing.namaItem, existing.funFact);
            return;
        }

        try {
            const response = await fetch(`http://localhost:8000/api/trivia/${itemId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const json = await response.json();
            const payload = json.data || json;
            const namaItem = payload.nama_item || itemId;
            const funFact = payload.fun_fact || 'Fakta sejarah menarik Nusantara.';

            this.unlockedEntries.set(itemId, { namaItem, funFact, unlockedAt: new Date().toLocaleTimeString() });
            
            this.showJurnalModal(namaItem, funFact);
            if (window.showToast) window.showToast(`📜 Entry Kebudayaan Baru Terbuka: ${namaItem}!`);
        } catch (err) {
            console.warn('[Jurnal API Fallback]', err);
            // Fallback offline data
            const fallbackData = {
                borobudur: { namaItem: 'Situs Borobudur', funFact: 'Candi Buddha terbesar di dunia yang dibangun abad ke-9 Masehi oleh Dinasti Syailendra.' },
                batik: { namaItem: 'Sanggar Batik', funFact: 'Batik Indonesia diakui UNESCO sebagai Warisan Kemanusiaan untuk Budaya Lisan dan Nonbendawi sejak 2009.' },
                angklung: { namaItem: 'Taman Angklung', funFact: 'Alat musik bambu multitonal khas Sunda yang dimainkan dengan cara digoyang.' }
            };

            const data = fallbackData[itemId] || { namaItem: itemId, funFact: 'Fakta sejarah Nusantara.' };
            this.unlockedEntries.set(itemId, data);
            this.showJurnalModal(data.namaItem, data.funFact);
        }
    }

    getProgressPercentage() {
        return Math.round((this.unlockedEntries.size / this.totalEntriesCount) * 100);
    }

    showJurnalModal(judul, deskripsi) {
        const overlay = document.getElementById('jurnal-overlay');
        const judulEl = document.getElementById('jurnal-judul');
        const deskripsiEl = document.getElementById('jurnal-deskripsi');
        const progressEl = document.getElementById('jurnal-progress');

        if (judulEl) judulEl.textContent = judul;
        if (deskripsiEl) deskripsiEl.textContent = deskripsi;
        if (progressEl) progressEl.textContent = `Pengetahuan Nusantara: ${this.unlockedEntries.size}/${this.totalEntriesCount} (${this.getProgressPercentage()}%)`;

        if (overlay) overlay.style.display = 'flex';
        if (this.scene && this.scene.scene) this.scene.scene.pause();
    }
}
