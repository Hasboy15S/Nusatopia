/**
 * State Global Game & UI Logic
 */
export const G = {
    inv: [
        { id: 'cangkul_kayu', name: 'Cangkul Kayu', qty: 1, icon: '⛏️' },
        { id: 'ember_air', name: 'Ember Siram Air', qty: 1, icon: '💧' },
        { id: 'seed_padi', cropId: 'padi', name: 'Bibit Padi Sawah', qty: 5, icon: '🌾' },
        { id: 'seed_jagung', cropId: 'jagung', name: 'Bibit Jagung Hibrida', qty: 5, icon: '🌽' },
        { id: 'wood', name: 'Kayu', qty: 10, icon: '<img src="/assets/Resources/Wood/W_Idle.png" width="32" height="32" style="object-fit:none; object-position: left;"/>' }
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
            
            if (item.icon && item.icon.startsWith('<img')) {
                iconSpan.innerHTML = item.icon;
            } else {
                iconSpan.textContent = item.icon || '📦';
            }
            
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

    // Mouse Wheel Listener untuk Navigasi Hotbar
    window.addEventListener('wheel', (e) => {
        // Hanya proses scroll jika tidak ada overlay/modal yang terbuka
        const jurnalOpen = document.getElementById('jurnal-overlay')?.style.display === 'flex';
        const marketOpen = document.getElementById('market-modal')?.style.display === 'flex';
        const npcOpen = document.getElementById('npc-dialog-modal')?.style.display === 'flex';
        
        if (jurnalOpen || marketOpen || npcOpen) return;

        if (e.deltaY > 0) {
            // Scroll Bawah -> Geser ke Kanan
            G.selectedSlot = (G.selectedSlot + 1) % G.hotbar.length;
        } else if (e.deltaY < 0) {
            // Scroll Atas -> Geser ke Kiri
            G.selectedSlot = (G.selectedSlot - 1 + G.hotbar.length) % G.hotbar.length;
        }
        updateHotbarUI();
    });
}
