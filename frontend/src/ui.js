/**
 * State Global Game & UI Logic
 */
export const G = {
    inv: [],
    hotbar: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    selectedSlot: 0
};

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

        // Nomor Slot (1-9)
        const numSpan = document.createElement('span');
        numSpan.className = 'slot-num';
        numSpan.textContent = slotIndex + 1;
        slotDiv.appendChild(numSpan);

        // Tampilkan item jika ada di inventory index ini
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

        // Click Event untuk memilih slot
        slotDiv.addEventListener('click', () => {
            G.selectedSlot = slotIndex;
            updateHotbarUI();
            console.log(`[Hotbar] Slot ${slotIndex + 1} dipilih`);
        });

        hotbarEl.appendChild(slotDiv);
    });
}

/**
 * Inisialisasi UI State & Keyboard Listeners (Tombol 1-9)
 */
export function initUI() {
    updateHotbarUI();

    // Event listener keyboard untuk angka 1 sampai 9
    window.addEventListener('keydown', (e) => {
        // Jangan jalankan hotbar jika user sedang mengetik di input text
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

        const key = e.key;
        if (key >= '1' && key <= '9') {
            const index = parseInt(key, 10) - 1;
            if (index >= 0 && index < 9) {
                G.selectedSlot = index;
                updateHotbarUI();
                console.log(`[Hotbar Keyboard] Slot ${index + 1} dipilih`);
            }
        }
    });
}
