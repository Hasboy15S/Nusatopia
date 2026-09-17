import { G, updateHotbarUI } from './ui.js';

export const RECIPES = [
    { id: 'cangkul_kayu', req: { wood: 3 }, name: 'Cangkul Kayu Traditional', icon: '⛏️', category: 'Alat' },
    { id: 'caping_bambu', req: { wood: 4 }, name: 'Caping Bambu Petani', icon: '👒', category: 'Alat' },
    { id: 'nasi_goreng', req: { padi: 2, cabai: 1 }, name: 'Nasi Goreng Rempah', icon: '🍳', category: 'Kuliner', price: 180 },
    { id: 'wedang_jahe', req: { jahe: 2 }, name: 'Wedang Jahe Warmth', icon: '☕', category: 'Kuliner', price: 150 },
    { id: 'jamu_kunyit', req: { kunyit: 2 }, name: 'Jamu Kunyit Asam', icon: '🍵', category: 'Kuliner', price: 160 },
    { id: 'keris_kayu', req: { wood: 5 }, name: 'Keris Kayu Ukir', icon: '🗡️', category: 'Kerajinan', price: 220 }
];

export function openCraftingPanel(scene) {
    const overlay = document.getElementById('craft-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        renderCraftingList();
    }
    if (scene && scene.scene) {
        scene.scene.pause();
    } else if (window.gameScene) {
        window.gameScene.scene.pause();
    }
}

export function initCraftingUI(scene) {
    const closeBtn = document.getElementById('craft-tutup-btn');
    const overlay = document.getElementById('craft-overlay');

    if (closeBtn && overlay) {
        closeBtn.addEventListener('click', () => {
            overlay.style.display = 'none';
            if (scene && scene.scene) {
                scene.scene.resume();
            } else if (window.gameScene) {
                window.gameScene.scene.resume();
            }
        });
    }

    const craftBtn = document.getElementById('btn-craft');
    if (craftBtn) {
        craftBtn.addEventListener('click', () => openCraftingPanel(scene));
    }

    // Keyboard listener untuk tombol 'C'
    window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
        if (e.key.toLowerCase() === 'c') {
            openCraftingPanel(scene);
        }
    });
}

export function renderCraftingList() {
    const listEl = document.getElementById('craft-list');
    if (!listEl) return;
    listEl.innerHTML = '';

    const invCounts = {};
    G.inv.forEach(item => {
        if (!invCounts[item.id]) invCounts[item.id] = 0;
        invCounts[item.id] += (item.qty || 1);
    });

    RECIPES.forEach(recipe => {
        const row = document.createElement('div');
        row.className = 'craft-item';

        let canCraft = true;
        let reqText = [];
        for (let reqItem in recipe.req) {
            const reqAmt = recipe.req[reqItem];
            const hasAmt = invCounts[reqItem] || 0;
            if (hasAmt < reqAmt) {
                canCraft = false;
            }
            reqText.push(`${reqItem} (${hasAmt}/${reqAmt})`);
        }

        row.innerHTML = `
            <div class="craft-info">
                <strong>${recipe.icon} ${recipe.name}</strong> <span class="badge">${recipe.category}</span><br/>
                <small>Bahan: ${reqText.join(', ')}</small>
            </div>
            <button class="craft-btn" ${canCraft ? '' : 'disabled'}>Buat</button>
        `;

        const btn = row.querySelector('.craft-btn');
        btn.addEventListener('click', () => {
            if (canCraft) craftItem(recipe);
        });

        listEl.appendChild(row);
    });
}

function craftItem(recipe) {
    for (let reqItem in recipe.req) {
        let reqAmt = recipe.req[reqItem];
        for (let i = G.inv.length - 1; i >= 0; i--) {
            if (G.inv[i].id === reqItem) {
                if (G.inv[i].qty >= reqAmt) {
                    G.inv[i].qty -= reqAmt;
                    reqAmt = 0;
                    if (G.inv[i].qty === 0) {
                        G.inv.splice(i, 1);
                    }
                } else {
                    reqAmt -= G.inv[i].qty;
                    G.inv.splice(i, 1);
                }
            }
            if (reqAmt <= 0) break;
        }
    }

    const existing = G.inv.find(i => i.id === recipe.id);
    if (existing) {
        existing.qty += 1;
    } else {
        G.inv.push({ id: recipe.id, name: recipe.name, qty: 1, icon: recipe.icon, price: recipe.price || 50 });
    }

    renderCraftingList();
    updateHotbarUI();
    if (window.showToast) window.showToast(`🍳 Berhasil membuat ${recipe.name}!`);
}
