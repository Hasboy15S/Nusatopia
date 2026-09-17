/**
 * State Global Game & UI Logic
 */
export const G = {
    inv: [
        { id: 'cangkul_kayu', name: 'Cangkul Kayu', qty: 1, icon: '⛏️' },
        { id: 'ember_air', name: 'Ember Siram Air', qty: 1, icon: '💧' },
        { id: 'seed_padi', cropId: 'padi', name: 'Bibit Padi Sawah', qty: 5, icon: '🌾' },
        { id: 'seed_jagung', cropId: 'jagung', name: 'Bibit Jagung Hibrida', qty: 5, icon: '🌽' },
        { id: 'wood', name: 'Kayu', qty: 10, icon: '🪵' }
    ],
    hotbar: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    selectedSlot: 0
};

/**
 * Toast Notification Helper
 */
export function showToast(message) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast-item';
    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 3000);
}
window.showToast = showToast;

/**
 * Me-render dan mengupdate tampilan Hotbar UI di HTML
 */
export function updateHotbarUI() {
    const hotbarEl = document.getElementById('hotbar');
    if (!hotbarEl) return;

    hotbarEl.innerHTML = '';
    G.hotbar.forEach((itemIndex, slotIndex) => {
        const slotDiv = document.createElement('div');
        slotDiv.className = `slot ${slotIndex === G.selectedSlot ? 'active' : ''}`;
        slotDiv.dataset.index = slotIndex;

        const numSpan = document.createElement('span');
        numSpan.className = 'slot-num';
        numSpan.textContent = slotIndex + 1;
        slotDiv.appendChild(numSpan);

        if (G.inv[slotIndex]) {
            const item = G.inv[slotIndex];
            const iconSpan = document.createElement('div');
            iconSpan.className = 'slot-item';
            iconSpan.textContent = item.icon || '📦';
            
            const qtySpan = document.createElement('span');
            qtySpan.className = 'slot-qty';
            qtySpan.textContent = item.qty;

            slotDiv.appendChild(iconSpan);
            slotDiv.appendChild(qtySpan);
        }

        slotDiv.addEventListener('click', () => {
            G.selectedSlot = slotIndex;
            updateHotbarUI();
        });

        hotbarEl.appendChild(slotDiv);
    });
}

/**
 * Inisialisasi UI State & Modals
 */
export function initUI(scene) {
    updateHotbarUI();

    // Modal Tutup Handlers
    const setupModalClose = (btnId, modalId) => {
        const btn = document.getElementById(btnId);
        const modal = document.getElementById(modalId);
        if (btn && modal) {
            btn.onclick = () => {
                modal.style.display = 'none';
                if (scene && scene.scene) scene.scene.resume();
            };
        }
    };

    setupModalClose('jurnal-tutup-btn', 'jurnal-overlay');
    setupModalClose('market-tutup-btn', 'market-modal');
    setupModalClose('npc-close-btn', 'npc-dialog-modal');

    // Jurnal Button in Topbar
    const btnJurnal = document.getElementById('btn-jurnal');
    if (btnJurnal) {
        btnJurnal.onclick = () => {
            if (scene && scene.cultureJurnalSystem) {
                scene.cultureJurnalSystem.showJurnalModal('Buku Jurnal Nusantara', 'Kumpulkan trivia warisan budaya dari situs candi dan sanggar batik!');
            }
        };
    }

    // Keyboard Listeners
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key;
        if (key >= '1' && key <= '9') {
            const index = parseInt(key, 10) - 1;
            if (index >= 0 && index < 9) {
                G.selectedSlot = index;
                updateHotbarUI();
            }
        }
        if (key.toLowerCase() === 'j') {
            if (scene && scene.cultureJurnalSystem) {
                scene.cultureJurnalSystem.showJurnalModal('Buku Jurnal Nusantara', 'Kumpulkan trivia warisan budaya dari situs candi dan sanggar batik!');
            }
        }
    });
}
