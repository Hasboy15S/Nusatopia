import Phaser from 'phaser';
import { initUI, G, updateHotbarUI } from '../ui';
import { initCraftingUI } from '../crafting';
import { FOREST_ZONES, CUSTOM_TREES, CUSTOM_BUILDINGS, SPAWN_TILE } from '../map_design';
import { TimeCalendarSystem } from '../systems/TimeCalendarSystem';
import { FarmingSystem } from '../systems/FarmingSystem';
import { NPCManager } from '../systems/NPCManager';
import { MarketSystem } from '../systems/MarketSystem';
import { CultureJurnalSystem } from '../systems/CultureJurnalSystem';

const TILE_SIZE = 64;
const MAP_COLS = 50;
const MAP_ROWS = 35;

function createIslandMap() {
    const map = [];
    for (let r = 0; r < MAP_ROWS; r++) {
        const row = [];
        for (let c = 0; c < MAP_COLS; c++) {
            if (r < 3 || r >= MAP_ROWS - 3 || c < 3 || c >= MAP_COLS - 3) {
                row.push(0);
            } else {
                row.push(1);
            }
        }
        map.push(row);
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
        this.load.spritesheet('ts_tilemap', '/assets/ts_tilemap.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('ts_tree1', '/assets/ts_tree1.png', { frameWidth: 192, frameHeight: 256 });
        this.load.spritesheet('ts_tree2', '/assets/ts_tree2.png', { frameWidth: 192, frameHeight: 256 });
        this.load.spritesheet('ts_tree3', '/assets/ts_tree3.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('ts_tree4', '/assets/ts_tree4.png', { frameWidth: 192, frameHeight: 192 });

        this.load.image('ts_castle', '/assets/ts_castle.png');
        this.load.image('ts_tower', '/assets/ts_tower.png');
        this.load.image('ts_house1', '/assets/ts_house1.png');
        this.load.image('ts_house2', '/assets/ts_house2.png');
        this.load.image('ts_house3', '/assets/ts_house3.png');
        this.load.image('ts_barracks', '/assets/ts_barracks.png');

        this.load.spritesheet('ts_warrior_idle', '/assets/ts_warrior_idle.png', { frameWidth: 192, frameHeight: 192 });
        this.load.spritesheet('ts_lancer_idle', '/assets/ts_lancer_idle.png', { frameWidth: 320, frameHeight: 320 });
        this.load.spritesheet('ts_bush1', '/assets/ts_bush1.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('ts_bush2', '/assets/ts_bush2.png', { frameWidth: 128, frameHeight: 128 });
        this.load.image('ts_rock1', '/assets/ts_rock1.png');
        this.load.image('ts_rock2', '/assets/ts_rock2.png');

        this.load.spritesheet('ts_water_foam', '/assets/ts_water_foam.png', { frameWidth: 192, frameHeight: 192 });

        this.load.spritesheet('walk_down', '/assets/walk_down.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('walk_up', '/assets/walk_up.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('walk_side', '/assets/walk_side.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('idle', '/assets/idle_down.png', { frameWidth: 64, frameHeight: 64 });
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

        this.playerShadow = this.add.ellipse(startX, startY - 6, 42, 14, 0x000000, 0.35);
        this.player = this.physics.add.sprite(startX, startY, 'idle');
        this.player.setScale(1.6);
        this.player.setOrigin(0.5, 1);
        this.player.setCollideWorldBounds(true);
        this.player.body.setSize(24, 16);
        this.player.body.setOffset(20, 44);
        this.player.setDepth(500);

        this.anims.create({ key: 'walk_down', frames: this.anims.generateFrameNumbers('walk_down', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk_side', frames: this.anims.generateFrameNumbers('walk_side', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'walk_up', frames: this.anims.generateFrameNumbers('walk_up', { start: 0, end: 5 }), frameRate: 8, repeat: -1 });
        this.anims.create({ key: 'idle', frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }), frameRate: 4, repeat: -1 });

        this.player.anims.play('idle', true);

        // Colliders
        this.physics.add.collider(this.player, this.waterGroup);
        this.physics.add.collider(this.player, this.buildingsGroup);
        this.physics.add.collider(this.player, this.rocksGroup);

        // Keyboard & Pointer Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);
        this.keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        this.promptText = this.add.text(0, 0, 'Tekan [E] untuk Interaksi', {
            fontSize: '14px',
            color: '#ffeb3b',
            backgroundColor: 'rgba(0,0,0,0.75)',
            padding: { x: 8, y: 4 }
        }).setOrigin(0.5).setVisible(false).setDepth(9999);

        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Pointer click listener untuk bertani di posisi klik mouse
        this.input.on('pointerdown', (pointer) => {
            this.handleFarmingActionAt(pointer.worldX, pointer.worldY);
        });

        initUI(this);
        initCraftingUI(this);
        window.gameScene = this;
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
        const PURE_GREEN_GRASS = 1 * 9 + 1;

        const isLand = (r, c) => {
            if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return false;
            return MAP_LAYOUT[r][c] > 0;
        };

        for (let row = 0; row < MAP_ROWS; row++) {
            for (let col = 0; col < MAP_COLS; col++) {
                const px = col * TILE_SIZE + TILE_SIZE / 2;
                const py = row * TILE_SIZE + TILE_SIZE / 2;
                const tileType = MAP_LAYOUT[row][col];

                if (tileType === 0) {
                    const waterBody = this.add.zone(px, py, TILE_SIZE, TILE_SIZE);
                    this.physics.add.existing(waterBody, true);
                    this.waterGroup.add(waterBody);

                    if (isLand(row - 1, col) || isLand(row + 1, col) || isLand(row, col - 1) || isLand(row, col + 1)) {
                        const foam = this.add.sprite(px, py, 'ts_water_foam', 0);
                        foam.setScale(0.35);
                        foam.setDepth(1);
                        foam.anims.play('water_foam_anim', true);
                    }
                    continue;
                }

                const tile = this.add.image(px, py, 'ts_tilemap', PURE_GREEN_GRASS);
                tile.setDepth(0);
                this.terrainLayer.add(tile);
            }
        }
    }

    placeBuildingsAndTrees() {
        CUSTOM_BUILDINGS.forEach(b => this.placeBuilding(b.key, b.x, b.y, b.scale, true));

        FOREST_ZONES.forEach((zone, zIdx) => {
            const centerX = zone.c * TILE_SIZE;
            const centerY = zone.r * TILE_SIZE;
            const radiusPx = zone.radius * TILE_SIZE;
            const area = Math.PI * zone.radius * zone.radius;
            const count = Math.round(area * zone.density * 2.4);

            for (let i = 0; i < count; i++) {
                const seed1 = (zIdx * 397 + i * 137) % 1000 / 1000;
                const seed2 = (zIdx * 211 + i * 271) % 1000 / 1000;
                const seed3 = (zIdx * 53  + i * 89)  % 100  / 100;

                const angle = seed1 * Math.PI * 2;
                const dist  = Math.sqrt(seed2) * radiusPx * 0.95;

                const px = centerX + Math.cos(angle) * dist;
                const py = centerY + Math.sin(angle) * dist;

                const spawnX = SPAWN_TILE.col * TILE_SIZE;
                const spawnY = SPAWN_TILE.row * TILE_SIZE;
                if (Phaser.Math.Distance.Between(px, py, spawnX, spawnY) < 160) continue;

                const chestCoords = [{ x: 800, y: 700 }, { x: 800, y: 1600 }, { x: 1600, y: 1850 }];
                if (chestCoords.some(c => Phaser.Math.Distance.Between(px, py, c.x, c.y) < 80)) continue;

                const variant = zone.treeVariants[Math.floor(seed3 * zone.treeVariants.length)];
                const treeKey = `ts_tree${variant}`;
                const scaleVariation = 0.50 + seed1 * 0.22;

                this.placeTree(treeKey, 0, px, py, scaleVariation, false);
            }
        });

        CUSTOM_TREES.forEach(t => this.placeTree(t.key, 0, t.x, t.y, t.scale, true));
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
            { id: 'pak_pakih', key: 'ts_warrior_idle', x: 1450, y: 550, scale: 0.70, shadowOffset: 36 },
            { id: 'kang_ujang', key: 'ts_lancer_idle', x: 1350, y: 490, scale: 0.55, shadowOffset: 48 },
            { id: 'bu_marni', key: 'ts_warrior_idle', x: 2350, y: 880, scale: 0.70, shadowOffset: 36 },
            { id: 'mbok_sri', key: 'ts_lancer_idle', x: 2650, y: 1150, scale: 0.55, shadowOffset: 48 }
        ];

        npcConfigs.forEach(cfg => {
            this.add.ellipse(cfg.x, cfg.y - cfg.shadowOffset, 44, 16, 0x000000, 0.35).setDepth(cfg.y - 1);
            const sprite = this.add.sprite(cfg.x, cfg.y, cfg.key, 0);
            sprite.setScale(cfg.scale);
            sprite.setOrigin(0.5, 1);
            sprite.setDepth(cfg.y);
            sprite.setData('npc_id', cfg.id);
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

        const speed = 230;
        this.player.setVelocity(0);
        let isMoving = false;

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('walk_side', true);
            this.player.setFlipX(true);
            isMoving = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.anims.play('walk_side', true);
            this.player.setFlipX(false);
            isMoving = true;
        }

        if (this.cursors.up.isDown || this.wasd.up.isDown) {
            this.player.setVelocityY(-speed);
            if (!isMoving) {
                this.player.anims.play('walk_up', true);
                isMoving = true;
            }
        } else if (this.cursors.down.isDown || this.wasd.down.isDown) {
            this.player.setVelocityY(speed);
            if (!isMoving) {
                this.player.anims.play('walk_down', true);
                isMoving = true;
            }
        }

        this.player.body.velocity.normalize().scale(speed);
        if (!isMoving) this.player.anims.play('idle', true);

        // Spacebar shortcut untuk aksi bertani di posisi berdiri player
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.handleFarmingActionAt(this.player.x, this.player.y);
        }

        // Cek Interaksi Peti Budaya
        let currentNearItem = null;
        this.physics.overlap(this.player, this.itemsGroup, (player, item) => {
            currentNearItem = item;
        });
        this.nearItem = currentNearItem;

        // Cek Interaksi NPC Warga
        let currentNearNPC = null;
        let minNpcDist = 90;
        this.npcList.forEach(npc => {
            const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, npc.sprite.x, npc.sprite.y);
            if (dist < minNpcDist) {
                currentNearNPC = npc;
                minNpcDist = dist;
            }
        });
        this.nearNPC = currentNearNPC;

        // Cek Tebang Pohon
        let currentNearTree = null;
        let minTreeDist = 80;
        const px = this.player.x;
        const py = this.player.y;
        const trees = this.treesGroup.getChildren();

        for (let i = 0; i < trees.length; i++) {
            const tree = trees[i];
            if (!tree.active) continue;
            const dx = tree.x - px;
            if (dx > 80 || dx < -80) continue;
            const dy = tree.y - py;
            if (dy > 80 || dy < -80) continue;

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
                    else G.inv.push({ id: 'wood', name: 'Kayu', qty: 3, icon: '🪵' });
                    updateHotbarUI();
                    if (window.showToast) window.showToast('🪵 Mendapatkan +3 Kayu!');
                }
            }
        } else {
            this.promptText.setVisible(false);
        }
    }
}
