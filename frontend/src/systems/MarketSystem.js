/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║               NUSATOPIA MARKET SYSTEM                    ║
 * ║  Pasar Desa "Keping Nusa": Transaksi Jual-Beli Hasil    ║
 * ║  Panen, Bibit Tanaman Lokal, & Kerajinan Nusantara      ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import { G, updateHotbarUI } from '../ui.js';
import { CROPS } from './FarmingSystem.js';

export const MARKET_SEEDS = [
    { id: 'seed_padi', cropId: 'padi', name: 'Bibit Padi Sawah', price: 30, icon: '🌾' },
    { id: 'seed_jagung', cropId: 'jagung', name: 'Bibit Jagung Hibrida', price: 20, icon: '🌽' },
    { id: 'seed_singkong', cropId: 'singkong', name: 'Bibit Singkong Ubi', price: 15, icon: '🍠' },
    { id: 'seed_cabai', cropId: 'cabai', name: 'Bibit Cabai Merah', price: 25, icon: '🌶️' },
    { id: 'seed_kunyit', cropId: 'kunyit', name: 'Bibit Kunyit Rempah', price: 35, icon: '🫚' },
    { id: 'seed_jahe', cropId: 'jahe', name: 'Bibit Jahe Merah', price: 40, icon: '🫚' },
    { id: 'seed_kopi', cropId: 'kopi', name: 'Bibit Kopi Nusantara', price: 65, icon: '☕' },
    { id: 'seed_cengkeh', cropId: 'cengkeh', name: 'Bibit Cengkeh Rempah', price: 85, icon: '🌿' }
];

export class MarketSystem {
    constructor(scene) {
        this.scene = scene;
        this.playerMoney = 500; // 500 Keping Nusa modal awal
    }

    init() {
        this.updateMoneyUI();
    }

    getMoney() {
        return this.playerMoney;
    }

    addMoney(amount) {
        this.playerMoney += amount;
        this.updateMoneyUI();
    }

    spendMoney(amount) {
        if (this.playerMoney < amount) {
            if (window.showToast) window.showToast('Keping Nusa tidak cukup!');
            return false;
        }
        this.playerMoney -= amount;
        this.updateMoneyUI();
        return true;
    }

    buySeed(seedItem) {
        if (!this.spendMoney(seedItem.price)) return false;

        const existing = G.inv.find(i => i.id === seedItem.id);
        if (existing) {
            existing.qty += 1;
        } else {
            G.inv.push({ id: seedItem.id, cropId: seedItem.cropId, name: seedItem.name, qty: 1, icon: seedItem.icon });
        }

        updateHotbarUI();
        if (window.showToast) window.showToast(`🛍️ Membeli ${seedItem.name} seharga ${seedItem.price} Keping Nusa!`);
        return true;
    }

    sellItem(invIndex) {
        const item = G.inv[invIndex];
        if (!item) return false;

        // Hitung harga jual
        let basePrice = item.price || 40;
        const season = this.scene.timeCalendarSystem ? this.scene.timeCalendarSystem.getCurrentSeason() : null;

        // Bonus Musim
        if (season && CROPS[item.id] && CROPS[item.id].season === season.id) {
            basePrice = Math.round(basePrice * 1.35); // Bonus 35% saat musim sesuai
        }

        const totalPrice = basePrice * (item.qty || 1);
        this.addMoney(totalPrice);

        if (window.showToast) window.showToast(`💰 Menjual ${item.name} x${item.qty} seharga ${totalPrice} Keping Nusa!`);

        G.inv.splice(invIndex, 1);
        updateHotbarUI();
        this.renderMarketModal();
        return true;
    }

    updateMoneyUI() {
        const moneyEl = document.getElementById('hud-money');
        if (moneyEl) moneyEl.textContent = `${this.playerMoney} Nusa`;
    }

    openMarketModal() {
        const modal = document.getElementById('market-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.renderMarketModal();
        }
        if (this.scene && this.scene.scene) this.scene.scene.pause();
    }

    renderMarketModal() {
        const buyContainer = document.getElementById('market-buy-list');
        const sellContainer = document.getElementById('market-sell-list');

        if (buyContainer) {
            buyContainer.innerHTML = '';
            MARKET_SEEDS.forEach(seed => {
                const itemDiv = document.createElement('div');
                itemDiv.className = 'market-card';
                itemDiv.innerHTML = `
                    <span>${seed.icon} ${seed.name} - <b>${seed.price} Nusa</b></span>
                    <button class="btn-buy">Beli</button>
                `;
                itemDiv.querySelector('.btn-buy').onclick = () => this.buySeed(seed);
                buyContainer.appendChild(itemDiv);
            });
        }

        if (sellContainer) {
            sellContainer.innerHTML = '';
            if (G.inv.length === 0) {
                sellContainer.innerHTML = '<p style="color:#aaa;">Inventory kosong.</p>';
            } else {
                G.inv.forEach((item, index) => {
                    const price = item.price || 40;
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'market-card';
                    itemDiv.innerHTML = `
                        <span>${item.icon || '📦'} ${item.name} (x${item.qty}) - <b>${price * item.qty} Nusa</b></span>
                        <button class="btn-sell">Jual</button>
                    `;
                    itemDiv.querySelector('.btn-sell').onclick = () => this.sellItem(index);
                    sellContainer.appendChild(itemDiv);
                });
            }
        }
    }
}
