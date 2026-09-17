/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║                NUSATOPIA NPC MANAGER                     ║
 * ║  Jadwal Harian Warga Desa, Relationship Meter (Hearts),  ║
 * ║  Dialog Interaktif, & Gift Giving                       ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export const VILLAGERS = {
    pak_pakih: { id: 'pak_pakih', name: 'Pak Pakih', role: 'Petani Senior', favoriteItem: 'padi', dialogs: [
        'Sugeng enjang, Mas! Sawah tahun ini kelihatan subur ya.',
        'Kalau mau padi tumbuh lebat, pastikan lahan dialiri air pas Musim Hujan!',
        'Bajak kerbau bisa mengolah 3x3 lahan sekaligus, lho.'
    ]},
    kang_ujang: { id: 'kang_ujang', name: 'Kang Ujang', role: 'Nelayan Pantai', favoriteItem: 'singkong', dialogs: [
        'Angin pantai lagi sejuk nih. Mau ikut memancing di laut?',
        'Ikan lele dan nila cocok dibudidayakan di kolam dekat rumahmu.'
    ]},
    bu_marni: { id: 'bu_marni', name: 'Bu Marni', role: 'Pengrajin Batik', favoriteItem: 'cengkeh', dialogs: [
        'Motif batik Parang ini melambangkan keteguhan dan perjuangan.',
        'Kalau kamu membawa cengkeh atau bahan pewarna alami, datang ke sanggarku ya!'
    ]},
    ki_narto: { id: 'ki_narto', name: 'Ki Narto', role: 'Dalang Wayang', favoriteItem: 'kopi', dialogs: [
        'Setiap lakon wayang menyimpan kearifan hidup leluhur kita.',
        'Nanti malam ada pementasan wayang kulit di balai desa, jangan lupa datang!'
    ]},
    mbok_sri: { id: 'mbok_sri', name: 'Mbok Sri', role: 'Pedagang Pasar', favoriteItem: 'cabai', dialogs: [
        'Belanja bibit tanaman atau jual hasil panenmu di pasarku ya!',
        'Harga rempah-rempah biasanya melonjak naik pas festival Panen Raya.'
    ]},
    mbah_joyo: { id: 'mbah_joyo', name: 'Mbah Joyo', role: 'Tetua Adat', favoriteItem: 'jahe', dialogs: [
        'Rawatlah tanah pulau ini dengan rasa syukur dan gotong royong.',
        'Artefak kuno yang kamu temukan di hutan menyimpan rahasia leluhur Nusatopia.'
    ]}
};

export class NPCManager {
    constructor(scene) {
        this.scene = scene;
        // Data hubungan: npc_id -> { hearts: 0..5, talkedToday: false, giftedToday: false }
        this.relationships = new Map();
    }

    init() {
        Object.keys(VILLAGERS).forEach(id => {
            if (!this.relationships.has(id)) {
                this.relationships.set(id, { hearts: 1, talkedToday: false, giftedToday: false });
            }
        });
    }

    onNewDay(seasonId) {
        this.relationships.forEach(rel => {
            rel.talkedToday = false;
            rel.giftedToday = false;
        });
    }

    talkToNPC(npcId) {
        const npcData = VILLAGERS[npcId];
        if (!npcData) return;

        const rel = this.relationships.get(npcId) || { hearts: 1, talkedToday: false, giftedToday: false };

        if (!rel.talkedToday) {
            rel.talkedToday = true;
            this.addHeartPoints(npcId, 10);
        }

        // Ambil dialog acak
        const randomDialog = npcData.dialogs[Math.floor(Math.random() * npcData.dialogs.length)];
        this.showNPCModal(npcData, randomDialog, rel.hearts);
    }

    giveGiftToNPC(npcId, itemId) {
        const npcData = VILLAGERS[npcId];
        const rel = this.relationships.get(npcId);

        if (!rel) return;
        if (rel.giftedToday) {
            if (window.showToast) window.showToast(`${npcData.name} sudah menerima hadiah darimu hari ini!`);
            return;
        }

        rel.giftedToday = true;
        const isFavorite = itemId === npcData.favoriteItem;
        const points = isFavorite ? 50 : 20;

        this.addHeartPoints(npcId, points);

        const responseMsg = isFavorite ? 
            `"Walah! Matur nuwun sanget! Ini barang kesukaanku!"` :
            `"Terima kasih banyak atas perhatianmu, anak muda!"`;

        this.showNPCModal(npcData, responseMsg, rel.hearts);
        if (window.showToast) window.showToast(`❤️ Hubungan dengan ${npcData.name} bertambah!`);
    }

    addHeartPoints(npcId, points) {
        const rel = this.relationships.get(npcId);
        if (!rel) return;

        rel.points = (rel.points || 0) + points;
        const newHearts = Math.min(5, Math.floor(rel.points / 100) + 1);
        rel.hearts = newHearts;
    }

    showNPCModal(npcData, message, hearts) {
        const modal = document.getElementById('npc-dialog-modal');
        const nameEl = document.getElementById('npc-name');
        const roleEl = document.getElementById('npc-role');
        const heartsEl = document.getElementById('npc-hearts');
        const msgEl = document.getElementById('npc-message');

        if (nameEl) nameEl.textContent = npcData.name;
        if (roleEl) roleEl.textContent = npcData.role;
        if (heartsEl) heartsEl.textContent = '❤️'.repeat(hearts) + '🤍'.repeat(5 - hearts);
        if (msgEl) msgEl.textContent = message;

        if (modal) modal.style.display = 'flex';
        if (this.scene && this.scene.scene) this.scene.scene.pause();
    }
}
