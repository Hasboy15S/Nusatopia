/**
 * ╔══════════════════════════════════════════════════════════╗
 * ║          NUSATOPIA MAP DESIGN FILE                      ║
 * ║  Edit file ini untuk mengatur layout peta pulau         ║
 * ║  secara manual tanpa harus ubah kode utama.             ║
 * ╚══════════════════════════════════════════════════════════╝
 */

export const FOREST_ZONES = [
    // 🌲 ZONA HUTAN BELANTARA (Kepadatan dikurangi untuk FASE 3)
    { r: 7,  c: 6,  radius: 4.5, density: 0.40, treeVariants: [1, 2, 3] },
    { r: 8,  c: 12, radius: 4.5, density: 0.40, treeVariants: [2, 3, 4] },
    { r: 9,  c: 18, radius: 4.0, density: 0.35, treeVariants: [1, 3, 4] },

    { r: 14, c: 5,  radius: 5.0, density: 0.40, treeVariants: [1, 2, 4] },
    { r: 15, c: 11, radius: 5.0, density: 0.40, treeVariants: [2, 3, 4] },
    { r: 16, c: 17, radius: 4.5, density: 0.35, treeVariants: [1, 2, 3] },

    { r: 21, c: 5,  radius: 5.0, density: 0.40, treeVariants: [2, 3, 4] },
    { r: 22, c: 11, radius: 5.0, density: 0.40, treeVariants: [1, 3, 4] },
    { r: 23, c: 17, radius: 4.5, density: 0.35, treeVariants: [1, 2, 4] },

    { r: 27, c: 6,  radius: 4.5, density: 0.40, treeVariants: [1, 2, 3] },
    { r: 28, c: 12, radius: 4.5, density: 0.40, treeVariants: [3, 4, 1] },

    { r: 5,  c: 24, radius: 3.5, density: 0.30, treeVariants: [1, 2] },
    { r: 5,  c: 32, radius: 3.5, density: 0.30, treeVariants: [3, 4] },
    { r: 30, c: 24, radius: 3.5, density: 0.30, treeVariants: [2, 3] },
    { r: 30, c: 32, radius: 3.5, density: 0.30, treeVariants: [1, 4] },
];

export const CUSTOM_TREES = [
    { key: 'ts_tree1', x: 1050, y: 380, scale: 0.55 },
    { key: 'ts_tree3', x: 2150, y: 380, scale: 0.55 },
    { key: 'ts_tree2', x: 2350, y: 680, scale: 0.52 },
    { key: 'ts_tree4', x: 2850, y: 950, scale: 0.52 },
    { key: 'ts_tree3', x: 620,  y: 620,  scale: 0.52 },
    { key: 'ts_tree1', x: 620,  y: 1520, scale: 0.52 },
    { key: 'ts_tree4', x: 1450, y: 1800, scale: 0.52 },
];

export const CUSTOM_BUILDINGS = [
    { key: 'ts_castle',   x: 1600, y: 448,  scale: 1.0 },
    { key: 'ts_tower',    x: 1280, y: 448,  scale: 1.0 },
    { key: 'ts_tower',    x: 1920, y: 448,  scale: 1.0 },
    { key: 'ts_house1',   x: 1408, y: 704,  scale: 1.0 },
    { key: 'ts_house2',   x: 1792, y: 704,  scale: 1.0 },
    { key: 'ts_house3',   x: 1984, y: 704,  scale: 1.0 },
    { key: 'ts_house1',   x: 1792, y: 960,  scale: 1.0 },
    { key: 'ts_barracks', x: 1376, y: 1024, scale: 1.0 },
];

export const SPAWN_TILE = { col: 25, row: 17 };
