import { G } from '../ui';

export class SaveManager {
    constructor(scene) {
        this.scene = scene;
        this.playerId = 'player_1'; // Untuk demo ini kita hardcode satu slot player
    }

    async autoSave() {
        if (window.showToast) window.showToast('💾 Menyimpan game... (Auto-Save)');
        
        // 1. Kumpulkan data posisi Player
        const px = this.scene.player ? Math.round(this.scene.player.x) : 0;
        const py = this.scene.player ? Math.round(this.scene.player.y) : 0;
        
        // 2. Kumpulkan isi Inventory (Filter item kosong)
        const inventory = G.inv.filter(item => item !== null).map(item => ({
            id: item.id,
            qty: item.qty
        }));
        
        // 3. Kumpulkan data Waktu Kalender
        let timeData = { day: 1, season: 'hujan', year: 1 };
        if (this.scene.timeCalendarSystem) {
            const tc = this.scene.timeCalendarSystem;
            timeData = {
                day: tc.day,
                season: tc.getCurrentSeason().id,
                year: tc.year
            };
        }
        
        // 4. Kumpulkan progress relasi NPC
        const npcs = [];
        if (this.scene.npcManager && this.scene.npcManager.relationships) {
            this.scene.npcManager.relationships.forEach((data, id) => {
                npcs.push({ id: id, hearts: data.hearts });
            });
        }
        
        // 5. Rakit JSON Payload
        const payload = {
            player_id: this.playerId,
            position: { x: px, y: py },
            inventory: inventory,
            time: timeData,
            npcs: npcs
        };
        
        try {
            // Lakukan Fetch API POST ke Laravel Endpoint secara Async
            const response = await fetch('http://localhost:8000/api/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const result = await response.json();
            
            if (response.ok && result.status === 'success') {
                console.log('[Auto-Save] Berhasil menyimpan progress.', result);
                if (window.showToast) window.showToast('✅ Auto-Save berhasil!');
            } else {
                console.warn('[Auto-Save] Gagal', result);
                if (window.showToast) window.showToast('❌ Gagal menyimpan: ' + (result.message || 'Error validasi/cheat'));
            }
        } catch (err) {
            console.error('[Auto-Save] Jaringan terputus', err);
            if (window.showToast) window.showToast('❌ Gagal terhubung ke server untuk Save.');
        }
    }
}
