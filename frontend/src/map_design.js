/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          NUSATOPIA MAP DESIGN FILE                      ║
 * ║  Edit file ini untuk mengatur layout peta pulau         ║
 * ║  secara manual tanpa harus ubah kode utama.             ║
 * ╚══════════════════════════════════════════════════════════╝
 *
 * PANDUAN TILE:
 * -----------------------------------------------------------
 * TILE TERRAIN  (MAP_LAYOUT):
 *   0 = LAUT      (air, player tidak bisa lewat)
 *   1 = RUMPUT    (hijau murni, walkable)
 *
 * FOREST ZONES (FOREST_ZONES):
 *   Bioma Hutan Belantara (Optimized for 60 FPS High Performance).
 *
 * WORLD SIZE: 50 cols x 35 rows, tile = 64px => 3200 x 2240 pixel
 * -----------------------------------------------------------
 */

// ═══════════════════════════════════════════════════════════
// ZONA HUTAN BELANTARA (OPTIMIZED FOR 60 FPS)
// ═══════════════════════════════════════════════════════════
export const FOREST_ZONES = [
    // 🌲 ZONA HUTAN BELANTARA BARAT & BARAT DAYA (WEST RAINFOREST)
    { r: 7,  c: 6,  radius: 4.5, density: 0.85, treeVariants: [1, 2, 3] },
    { r: 8,  c: 12, radius: 4.5, density: 0.85, treeVariants: [2, 3, 4] },
    { r: 9,  c: 18, radius: 4.0, density: 0.80, treeVariants: [1, 3, 4] },

    { r: 14, c: 5,  radius: 5.0, density: 0.85, treeVariants: [1, 2, 4] },
    { r: 15, c: 11, radius: 5.0, density: 0.85, treeVariants: [2, 3, 4] },
    { r: 16, c: 17, radius: 4.5, density: 0.80, treeVariants: [1, 2, 3] },

    { r: 21, c: 5,  radius: 5.0, density: 0.85, treeVariants: [2, 3, 4] },
    { r: 22, c: 11, radius: 5.0, density: 0.85, treeVariants: [1, 3, 4] },
    { r: 23, c: 17, radius: 4.5, density: 0.80, treeVariants: [1, 2, 4] },

    { r: 27, c: 6,  radius: 4.5, density: 0.85, treeVariants: [1, 2, 3] },
    { r: 28, c: 12, radius: 4.5, density: 0.85, treeVariants: [3, 4, 1] },

    // 🌲 SABUK HUTAN UTARA & SELATAN (Penyelaras Peta)
    { r: 5,  c: 24, radius: 3.5, density: 0.70, treeVariants: [1, 2] },
    { r: 5,  c: 32, radius: 3.5, density: 0.70, treeVariants: [3, 4] },
    { r: 30, c: 24, radius: 3.5, density: 0.70, treeVariants: [2, 3] },
    { r: 30, c: 32, radius: 3.5, density: 0.70, treeVariants: [1, 4] },
];

// ═══════════════════════════════════════════════════════════
// CUSTOM TREES — Pohon Dekoratif Individual (Posisi Pixel)
// ═══════════════════════════════════════════════════════════
export const CUSTOM_TREES = [
    // Pohon Peneduh Benteng & Dusun
    { key: 'ts_tree1', x: 1050, y: 380, scale: 0.55 },
    { key: 'ts_tree3', x: 2150, y: 380, scale: 0.55 },
    { key: 'ts_tree2', x: 2350, y: 680, scale: 0.52 },
    { key: 'ts_tree4', x: 2850, y: 950, scale: 0.52 },

    // Peneduh Gerbang Situs Kebudayaan
    { key: 'ts_tree3', x: 620,  y: 620,  scale: 0.52 },
    { key: 'ts_tree1', x: 620,  y: 1520, scale: 0.52 },
    { key: 'ts_tree4', x: 1450, y: 1800, scale: 0.52 },
];

// ═══════════════════════════════════════════════════════════
// CUSTOM BUILDINGS — Bangunan (Posisi Pixel)
// ═══════════════════════════════════════════════════════════
export const CUSTOM_BUILDINGS = [
    // Benteng Utama (Utara-Tengah)
    { key: 'ts_castle',   x: 1600, y: 480,  scale: 1.00 },
    { key: 'ts_barracks', x: 1150, y: 440,  scale: 0.90 },
    { key: 'ts_tower',    x: 2050, y: 440,  scale: 0.95 },

    // Dusun Timur (East Village)
    { key: 'ts_house1',   x: 2400, y: 800,  scale: 0.95 },
    { key: 'ts_house2',   x: 2700, y: 920,  scale: 0.95 },
    { key: 'ts_house3',   x: 2500, y: 1100, scale: 0.95 },
    { key: 'ts_house1',   x: 2800, y: 1300, scale: 0.90 },

    // Menara Penjaga Selatan
    { key: 'ts_tower',    x: 1600, y: 1950, scale: 0.95 },
];

// ═══════════════════════════════════════════════════════════
// SPAWN POINT — Posisi awal player (dalam tile)
// ═══════════════════════════════════════════════════════════
export const SPAWN_TILE = { col: 25, row: 17 };
