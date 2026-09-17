/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║              NUSATOPIA FARMING SYSTEM                    ║
 * ║  Mekanik Bertani Sawah & Ladang ala Nusantara:          ║
 * ║  Cangkul, Bajak Kerbau, Irigasi, Bibit Tanaman Lokal,   ║
 * ║  Growth Stages, & Quality System                         ║
 * ╚══════════════════════════════════════════════════════════╝
 */

import { G, updateHotbarUI } from '../ui.js';

export const CROPS = {
    padi: { id: 'padi', name: 'Padi Sawah', maxDays: 4, icon: '🌾', price: 120, season: 'hujan', isWetland: true },
    jagung: { id: 'jagung', name: 'Jagung Hibrida', maxDays: 3, icon: '🌽', price: 80, season: 'pancaroba', isWetland: false },
    singkong: { id: 'singkong', name: 'Singkong Ubi', maxDays: 3, icon: '🍠', price: 65, season: 'any', isWetland: false },
    cabai: { id: 'cabai', name: 'Cabai Merah', maxDays: 2, icon: '🌶️', price: 95, season: 'any', isWetland: false },
    kunyit: { id: 'kunyit', name: 'Kunyit Rempah', maxDays: 3, icon: '🫚', price: 110, season: 'kemarau', isWetland: false },
    jahe: { id: 'jahe', name: 'Jahe Merah', maxDays: 3, icon: '🫚', price: 115, season: 'kemarau', isWetland: false },
    kopi: { id: 'kopi', name: 'Bijik Kopi Nusantara', maxDays: 5, icon: '☕', price: 210, season: 'kemarau', isWetland: false },
    cengkeh: { id: 'cengkeh', name: 'Cengkeh Rempah', maxDays: 5, icon: '🌿', price: 250, season: 'kemarau', isWetland: false }
};

export class FarmingSystem {
    constructor(scene) {
        this.scene = scene;
        // Tile Grid Farm Plots: key format "col_row" -> { isTilled, isWatered, cropId, growthDays, quality, sprite, wateredOverlay }
        this.plots = new Map();
        this.tileSize = 64;

        // Batas Area Lahan Pertanian (Col 20..31, Row 18..27)
        this.farmArea = { minCol: 20, maxCol: 31, minRow: 18, maxRow: 27 };
    }

    init() {
        this.renderFarmGridHighlight();
    }

    isInsideFarmArea(col, row) {
        return col >= this.farmArea.minCol && col <= this.farmArea.maxCol &&
               row >= this.farmArea.minRow && row <= this.farmArea.maxRow;
    }

    getPlotKey(col, row) {
        return `${col}_${row}`;
    }

    // ── 1. MENCANGKUL / MEMBAJAK ──────────────────────────────────────────────
    tillTile(col, row, isBuffaloPlow = false) {
        if (!this.isInsideFarmArea(col, row)) {
            if (window.showToast) window.showToast('Gunakan cangkul di area Lahan Pertanian!');
            return false;
        }

        const colsToTill = isBuffaloPlow ? [col-1, col, col+1] : [col];
        const rowsToTill = isBuffaloPlow ? [row-1, row, row+1] : [row];

        colsToTill.forEach(c => {
            rowsToTill.forEach(r => {
                if (!this.isInsideFarmArea(c, r)) return;
                const key = this.getPlotKey(c, r);
                let plot = this.plots.get(key);

                if (!plot) {
                    plot = { isTilled: true, isWatered: false, cropId: null, growthDays: 0, quality: 'Biasa', sprite: null, textEl: null };
                    this.plots.set(key, plot);
                } else {
                    plot.isTilled = true;
                }

                this.renderPlotVisual(c, r, plot);
            });
        });

        if (window.showToast) window.showToast(isBuffaloPlow ? '🦬 Lahan dibajak dengan Kerbau!' : '⛏️ Lahan berhasil dicangkul!');
        return true;
    }

    // ── 2. MENYIRAM / MENGANGI AIR ────────────────────────────────────────────
    waterTile(col, row) {
        const key = this.getPlotKey(col, row);
        const plot = this.plots.get(key);

        if (!plot || !plot.isTilled) {
            if (window.showToast) window.showToast('Cangkul lahan terlebih dahulu sebelum menyiram!');
            return false;
        }

        plot.isWatered = true;
        this.renderPlotVisual(col, row, plot);
        if (window.showToast) window.showToast('💧 Lahan berhasil disiram!');
        return true;
    }

    // ── 3. MENANAM BIBIT ──────────────────────────────────────────────────────
    plantSeed(col, row, cropId) {
        const key = this.getPlotKey(col, row);
        const plot = this.plots.get(key);

        if (!plot || !plot.isTilled) {
            if (window.showToast) window.showToast('Lahan belum dicangkul!');
            return false;
        }

        if (plot.cropId) {
            if (window.showToast) window.showToast('Lahan ini sudah ditanami!');
            return false;
        }

        const cropData = CROPS[cropId];
        if (!cropData) return false;

        // Cek syarat Sawah (Padi butuh lahan disiram/basah)
        if (cropData.isWetland && !plot.isWatered) {
            if (window.showToast) window.showToast('Padi Sawah butuh lahan tergenang air! Siram air dulu.');
            return false;
        }

        plot.cropId = cropId;
        plot.growthDays = 0;
        
        // Tentukan Kualitas berdasarkan irigasi awal
        plot.quality = plot.isWatered ? 'Pilihan' : 'Biasa';

        this.renderPlotVisual(col, row, plot);
        if (window.showToast) window.showToast(`🌱 Menanam ${cropData.name}!`);
        return true;
    }

    // ── 4. MEMANEN HASIL TANI ─────────────────────────────────────────────────
    harvestTile(col, row) {
        const key = this.getPlotKey(col, row);
        const plot = this.plots.get(key);

        if (!plot || !plot.cropId) return false;

        const cropData = CROPS[plot.cropId];
        if (!cropData || plot.growthDays < cropData.maxDays) {
            if (window.showToast) window.showToast('Tanaman belum matang untuk dipanen!');
            return false;
        }

        // Masukkan ke Inventory Player
        const harvestQty = plot.quality === 'Pilihan' ? 3 : (plot.quality === 'Premium' ? 4 : 2);
        const existing = G.inv.find(i => i.id === cropData.id);

        if (existing) {
            existing.qty += harvestQty;
        } else {
            G.inv.push({ id: cropData.id, name: `${cropData.name} (${plot.quality})`, qty: harvestQty, icon: cropData.icon, price: cropData.price });
        }

        updateHotbarUI();
        if (window.showToast) window.showToast(`✨ Memanen ${harvestQty}x ${cropData.name} (${plot.quality})!`);

        // Reset Plot
        plot.cropId = null;
        plot.growthDays = 0;
        plot.isWatered = false;
        this.renderPlotVisual(col, row, plot);

        return true;
    }

    // ── 5. UPDATE HARIAN (DIKONTROL TIME & CALENDAR SYSTEM) ───────────────────
    onNewDay(isRainyDay = false) {
        this.plots.forEach((plot, key) => {
            if (!plot.isTilled) return;

            // Jika Hujan -> Otomatis Terairi
            if (isRainyDay) {
                plot.isWatered = true;
            }

            // Tumbuhkan Tanaman jika disiram
            if (plot.cropId && plot.isWatered) {
                const cropData = CROPS[plot.cropId];
                if (cropData && plot.growthDays < cropData.maxDays) {
                    plot.growthDays += 1;
                    if (plot.growthDays >= cropData.maxDays && plot.quality === 'Pilihan' && isRainyDay) {
                        plot.quality = 'Premium';
                    }
                }
            }

            // Lahan mengering untuk hari berikutnya kecuali jika hujan
            if (!isRainyDay) {
                plot.isWatered = false;
            }

            const [c, r] = key.split('_').map(Number);
            this.renderPlotVisual(c, r, plot);
        });
    }

    // ── 6. VISUAL RENDER TERRAIN & TANAMAN ───────────────────────────────────
    renderPlotVisual(col, row, plot) {
        const px = col * this.tileSize + this.tileSize / 2;
        const py = row * this.tileSize + this.tileSize / 2;

        if (plot.sprite) plot.sprite.destroy();
        if (plot.textEl) plot.textEl.destroy();

        // Layer Tanah Tercangkul / Disiram
        const rectColor = plot.isWatered ? 0x3d2612 : (plot.isTilled ? 0x7c5222 : 0x478c38);
        const g = this.scene.add.graphics();
        g.fillStyle(rectColor, 0.85);
        g.fillRoundedRect(px - 30, py - 30, 60, 60, 4);
        g.lineStyle(2, plot.isWatered ? 0x2980b9 : 0x5a3b18, 1);
        g.strokeRoundedRect(px - 30, py - 30, 60, 60, 4);
        g.setDepth(1);
        plot.sprite = g;

        // Layer Icon Tanaman & Growth Stage
        if (plot.cropId) {
            const cropData = CROPS[plot.cropId];
            const isFullyGrown = plot.growthDays >= cropData.maxDays;
            const stageText = isFullyGrown ? cropData.icon : (plot.growthDays === 0 ? '🌱' : '🌿');

            const text = this.scene.add.text(px, py - 4, stageText, {
                fontSize: isFullyGrown ? '28px' : '20px',
                stroke: '#000000',
                strokeThickness: 3
            }).setOrigin(0.5).setDepth(py);

            plot.textEl = text;

            if (isFullyGrown) {
                this.scene.tweens.add({
                    targets: text,
                    scale: 1.15,
                    yoyo: true,
                    repeat: -1,
                    duration: 600
                });
            }
        }
    }

    renderFarmGridHighlight() {
        const { minCol, maxCol, minRow, maxRow } = this.farmArea;
        const x = minCol * this.tileSize;
        const y = minRow * this.tileSize;
        const w = (maxCol - minCol + 1) * this.tileSize;
        const h = (maxRow - minRow + 1) * this.tileSize;

        const border = this.scene.add.graphics();
        border.lineStyle(3, 0xf39c12, 0.8);
        border.strokeRect(x, y, w, h);
        border.setDepth(2);

        const label = this.scene.add.text(x + 10, y + 8, '🌾 Lahan Pertanian Nusatopia', {
            fontSize: '13px',
            fontStyle: 'bold',
            color: '#f39c12',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 6, y: 3 }
        }).setDepth(3);
    }
}
