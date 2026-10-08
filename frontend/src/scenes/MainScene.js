import Phaser from 'phaser';
import { initUI, G, updateHotbarUI } from '../ui';
import { initCraftingUI } from '../crafting';
import { FOREST_ZONES, CUSTOM_TREES, CUSTOM_BUILDINGS, SPAWN_TILE } from '../map_design';
import { TimeCalendarSystem } from '../systems/TimeCalendarSystem';
import { FarmingSystem } from '../systems/FarmingSystem';
import { NPCManager } from '../systems/NPCManager';
import { MarketSystem } from '../systems/MarketSystem';
import { CultureJurnalSystem } from '../systems/CultureJurnalSystem';
import { PlayerController } from '../systems/PlayerController';
import { SaveManager } from '../systems/SaveManager';

const TILE_SIZE = 64;
const MAP_COLS = 70;
const MAP_ROWS = 50;

function createIslandMap() {
    const map = [];
    for (let r = 0; r < MAP_ROWS; r++) {
        const row = [];
        for (let c = 0; c < MAP_COLS; c++) {
            if (r < 3 || r >= MAP_ROWS - 3 || c < 3 || c >= MAP_COLS - 3) {
                row.push(0);
            } else if (r >= 8 && r <= 14 && c >= 34 && c <= 42) {
                row.push(2); // Dataran tinggi
            } else {
                row.push(1);
            }
        }
        map.push(row);
    }

    // Jalan utama 2 tile lebar (col 24-25), y 448 (row 7) sampai tepi farm (row 17)
    for (let r = 7; r <= 17; r++) {
        map[r][24] = 3;
        map[r][25] = 3;
    }

    // Alun-alun 4 tile lebar (col 23-26), sebatas baris yang tidak menyentuh area bangunan (row 7, 8, 9)
    for (let r = 7; r <= 9; r++) {
        for (let c = 23; c <= 26; c++) {
            map[r][c] = 3;
        }
    }

    // Jalur ke Borobudur (~tile 12,10)
    for (let c = 12; c <= 23; c++) {
        map[16][c] = 3;
        map[17][c] = 3;
    }
    for (let r = 10; r <= 15; r++) {
        map[r][12] = 3;
        map[r][13] = 3;
    }

    // Jalur ke Sanggar Batik (~tile 12,25)
    for (let r = 18; r <= 25; r++) {
        map[r][12] = 3;
        map[r][13] = 3;
    }

    // Jalur memutar di sisi barat zona pertanian ke Taman Angklung (~tile 25,28)
    for (let r = 16; r <= 28; r++) {
        map[r][18] = 3;
        map[r][19] = 3;
    }
    for (let c = 20; c <= 26; c++) {
        map[27][c] = 3;
        map[28][c] = 3;
    }

    return map;
}

const MAP_LAYOUT = createIslandMap();

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.lastInteractTime = 0;
        this.interactCooldown = 500;
    }

    preload() {
        this.load.spritesheet('ts_tilemap', '/assets/Tilemap_Flat.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('ts_elevation', '/assets/Tilemap_Elevation.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('ts_tree1', '/assets/ts_tree1.png', { frameWidth: 192, frameHeight: 256 });
        this.load.spritesheet('ts_tree2', '/assets/ts_tree2.png', { frameWidth: 192, frameHeight: 256 });
        this.load.spritesheet('ts_tree3', '/assets/ts_tree3.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('ts_tree4', '/assets/ts_tree4.png', { frameWidth: 192, frameHeight: 192 });

        this.load.image('ts_castle', '/assets/Buildings/Blue Buildings/Castle.png');
        this.load.image('ts_tower', '/assets/Buildings/Blue Buildings/Tower.png');
        this.load.image('ts_house1', '/assets/ts_house1.png');
        this.load.image('ts_house2', '/assets/ts_house2.png');
        this.load.image('ts_house3', '/assets/ts_house3.png');
        this.load.image('ts_barracks', '/assets/Buildings/Blue Buildings/Barracks.png');

        this.load.spritesheet('ts_warrior_idle', '/assets/Warrior/Warrior_Idle.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('ts_lancer_idle', '/assets/Monk/Idle.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('ts_bush1', '/assets/ts_bush1.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('ts_bush2', '/assets/ts_bush2.png', { frameWidth: 128, frameHeight: 128 });
        this.load.image('ts_rock1', '/assets/ts_rock1.png');
        this.load.image('ts_rock2', '/assets/ts_rock2.png');

        this.load.image('ts_water', '/assets/ts_water.png');
        this.load.spritesheet('ts_water_rock1', '/assets/ts_water_rock1.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('ts_water_foam', '/assets/Foam.png', { frameWidth: 192, frameHeight: 192 });

        // Particles
        this.load.image('dust_fx', '/assets/Particle_FX/Dust_01.png');
        this.load.image('water_splash_fx', '/assets/Particle_FX/Water Splash.png');

        this.load.spritesheet('idle', '/assets/Pawn/Pawn_Idle.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('walk_down', '/assets/Pawn/Pawn_Run.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('walk_up', '/assets/Pawn/Pawn_Run.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('walk_side', '/assets/Pawn/Pawn_Run.png', { frameWidth: 192, frameHeight: 192 });
        
        this.load.spritesheet('action_down', '/assets/Pawn/Pawn_Interact Pickaxe.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('action_side', '/assets/Pawn/Pawn_Interact Axe.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('action_slice', '/assets/Pawn/Pawn_Interact Knife.png', { frameWidth: 192, frameHeight: 192 });
    }

    create() {
        const worldWidth = MAP_COLS * TILE_SIZE;
        const worldHeight = MAP_ROWS * TILE_SIZE;

        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // Physics Groups
        this.waterGroup = this.physics.add.staticGroup();
        this.treesGroup = this.physics.add.staticGroup();
        this.buildingsGroup = this.physics.add.staticGroup();
        this.rocksGroup = this.physics.add.staticGroup();
        this.itemsGroup = this.physics.add.staticGroup();

        if (!this.anims.exists('water_foam_anim')) {
            this.anims.create({
                key: 'water_foam_anim',
                frames: this.anims.generateFrameNumbers('ts_water_foam', { start: 0, end: 15 }),
                frameRate: 10,
                repeat: -1
            });
        }

        // 1. Inisialisasi Sistem-Sistem Utama
        this.timeCalendarSystem = new TimeCalendarSystem(this);
        this.timeCalendarSystem.init();

        this.farmingSystem = new FarmingSystem(this);
        this.farmingSystem.init();

        this.npcManager = new NPCManager(this);
        this.npcManager.init();

        this.marketSystem = new MarketSystem(this);
        this.marketSystem.init();

        this.cultureJurnalSystem = new CultureJurnalSystem(this);
        this.cultureJurnalSystem.init();

        this.saveManager = new SaveManager(this);

        // 2. Render Terrain & Objects
        this.renderTerrain(worldWidth, worldHeight);
        this.placeBuildingsAndTrees();

        const itemConfigs = [
            { id: 'borobudur', name: 'Situs Borobudur', x: 800, y: 700 },
            { id: 'batik', name: 'Sanggar Batik', x: 800, y: 1600 },
            { id: 'angklung', name: 'Taman Angklung', x: 1600, y: 1850 }
        ];

        itemConfigs.forEach(cfg => this.placeChestItem(cfg));
        this.placeDecorativeNPCs();
        this.placeDecorations();

        // 3. Player Character
        const startX = SPAWN_TILE.col * TILE_SIZE;
        const startY = SPAWN_TILE.row * TILE_SIZE;

        this.player = this.physics.add.sprite(startX, startY, 'idle');
        this.player.setScale(1.0); // Pawn base scale
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(32, 24);
        this.player.body.setOffset(80, 140);
        this.player.setDepth(500);

        this.anims.create({ key: 'walk_down', frames: this.anims.generateFrameNumbers('walk_down', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'walk_side', frames: this.anims.generateFrameNumbers('walk_side', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'walk_up', frames: this.anims.generateFrameNumbers('walk_up', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        
        // Animation Manager untuk Alat / Action
        this.anims.create({ key: 'action_down', frames: this.anims.generateFrameNumbers('action_down', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });
        this.anims.create({ key: 'action_side', frames: this.anims.generateFrameNumbers('action_side', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });
        this.anims.create({ key: 'action_slice', frames: this.anims.generateFrameNumbers('action_slice', { start: 0, end: 5 }), frameRate: 12, repeat: 0 });

        this.player.anims.play('idle', true);

        // Colliders
        this.physics.add.collider(this.player, this.waterGroup);
        this.physics.add.collider(this.player, this.buildingsGroup);
        this.physics.add.collider(this.player, this.rocksGroup);

        // Initialize PlayerController
        this.playerController = new PlayerController(this, this.player);
        this.playerController.setupCamera(worldWidth, worldHeight);

        // Additional Interaction Keys
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        this.promptText = this.add.text(0, 0, 'Tekan [E] untuk Interaksi', {
            fontSize: '14px',
            color: '#ffeb3b',
            backgroundColor: 'rgba(0,0,0,0.75)',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setVisible(false).setDepth(9999);

        // Pointer click listener untuk bertani di posisi klik mouse
        this.input.on('pointerdown', (pointer) => {
            this.handleFarmingActionAt(pointer.worldX, pointer.worldY);
        });

        initUI(this);
        initCraftingUI(this);
        window.gameScene = this;

        this.validateLayout();
    }

    createOrganicMasks() {
        const noise2D = (x, y, seed) => {
            let value = 0;
            value += Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453;
            return value - Math.floor(value);
        };

        const MAP_W = MAP_COLS;
        const MAP_H = MAP_ROWS;

        // --- 1. CORE MASK ---
        let coreMask = Array.from({length: MAP_H}, () => new Array(MAP_W).fill(false));
        const addCoreRect = (c1, r1, wCols, hCols) => {
            for (let r = Math.max(0, r1); r <= Math.min(MAP_H - 1, r1 + hCols - 1); r++) {
                for (let c = Math.max(0, c1); c <= Math.min(MAP_W - 1, c1 + wCols - 1); c++) {
                    coreMask[r][c] = true;
                }
            }
        };

        addCoreRect(20, 18, 12, 10); // farmArea
        addCoreRect(34, 8, 9, 7); // plateau
        addCoreRect(25, 17, 1, 1); // spawn
        addCoreRect(12, 10, 2, 2); // borobudur
        addCoreRect(12, 25, 2, 2); // batik
        addCoreRect(25, 28, 2, 2); // angklung
        for (let r = 0; r < MAP_H - 1; r++) { // Batasi r hingga 33 agar baris 34 (selatan) tetap air
            for (let c = 0; c < MAP_W; c++) {
                if (MAP_LAYOUT[r][c] === 3) addCoreRect(c, r, 1, 1);
            }
        }
        CUSTOM_BUILDINGS.forEach(b => {
            let w = 2, h = 3;
            if (b.key === 'ts_castle') { w = 5; h = 4; }
            if (b.key === 'ts_tower') { w = 2; h = 4; }
            if (b.key === 'ts_barracks') { w = 3; h = 4; }
            let cCol = Math.floor(b.x / 64);
            let cRow = Math.floor(b.y / 64); 
            addCoreRect(cCol - Math.floor(w/2), cRow - h + 1, w, h);
        });

        // --- 2. FORCED GRASS (Core dilated by Grass Margin) ---
        let forcedGrass = Array.from({length: MAP_H}, () => new Array(MAP_W).fill(false));
        for (let r = 0; r < MAP_H; r++) {
            for (let c = 0; c < MAP_W; c++) {
                if (coreMask[r][c]) {
                    forcedGrass[r][c] = true;
                    continue;
                }
                
                let minDistSq = 9999;
                let searchR = 5;
                for (let rr = Math.max(0, r - searchR); rr <= Math.min(MAP_H - 1, r + searchR); rr++) {
                    for (let cc = Math.max(0, c - searchR); cc <= Math.min(MAP_W - 1, c + searchR); cc++) {
                        if (coreMask[rr][cc]) {
                            let dSq = (r - rr)**2 + (c - cc)**2;
                            if (dSq < minDistSq) minDistSq = dSq;
                        }
                    }
                }
                
                let dist = Math.sqrt(minDistSq);
                let noise = noise2D(c*0.4, r*0.4, 123) * 2.0 - 1.0; // High freq, +/- 1 tile
                
                let marginTarget = 3; 
                if (r < 7) marginTarget = 1;
                else if (r > 27) marginTarget = 2;
                else if (c > 33) marginTarget = 3;
                else if (c < 15) marginTarget = 3;
                
                if (dist + noise <= marginTarget) {
                    forcedGrass[r][c] = true;
                }
            }
        }

        // --- 3. GRASS MASK (Base Ellipse) ---
        let grassMask = Array.from({length: MAP_H}, () => new Array(MAP_W).fill(false));
        for (let r = 0; r < MAP_H; r++) {
            for (let c = 0; c < MAP_W; c++) {
                let nx = (c - MAP_W/2) / (MAP_W/2 - 4);
                let ny = (r - MAP_H/2) / (MAP_H/2 - 4); 
                let distSq = nx*nx + ny*ny;
                let falloff = Math.max(0, 1 - distSq);
                let noise = noise2D(c * 0.3, r * 0.3, 999) * 0.4 + 0.6; // High freq
                
                let isGrass = falloff * noise > 0.4;
                if (forcedGrass[r][c]) isGrass = true;
                
                // Absolute Water Margins for GRASS
                let waterMargin = 3; 
                if (r < 5) waterMargin = 2; // Keep 1 for sand, so grass stops at 2
                else if (r >= 33) waterMargin = 2;
                
                if (r < waterMargin || r >= MAP_H - waterMargin || c < waterMargin || c >= MAP_W - waterMargin) {
                    isGrass = false;
                }
                
                if (coreMask[r][c]) isGrass = true; 
                grassMask[r][c] = isGrass;
            }
        }

        // --- 4. SMOOTH GRASS MASK ---
        const smoothMask = (mask, fGrass) => {
            let newMask = mask.map(row => [...row]);
            for (let r = 1; r < MAP_H - 1; r++) {
                for (let c = 1; c < MAP_W - 1; c++) {
                    if (fGrass && fGrass[r][c]) { newMask[r][c] = true; continue; } 
                    let neighbors = 0;
                    if (mask[r-1][c]) neighbors++;
                    if (mask[r+1][c]) neighbors++;
                    if (mask[r][c-1]) neighbors++;
                    if (mask[r][c+1]) neighbors++;
                    if (mask[r][c] && neighbors <= 1) newMask[r][c] = false; 
                    if (!mask[r][c] && neighbors >= 3) newMask[r][c] = true;  
                }
            }
            return newMask;
        };
        grassMask = smoothMask(grassMask, coreMask);
        grassMask = smoothMask(grassMask, coreMask);

        // --- 5. DILATE TO FIND LAND MASK (Beach) ---
        let landMask = Array.from({length: MAP_H}, () => new Array(MAP_W).fill(false));
        for (let r = 0; r < MAP_H; r++) {
            for (let c = 0; c < MAP_W; c++) {
                if (grassMask[r][c]) {
                    landMask[r][c] = true;
                    continue;
                }
                
                let minDistSq = 9999;
                let searchR = 4;
                for (let rr = Math.max(0, r - searchR); rr <= Math.min(MAP_H - 1, r + searchR); rr++) {
                    for (let cc = Math.max(0, c - searchR); cc <= Math.min(MAP_W - 1, c + searchR); cc++) {
                        if (grassMask[rr][cc]) {
                            let dSq = (r - rr)**2 + (c - cc)**2;
                            if (dSq < minDistSq) minDistSq = dSq;
                        }
                    }
                }
                let dist = Math.sqrt(minDistSq);
                let beachNoise = noise2D(c*0.5, r*0.5, 456) * 1.0 - 0.5; // High freq
                
                let beachWidth = 2;
                if (r < 7) beachWidth = 1; // Sisi utara pantai tipis
                
                if (dist + beachNoise <= beachWidth) {
                    landMask[r][c] = true;
                }
                
                // Water Margin for Land
                let waterMargin = 2;
                if (r < 5) waterMargin = 1;
                else if (r >= 33) waterMargin = 1;
                
                if (r < waterMargin || r >= MAP_H - waterMargin || c < waterMargin || c >= MAP_W - waterMargin) {
                    landMask[r][c] = false;
                }
                if (coreMask[r][c]) landMask[r][c] = true;
            }
        }
        
        landMask = smoothMask(landMask, coreMask);
        landMask = smoothMask(landMask, coreMask);

        // --- 6. FINAL VALIDATION (Tahap 3b: Ensure Grass NEVER touches Water) ---
        let coreViolations = [];
        for (let r = 0; r < MAP_H; r++) {
            for (let c = 0; c < MAP_W; c++) {
                if (grassMask[r][c]) {
                    let touchesWater = false;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            let nr = r + dr;
                            let nc = c + dc;
                            if (nr < 0 || nr >= MAP_H || nc < 0 || nc >= MAP_W) touchesWater = true;
                            else if (!landMask[nr][nc]) touchesWater = true;
                        }
                    }
                    if (touchesWater) {
                        if (coreMask[r][c]) {
                            coreViolations.push(`(Kolom ${c}, Baris ${r})`);
                        } else {
                            grassMask[r][c] = false; // Turunkan jadi pasir
                        }
                    }
                }
            }
        }
        
        if (coreViolations.length > 0) {
            console.warn("TAHAP 3B PELANGGARAN! Tile inti rumput menyentuh air (kurang area pasir) di:", coreViolations);
        }
        window.tahap3bViolations = coreViolations;

        return { landMask, grassMask, forcedMask: coreMask };
    }

    validateLayout() {
        console.log("=== VALIDATING LAYOUT ===");
        const farmRect = new Phaser.Geom.Rectangle(20 * 64, 18 * 64, 12 * 64, 10 * 64);
        const roadRect = new Phaser.Geom.Rectangle(24 * 64, 0, 2 * 64, MAP_ROWS * 64); // col 24-25
        const spawnRect = new Phaser.Geom.Rectangle(25 * 64, 17 * 64, 64, 64);

        // Area bebas (keep-out) tangga tebing
        const stairsRect = new Phaser.Geom.Rectangle(36 * 64, 15 * 64, 4 * 64, 4 * 64);
        
        const getBounds = (cfg) => {
            let w = 128, h = 192;
            if (cfg.key === 'ts_castle') { w = 320; h = 256; }
            if (cfg.key === 'ts_tower') { w = 128; h = 256; }
            if (cfg.key === 'ts_barracks') { w = 192; h = 256; }
            if (cfg.key.startsWith('ts_tree')) { w = 192; h = (cfg.key === 'ts_tree1' || cfg.key === 'ts_tree2') ? 256 : 192; }
            
            // Area = x - w/2 to x + w/2. y - h to y.
            return new Phaser.Geom.Rectangle(cfg.x - w/2, cfg.y - h, w, h);
        };

        const checkOverlap = (r1, r2, padding = 0) => {
            return !(r1.right + padding <= r2.left || 
                     r1.left - padding >= r2.right || 
                     r1.bottom + padding <= r2.top || 
                     r1.top - padding >= r2.bottom);
        };

        // Check buildings vs buildings
        for (let i = 0; i < CUSTOM_BUILDINGS.length; i++) {
            const b1 = CUSTOM_BUILDINGS[i];
            const r1 = getBounds(b1);
            for (let j = i + 1; j < CUSTOM_BUILDINGS.length; j++) {
                const b2 = CUSTOM_BUILDINGS[j];
                const r2 = getBounds(b2);
                if (checkOverlap(r1, r2, 64)) {
                    console.warn(`[Layout Warning] Bangunan menumpuk/terlalu dekat: ${b1.key} & ${b2.key}`);
                }
            }

            if (checkOverlap(r1, farmRect)) console.warn(`[Layout Warning] Bangunan ${b1.key} menimpa Farm Area`);
            if (checkOverlap(r1, roadRect)) console.warn(`[Layout Warning] Bangunan ${b1.key} menimpa Jalan`);
            if (checkOverlap(r1, spawnRect)) console.warn(`[Layout Warning] Bangunan ${b1.key} menimpa Spawn`);
        }

        // Check CUSTOM_TREES
        CUSTOM_TREES.forEach(t => {
            const tr = getBounds(t);
            if (checkOverlap(tr, roadRect)) console.warn(`[Layout Warning] Custom Tree menimpa Jalan di ${t.x}, ${t.y}`);
            CUSTOM_BUILDINGS.forEach(b => {
                if (checkOverlap(tr, getBounds(b))) console.warn(`[Layout Warning] Custom Tree menimpa Bangunan ${b.key}`);
            });
        });
        
        // Periksa jalur kosong dari tangga ke jalan (selatan)
        let stairsBlocked = false;
        for (let r = 16; r <= 19; r++) {
            for (let c = 37; c <= 39; c++) {
                if (MAP_LAYOUT[r][c] === 0 || MAP_LAYOUT[r][c] === 2) stairsBlocked = true;
                CUSTOM_BUILDINGS.forEach(b => {
                    if (getBounds(b).contains(c*64+32, r*64+32)) stairsBlocked = true;
                });
            }
        }
        if (stairsBlocked) console.warn("[Layout Warning] Jalur dari tangga tebing ke selatan terhalang!");

        if (window.removedCustomTrees !== undefined) {
            console.log(`[Layout Info] Membuang ${window.removedCustomTrees} pohon manual (CUSTOM_TREES) karena menabrak zona bebas (keep-out).`);
        }

        console.log("=== VALIDATION COMPLETE ===");
    }

    handleFarmingActionAt(worldX, worldY) {
        const col = Math.floor(worldX / TILE_SIZE);
        const row = Math.floor(worldY / TILE_SIZE);

        const currentItem = G.inv[G.selectedSlot];
        if (!currentItem) {
            // Coba panen jika ada tanaman matang di tile ini
            this.farmingSystem.harvestTile(col, row);
            return;
        }

        if (currentItem.id === 'cangkul_kayu') {
            this.farmingSystem.tillTile(col, row);
        } else if (currentItem.id === 'ember_air') {
            this.farmingSystem.waterTile(col, row);
        } else if (currentItem.cropId) {
            this.farmingSystem.plantSeed(col, row, currentItem.cropId);
        } else {
            this.farmingSystem.harvestTile(col, row);
        }
    }

    renderTerrain(worldWidth, worldHeight) {
        this.terrainLayer = this.add.group();

        const isType = (r, c, type) => {
            if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return false;
            if (type === 1) return MAP_LAYOUT[r][c] >= 1; // Elevasi juga daratan
            return MAP_LAYOUT[r][c] === type;
        };
        
        const getAutotileFrame = (r, c, type = 1) => {
            let top = isType(r-1, c, type) ? 1 : 0;
            let bottom = isType(r+1, c, type) ? 1 : 0;
            let left = isType(r, c-1, type) ? 1 : 0;
            let right = isType(r, c+1, type) ? 1 : 0;
            
            let frame = 11;
            if (!top && !bottom && !left && !right) frame = 38;
            else if (!top && !bottom) {
                if (!left && right) frame = 35;
                else if (left && right) frame = 36;
                else if (left && !right) frame = 37;
            }
            else if (!left && !right) {
                if (!top && bottom) frame = 3;
                else if (top && bottom) frame = 13;
                else if (top && !bottom) frame = 23;
            }
            else {
                if (!top && bottom && !left && right) frame = 0;
                else if (!top && bottom && left && right) frame = 1;
                else if (!top && bottom && left && !right) frame = 2;
                else if (top && bottom && !left && right) frame = 10;
                else if (top && bottom && left && right) frame = 11;
                else if (top && bottom && left && !right) frame = 12;
                else if (top && !bottom && !left && right) frame = 20;
                else if (top && !bottom && left && right) frame = 21;
                else if (top && !bottom && left && !right) frame = 22;
            }
            
            if (type === 3) {
                frame += 5;
            }
            return frame;
        };

        // Buat animasi water rock
        if (!this.anims.exists('water_rock_anim')) {
            this.anims.create({
                key: 'water_rock_anim',
                frames: this.anims.generateFrameNumbers('ts_water_rock1', { start: 0, end: 7 }),
                frameRate: 6,
                repeat: -1
            });
        }
        
        if (!this.anims.exists('water_foam_anim')) {
            this.anims.create({
                key: 'water_foam_anim',
                frames: this.anims.generateFrameNumbers('ts_water_foam', { start: 0, end: 7 }),
                frameRate: 8,
                repeat: -1
            });
        }

        // ORGANIC ISLAND FEATURE (TAHAP 3a)
        const ORGANIC_ISLAND = true;
        let organicData = null;
        if (ORGANIC_ISLAND) {
            organicData = this.createOrganicMasks();
            
            // Debug Overlay Toggle (Tombol O)
            this.input.keyboard.on('keydown-P', () => {
                if (this.cameras.main.zoom < 1) {
                    this.cameras.main.setZoom(1);
                    if (this.player) this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
                    if (window.showToast) window.showToast("Zoom: NORMAL");
                } else {
                    this.cameras.main.setZoom(0.35);
                    this.cameras.main.stopFollow();
                    this.cameras.main.centerOn(MAP_COLS * 32, MAP_ROWS * 32);
                    if (window.showToast) window.showToast("Zoom: OUT (Tinjauan Pulau)");
                }
            });
            
            this.input.keyboard.on('keydown-O', () => {
                if (this.debugOverlay) {
                    this.debugOverlay.destroy();
                    this.debugOverlay = null;
                    if (window.showToast) window.showToast("Overlay Organik: MATI");
                    return;
                }
                if (window.showToast) window.showToast("Overlay Organik: HIDUP (Kuning=Pasir, Hijau=Rumput)");
                this.debugOverlay = this.add.graphics();
                this.debugOverlay.setDepth(9999);
                for (let r = 0; r < MAP_ROWS; r++) {
                    for (let c = 0; c < MAP_COLS; c++) {
                        let px = c * 64 + 32;
                        let py = r * 64 + 32;
                        if (organicData.grassMask[r][c]) {
                            this.debugOverlay.fillStyle(0x00ff00, 0.4);
                            this.debugOverlay.fillRect(px-32, py-32, 64, 64);
                        } else if (organicData.landMask[r][c]) {
                            this.debugOverlay.fillStyle(0xffff00, 0.4);
                            this.debugOverlay.fillRect(px-32, py-32, 64, 64);
                        }
                    }
                }
            });
        }

        const getAutotileFrame4 = (r, c, mask, isSand = false) => {
            const check = (rr, cc) => {
                if (rr < 0 || rr >= MAP_ROWS || cc < 0 || cc >= MAP_COLS) return false;
                return mask[rr][cc];
            };
            let top = check(r-1, c) ? 1 : 0;
            let bottom = check(r+1, c) ? 1 : 0;
            let left = check(r, c-1) ? 1 : 0;
            let right = check(r, c+1) ? 1 : 0;
            
            let frame = 11;
            if (!top && !bottom && !left && !right) frame = 33; // Island
            else if (!top && !bottom) { // Horizontal strip
                if (!left && right) frame = 30;
                else if (left && right) frame = 31;
                else if (left && !right) frame = 32;
            }
            else if (!left && !right) { // Vertical strip
                if (!top && bottom) frame = 3;
                else if (top && bottom) frame = 13;
                else if (top && !bottom) frame = 23;
            }
            else { // Block
                if (!top && bottom && !left && right) frame = 0;
                else if (!top && bottom && left && right) frame = 1;
                else if (!top && bottom && left && !right) frame = 2;
                else if (top && bottom && !left && right) frame = 10;
                else if (top && bottom && left && right) frame = 11;
                else if (top && bottom && left && !right) frame = 12;
                else if (top && !bottom && !left && right) frame = 20;
                else if (top && !bottom && left && right) frame = 21;
                else if (top && !bottom && left && !right) frame = 22;
            }
            
            if (isSand) frame += 5;
            return frame;
        };

        const waterRockPositions = [];

        if (ORGANIC_ISLAND) {
            // TAHAP 3b: SATU rectangle air seukuran dunia (+ margin besar)
            const bigWater = this.add.rectangle(
                MAP_COLS * 32, MAP_ROWS * 32, 
                MAP_COLS * 64 + 2000, MAP_ROWS * 64 + 2000, 
                0x47ABA9
            );
            bigWater.setDepth(-1);
            this.terrainLayer.add(bigWater);
        }

        for (let row = 0; row < MAP_ROWS; row++) {
            for (let col = 0; col < MAP_COLS; col++) {
                const px = col * TILE_SIZE + TILE_SIZE / 2;
                const py = row * TILE_SIZE + TILE_SIZE / 2;
                const tileType = MAP_LAYOUT[row][col];

                if (!ORGANIC_ISLAND && tileType === 0) {
                    // Render water tile lama
                    const waterTile = this.add.rectangle(px, py, TILE_SIZE, TILE_SIZE, 0x47ABA9);
                    waterTile.setDepth(-1);

                    const waterBody = this.add.zone(px, py, TILE_SIZE, TILE_SIZE);
                    this.physics.add.existing(waterBody, true);
                    this.waterGroup.add(waterBody);

                    const hasLandNeighbor = isType(row - 1, col, 1) || isType(row + 1, col, 1) || isType(row, col - 1, 1) || isType(row, col + 1, 1);
                    if (!hasLandNeighbor) waterRockPositions.push({ px, py });
                    continue;
                } else if (ORGANIC_ISLAND && !organicData.landMask[row][col]) {
                    // TAHAP 3b: Air organik
                    let bordersLand = false;
                    for (let dr = -1; dr <= 1; dr++) {
                        for (let dc = -1; dc <= 1; dc++) {
                            let nr = row + dr;
                            let nc = col + dc;
                            if (nr >= 0 && nr < MAP_ROWS && nc >= 0 && nc < MAP_COLS) {
                                if (organicData.landMask[nr][nc]) bordersLand = true;
                            }
                        }
                    }

                    if (!bordersLand) {
                        waterRockPositions.push({ px, py });
                    } else {
                        // TAHAP 3b: Collision pita tipis di perbatasan air dan daratan
                        const waterBody = this.add.zone(px, py, TILE_SIZE, TILE_SIZE);
                        this.physics.add.existing(waterBody, true);
                        this.waterGroup.add(waterBody);
                    }
                }

                // Rendering Dasar (Tahap 3a)
                if (ORGANIC_ISLAND) {
                    if (organicData.landMask[row][col]) {
                        // Render pasir pantai dasar
                        const sandFrame = getAutotileFrame4(row, col, organicData.landMask, true);
                        const sandTile = this.add.image(px, py, 'ts_tilemap', sandFrame);
                        sandTile.setDepth(-0.2); 
                        this.terrainLayer.add(sandTile);
                    }
                    if (organicData.grassMask[row][col]) {
                        // Render rumput di atas pasir
                        const grassFrame = getAutotileFrame4(row, col, organicData.grassMask, false);
                        const grassTile = this.add.image(px, py, 'ts_tilemap', grassFrame);
                        grassTile.setDepth(0); 
                        this.terrainLayer.add(grassTile);
                    }
                    
                    // TAHAP 3b: Foam di tile pasir tepi
                    let isSand = organicData.landMask[row][col] && !organicData.grassMask[row][col];
                    if (isSand) {
                        let bordersWater = false;
                        for (let dr = -1; dr <= 1; dr++) {
                            for (let dc = -1; dc <= 1; dc++) {
                                let nr = row + dr;
                                let nc = col + dc;
                                if (nr < 0 || nr >= MAP_ROWS || nc < 0 || nc >= MAP_COLS) bordersWater = true;
                                else if (!organicData.landMask[nr][nc]) bordersWater = true;
                            }
                        }
                        if (bordersWater) {
                            const foam = this.add.sprite(px, py, 'ts_water_foam');
                            foam.play({ key: 'water_foam_anim', startFrame: Math.floor(Math.random() * 8) });
                            foam.setScale(1);
                            foam.setDepth(-0.5);
                            this.terrainLayer.add(foam);
                        }
                    }
                } else {
                    // Daratan dasar lama selalu dirender (rumput)
                    const baseFrame = getAutotileFrame(row, col, 1);
                    const baseTile = this.add.image(px, py, 'ts_tilemap', baseFrame);
                    baseTile.setDepth(0);
                    this.terrainLayer.add(baseTile);
                }

                // Jika ini adalah dataran tinggi (tebing)
                if (tileType === 2) {
                    let elevFrame = getAutotileFrame(row, col, 2);
                    // Tahap 1: Bukaan tangga (pakai tile fill 11 supaya tidak ada outline bawah)
                    if (row === 14 && col >= 37 && col <= 39) {
                        elevFrame = 11;
                    }
                    
                    const elevTile = this.add.image(px, py, 'ts_tilemap', elevFrame);
                    elevTile.setDepth(0.1); 
                    this.terrainLayer.add(elevTile);

                    let isStairs = false;

                    // Render dinding tebing sisi selatan dan pasang collision HANYA di dinding
                    if (row + 1 < MAP_ROWS && MAP_LAYOUT[row+1][col] !== 2) {
                        let left = (col-1 >= 0 && MAP_LAYOUT[row][col-1] === 2);
                        let right = (col+1 < MAP_COLS && MAP_LAYOUT[row][col+1] === 2);
                        let wallFrame = 13; // Center
                        if (!left && right) wallFrame = 12;
                        if (left && !right) wallFrame = 14;

                        // Pasang tangga di tebing selatan
                        if (col === 37) { wallFrame = 28; isStairs = true; }
                        else if (col === 38) { wallFrame = 29; isStairs = true; }
                        else if (col === 39) { wallFrame = 30; isStairs = true; }

                        const cliffPy = py + TILE_SIZE;
                        const cliffTile = this.add.image(px, cliffPy, 'ts_elevation', wallFrame);
                        cliffTile.setDepth(0.2); 
                        this.terrainLayer.add(cliffTile);
                        
                        // Tahap 1: Bayangan tebing di bawah dinding (di tanah)
                        const shadow = this.add.rectangle(px, cliffPy + 32, TILE_SIZE, 14, 0x000000, 0.2);
                        shadow.setOrigin(0.5, 0);
                        shadow.setDepth(0.01); // Di atas rumput (0), di bawah jalan (0.05) & dinding (0.2)
                        this.terrainLayer.add(shadow);
                        
                        // Tambahkan Collision di baris dinding tebing (cliffPy)
                        if (!isStairs) {
                            const wallBody = this.add.zone(px, cliffPy, TILE_SIZE, TILE_SIZE);
                            this.physics.add.existing(wallBody, true);
                            this.buildingsGroup.add(wallBody); 
                        }
                    }
                } 

                // Jika ini adalah jalan pasir (tipe 3)
                if (tileType === 3) {
                    const roadFrame = getAutotileFrame(row, col, 3);
                    const roadTile = this.add.image(px, py, 'ts_tilemap', roadFrame);
                    roadTile.setDepth(0.05); // Di atas rumput biasa, di bawah bangunan
                    roadTile.setTint(0x947A8F); // Tahap 2: warna lebih coklat
                    this.terrainLayer.add(roadTile);
                }

            }
        }

        // Logging Tahap 3b
        if (ORGANIC_ISLAND) {
            let foamCount = 0;
            this.terrainLayer.getChildren().forEach(child => {
                if (child.texture && child.texture.key === 'ts_water_foam') foamCount++;
            });
            console.log(`TAHAP 3B STATS: Jumlah Sprite Foam: ${foamCount}`);
            console.log(`TAHAP 3B STATS: Jumlah Body Collision Air: ${this.waterGroup.getLength()}`);
        }

        // Taruh beberapa animated water rocks di laut secara deterministic
        const rockCount = Math.min(8, waterRockPositions.length);
        for (let i = 0; i < rockCount; i++) {
            const idx = Math.floor((i * 137 + 53) % waterRockPositions.length);
            const pos = waterRockPositions[idx];
            const rock = this.add.sprite(pos.px, pos.py, 'ts_water_rock1', 0);
            rock.setScale(0.5);
            rock.setDepth(0);
            rock.anims.play('water_rock_anim', true);
        }
    }

    placeBuildingsAndTrees() {
        CUSTOM_BUILDINGS.forEach(b => this.placeBuilding(b.key, b.x, b.y, b.scale, true));

        const noise2D = (x, y, seed) => {
            let value = 0;
            let amplitude = 0.5;
            let frequency = 1;
            for (let i = 0; i < 2; i++) {
                value += amplitude * (Math.sin(x * frequency + seed) * Math.cos(y * frequency + seed));
                x += 10; y += 10;
                amplitude *= 0.5;
                frequency *= 2;
            }
            return value;
        };

        const isKeepOut = (px, py) => {
            const tr = new Phaser.Geom.Rectangle(px - 48, py - 64, 96, 64);
            
            // Bangunan + margin 2 tile (128px)
            for (let b of CUSTOM_BUILDINGS) {
                let w = 128, h = 192;
                if (b.key === 'ts_castle') { w = 320; h = 256; }
                if (b.key === 'ts_tower') { w = 128; h = 256; }
                if (b.key === 'ts_barracks') { w = 192; h = 256; }
                const br = new Phaser.Geom.Rectangle(b.x - w/2, b.y - h, w, h);
                if (!(tr.right + 128 <= br.left || tr.left - 128 >= br.right || tr.bottom + 128 <= br.top || tr.top - 128 >= br.bottom)) return true;
            }
            
            // Jalan/Air + margin 1 tile
            let startC = Math.max(0, Math.floor((px - 96) / 64));
            let endC = Math.min(MAP_COLS - 1, Math.floor((px + 96) / 64));
            let startR = Math.max(0, Math.floor((py - 96) / 64));
            let endR = Math.min(MAP_ROWS - 1, Math.floor((py + 96) / 64));
            for (let r = startR; r <= endR; r++) {
                for (let c = startC; c <= endC; c++) {
                    if (MAP_LAYOUT[r][c] === 3 || MAP_LAYOUT[r][c] === 0) return true;
                }
            }

            // Farm area (margin tipis saja, karena bounds sudah besar)
            if (px > 20*64 - 32 && px < 32*64 + 32 && py > 18*64 - 32 && py < 28*64 + 32) return true;

            // Tebing dan Tangga
            let cCol = Math.floor(px / 64);
            let cRow = Math.floor(py / 64);
            // Baris dinding (15) dan tepi plateau (14)
            if (cCol >= 34 && cCol <= 42 && (cRow === 14 || cRow === 15)) return true;
            // 2 tile di depan tangga (16-17) dan 2 tile pendaratan (12-13) (kolom 37-39)
            if (cCol >= 37 && cCol <= 39 && (cRow === 12 || cRow === 13 || cRow === 16 || cRow === 17)) return true;

            // Spawn + 3 tile
            if (Math.abs(px - (25*64+32)) < 192 && Math.abs(py - (17*64+32)) < 192) return true;

            // Landmarks + 3 tile
            const lms = [{ x: 800, y: 700 }, { x: 800, y: 1600 }, { x: 1600, y: 1850 }];
            for (let lm of lms) {
                if (Math.abs(px - lm.x) < 192 && Math.abs(py - lm.y) < 192) return true;
            }
            return false;
        };

        const treePoints = [];
        for (let r = 0; r < MAP_ROWS; r++) {
            for (let c = 0; c < MAP_COLS; c++) {
                if (r < 3 || r >= MAP_ROWS - 3 || c < 3 || c >= MAP_COLS - 3) continue;

                let nx = c * 0.15;
                let ny = r * 0.15;
                let density = noise2D(nx, ny, 123) + 0.5;

                let edgeFactor = 1.0;
                if (c > MAP_COLS / 2) edgeFactor *= (MAP_COLS - c) / (MAP_COLS / 2);
                if (r > MAP_ROWS / 2) edgeFactor *= (MAP_ROWS - r) / (MAP_ROWS / 2);
                
                density *= edgeFactor;

                if (density > 0.4) {
                    let jitterX = (Math.sin(r * c * 13) * 0.5) * 40;
                    let jitterY = (Math.cos(r * c * 17) * 0.5) * 40;
                    let px = c * 64 + 32 + jitterX;
                    let py = r * 64 + 32 + jitterY;
                    let cCol = Math.floor(px / 64);
                    let cRow = Math.floor(py / 64);

                    // Tahap 1b: Keep-out khusus pohon (jangan tumbuh di baris 16 selatan tebing)
                    let isTreeKeepOut = (cCol >= 34 && cCol <= 42 && cRow === 16);

                    if (!isKeepOut(px, py) && !isTreeKeepOut) {
                        let tooClose = false;
                        for (let pt of treePoints) {
                            if (Math.abs(pt.x - px) + Math.abs(pt.y - py) < 96) {
                                tooClose = true;
                                break;
                            }
                        }
                        if (!tooClose) {
                            treePoints.push({x: px, y: py, r, c});
                        }
                    }
                } else if (density > 0.25 && density < 0.35) {
                    let jitterX = (Math.sin(r * c * 23) * 0.5) * 40;
                    let jitterY = (Math.cos(r * c * 29) * 0.5) * 40;
                    let px = c * 64 + 32 + jitterX;
                    let py = r * 64 + 32 + jitterY;
                    let isNearCliff = (c >= 32 && c <= 44 && r >= 6 && r <= 17);
                    let threshold = isNearCliff ? 0.85 : 0.6; 
                    if (!isKeepOut(px, py) && Math.sin(r*c*31) > threshold) {
                        let isRock = Math.sin(r*c*37) > 0;
                        let key = isRock ? (Math.sin(r*c*41)>0?'ts_rock1':'ts_rock2') : (Math.sin(r*c*41)>0?'ts_bush1':'ts_bush2');
                        this.placeTree(key, 0, px, py, 0.7, false);
                    }
                }
            }
        }

        treePoints.forEach(pt => {
            let biome = noise2D(pt.c * 0.08, pt.r * 0.08, 456);
            let treeKey = biome > 0 ? (Math.sin(pt.c*pt.r)>0?'ts_tree1':'ts_tree2') : (Math.sin(pt.c*pt.r)>0?'ts_tree3':'ts_tree4');
            let scaleVariation = 0.50 + Math.abs(Math.sin(pt.x * pt.y)) * 0.22;
            this.placeTree(treeKey, 0, pt.x, pt.y, scaleVariation, false);
        });

        let removedCustom = 0;
        CUSTOM_TREES.forEach(t => {
            let cCol = Math.floor(t.x / 64);
            let cRow = Math.floor(t.y / 64);
            let isTreeKeepOut = (cCol >= 34 && cCol <= 42 && cRow === 16);

            if (!isKeepOut(t.x, t.y) && !isTreeKeepOut) {
                this.placeTree(t.key, 0, t.x, t.y, t.scale, true);
            } else {
                removedCustom++;
            }
        });
        window.removedCustomTrees = removedCustom;
    }

    placeBuilding(key, x, y, scale = 1.0, collide = true) {
        const img = this.add.image(x, y, key);
        img.setScale(scale);
        img.setOrigin(0.5, 1);
        img.setDepth(y);

        if (collide) {
            const hitbox = this.physics.add.staticImage(x, y - img.displayHeight * 0.15, key);
            hitbox.setScale(scale * 0.65, scale * 0.25);
            hitbox.setAlpha(0);
            hitbox.setDepth(-1);
            this.buildingsGroup.add(hitbox);
        }
    }

    placeTree(key, frame, x, y, scale = 0.50, hasShadow = false) {
        if (hasShadow) {
            this.add.ellipse(x, y - 8, 55, 20, 0x000000, 0.30).setDepth(y - 1);
        }

        const tree = this.add.sprite(x, y, key, frame);
        tree.setScale(scale);
        tree.setOrigin(0.5, 1);
        tree.setDepth(y);
        this.treesGroup.add(tree);
    }

    placeChestItem(cfg) {
        this.add.ellipse(cfg.x, cfg.y - 4, 38, 14, 0x000000, 0.35).setDepth(cfg.y - 1);

        const hitbox = this.add.zone(cfg.x, cfg.y - 18, 40, 40);
        this.physics.add.existing(hitbox, true);
        hitbox.setData('item_id', cfg.id);
        hitbox.setData('nama_item', cfg.name);
        this.itemsGroup.add(hitbox);

        const g = this.add.graphics({ x: cfg.x, y: cfg.y });
        g.fillStyle(0x7c5c2a, 1);
        g.fillRoundedRect(-18, -28, 36, 26, 3);
        g.fillStyle(0x5a3e1a, 1);
        g.fillRect(-18, -17, 36, 3);
        g.fillStyle(0x9c7840, 1);
        g.fillRoundedRect(-18, -28, 36, 11, { tl: 3, tr: 3, bl: 0, br: 0 });
        g.fillStyle(0xffd700, 1);
        g.fillCircle(0, -17, 5);
        g.fillStyle(0xe6b800, 1);
        g.fillRect(-3, -15, 6, 5);
        g.lineStyle(2, 0x3e2a10, 1);
        g.strokeRoundedRect(-18, -28, 36, 26, 3);
        g.setDepth(cfg.y);

        this.add.text(cfg.x, cfg.y - 48, cfg.name, {
            fontFamily: 'sans-serif',
            fontSize: '12px',
            fontStyle: 'bold',
            color: '#ffd700',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setDepth(cfg.y + 10);
    }

    placeDecorativeNPCs() {
        this.npcList = [];
        const npcConfigs = [
            { id: 'pak_pakih', key: 'ts_warrior_idle', x: 1450, y: 550, scale: 1.0, shadowOffset: 12 },
            { id: 'kang_ujang', key: 'ts_lancer_idle', x: 1350, y: 490, scale: 1.0, shadowOffset: 12 },
            { id: 'bu_marni', key: 'ts_warrior_idle', x: 2350, y: 880, scale: 1.0, shadowOffset: 12 },
            { id: 'mbok_sri', key: 'ts_lancer_idle', x: 2650, y: 1150, scale: 1.0, shadowOffset: 12 }
        ];

        if (!this.anims.exists('npc_warrior_anim')) {
            this.anims.create({ key: 'ts_warrior_idle_anim', frames: this.anims.generateFrameNumbers('ts_warrior_idle', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
            this.anims.create({ key: 'ts_lancer_idle_anim', frames: this.anims.generateFrameNumbers('ts_lancer_idle', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        }

        npcConfigs.forEach(cfg => {
            const sprite = this.add.sprite(cfg.x, cfg.y, cfg.key, 0);
            sprite.setScale(cfg.scale);
            sprite.setOrigin(0.5, 1);
            sprite.setDepth(cfg.y);
            sprite.setData('npc_id', cfg.id);
            sprite.anims.play(cfg.key + '_anim', true);
            this.npcList.push({ id: cfg.id, sprite });
        });
    }

    placeDecorations() {
        this.bushList = [];
        const bushPositions = [{ x: 1350, y: 600 }, { x: 1850, y: 600 }, { x: 2250, y: 800 }, { x: 2420, y: 1250 }];
        bushPositions.forEach((pos, i) => {
            const bush = this.add.sprite(pos.x, pos.y, i % 2 === 0 ? 'ts_bush1' : 'ts_bush2', 0);
            bush.setScale(0.55);
            bush.setOrigin(0.5, 1);
            bush.setDepth(pos.y);
            this.bushList.push(bush);
        });
    }

    update() {
        if (!this.player || !this.player.body) return;

        this.player.setDepth(this.player.y);
        if (this.playerShadow) {
            this.playerShadow.setPosition(this.player.x, this.player.y - 6);
            this.playerShadow.setDepth(this.player.y - 1);
        }

        // Update PlayerController (Movement & Farming Action)
        this.playerController.update();
        
        // Get dynamic hitbox position for interaction checks
        const interactPos = this.playerController.getHitboxPos();

        // Cek Interaksi Peti Budaya
        let currentNearItem = null;
        // Use the interaction hitbox for overlap instead of player
        this.physics.overlap(this.playerController.interactionHitbox, this.itemsGroup, (hitbox, item) => {
            currentNearItem = item;
        });
        this.nearItem = currentNearItem;

        // Cek Interaksi NPC Warga menggunakan hitbox
        let currentNearNPC = null;
        let minNpcDist = 60; // radius deteksi lebih kecil dari hitbox
        this.npcList.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(interactPos.x, interactPos.y, npc.sprite.x, npc.sprite.y);
            if (dist < minNpcDist) {
                currentNearNPC = npc;
                minNpcDist = dist;
            }
        });
        this.nearNPC = currentNearNPC;

        // Cek Tebang Pohon menggunakan hitbox
        let currentNearTree = null;
        let minTreeDist = 70;
        const hx = interactPos.x;
        const hy = interactPos.y;
        const trees = this.treesGroup.getChildren();

        for (let i = 0; i < trees.length; i++) {
            const tree = trees[i];
            if (!tree.active) continue;
            const dx = tree.x - hx;
            if (dx > 70 || dx < -70) continue;
            const dy = tree.y - hy;
            if (dy > 70 || dy < -70) continue;

            const distSq = dx * dx + dy * dy;
            if (distSq < minTreeDist * minTreeDist) {
                currentNearTree = tree;
                minTreeDist = Math.sqrt(distSq);
            }
        }
        this.nearTree = currentNearTree;

        // Display Interaction Prompts
        if (this.nearItem) {
            this.promptText.setText(`Tekan [E] untuk Buka Jurnal (${this.nearItem.getData('nama_item')})`);
            this.promptText.setPosition(this.player.x, this.player.y - 70).setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                const itemId = this.nearItem.getData('item_id');
                this.cultureJurnalSystem.unlockEntry(itemId);
            }
        } else if (this.nearNPC) {
            const isMerchant = this.nearNPC.id === 'mbok_sri';
            this.promptText.setText(`Tekan [E] untuk ${isMerchant ? 'Buka Pasar Desa' : 'Bicara Warga'}`);
            this.promptText.setPosition(this.player.x, this.player.y - 70).setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                if (isMerchant) {
                    this.marketSystem.openMarketModal();
                } else {
                    this.npcManager.talkToNPC(this.nearNPC.id);
                }
            }
        } else if (this.nearTree) {
            this.promptText.setText('Tekan [F] untuk Tebang Pohon');
            this.promptText.setPosition(this.player.x, this.player.y - 70).setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
                let hp = this.nearTree.getData('hp') || 3;
                hp -= 1;
                this.nearTree.setData('hp', hp);
                this.nearTree.setTint(0xff4444);
                this.time.delayedCall(100, () => { if (this.nearTree && this.nearTree.active) this.nearTree.clearTint(); });

                if (hp <= 0) {
                    this.nearTree.destroy();
                    const wood = G.inv.find(i => i.id === 'wood');
                    if (wood) wood.qty += 3;
                    else G.inv.push({ id: 'wood', name: 'Kayu', qty: 3, icon: '<img src="/assets/Resources/Wood/W_Idle.png" width="32" height="32" style="object-fit:none; object-position: left;"/>' });
                    updateHotbarUI();
                    if (window.showToast) window.showToast('🪵 Mendapatkan +3 Kayu!');
                }
            }
        } else {
            this.promptText.setVisible(false);
        }
    }
}
