import { G, updateHotbarUI } from './ui.js';

export const RECIPES = [
    { id: 'wooden_sword', req: { wood: 2, stick: 1 }, name: 'Pedang Kayu', icon: '🗡️' },
    { id: 'wooden_pickaxe', req: { wood: 3, stick: 2 }, name: 'Beliung Kayu', icon: '⛏️' },
    { id: 'stick', req: { wood: 1 }, name: 'Tongkat Kayu', icon: '🦯' }
];

export function openCraftingPanel(scene) {
    const overlay = document.getElementById('craft-overlay');
    if (overlay) {
        overlay.style.display = 'flex';
        renderCraftingList();
    }
    if (scene && scene.scene) {
        scene.scene.pause();
    } else if (window.gameScene) { // fallback
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

    // Hitung bahan di inventory
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
                <strong>${recipe.icon} ${recipe.name}</strong><br/>
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
        G.inv.push({ id: recipe.id, name: recipe.name, qty: 1, icon: recipe.icon });
    }

    renderCraftingList();
    updateHotbarUI();
    console.log(`[Crafting] Berhasil membuat ${recipe.name}`);
}
