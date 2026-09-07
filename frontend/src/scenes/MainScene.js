import Phaser from 'phaser';
import { initUI, G, updateHotbarUI } from '../ui';
import { initCraftingUI } from '../crafting';

/**
 * Menampilkan Popup Jurnal Nusatopia dan mempause scene game.
 * @param {string} namaItem 
 * @param {string} funFact 
 * @param {Phaser.Scene} scene 
 */
export function tampilkanJurnal(namaItem, funFact, scene) {
    const overlay = document.getElementById('jurnal-overlay');
    const judulEl = document.getElementById('jurnal-judul');
    const deskripsiEl = document.getElementById('jurnal-deskripsi');

    if (judulEl) judulEl.textContent = namaItem;
    if (deskripsiEl) deskripsiEl.textContent = funFact;

    if (overlay) {
        overlay.style.display = 'flex';
    }

    if (scene && scene.scene) {
        scene.scene.pause();
    }
}

export default class MainScene extends Phaser.Scene {
    constructor() {
        super('MainScene');
        this.lastInteractTime = 0;
        this.interactCooldown = 800; // Cooldown interaksi (ms)
        this.isFetching = false;
    }

    preload() {
        // Memuat spritesheet karakter hasil ekstraksi HTML
        this.load.spritesheet('walk_down', '/assets/walk_down.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('walk_up', '/assets/walk_up.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('walk_side', '/assets/walk_side.png', { frameWidth: 64, frameHeight: 64 });
        this.load.spritesheet('idle', '/assets/idle_down.png', { frameWidth: 64, frameHeight: 64 });
        
        // Memuat pohon
        this.load.image('tree1', '/assets/tree1_sheet.png');
    }

    create() {
        // Ukuran peta sandbox
        const worldWidth = 1600;
        const worldHeight = 1200;

        // Set batas dunia fisika (World Bounds)
        this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

        // 1. Visual Grid 32x32 pixel
        this.add.grid(
            worldWidth / 2,
            worldHeight / 2,
            worldWidth,
            worldHeight,
            32,
            32,
            0x2e7d32, // Background hijau rumput
            1,
            0x1b5e20, // Garis grid hijau tua
            0.5
        );

        // 2. Objek Player (Sprite Karakter) dengan Arcade Physics
        this.player = this.physics.add.sprite(worldWidth / 2, worldHeight / 2, 'idle');
        this.player.setCollideWorldBounds(true);

        // Membuat Animasi Pergerakan (walk_down, walk_up, walk_side, idle)
        this.anims.create({
            key: 'walk_down',
            frames: this.anims.generateFrameNumbers('walk_down', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'walk_side',
            frames: this.anims.generateFrameNumbers('walk_side', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'walk_up',
            frames: this.anims.generateFrameNumbers('walk_up', { start: 0, end: 5 }),
            frameRate: 8,
            repeat: -1
        });
        
        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNumbers('idle', { start: 0, end: 3 }),
            frameRate: 4,
            repeat: -1
        });

        // 2.5. Physics Static Group untuk Lingkungan (Pohon & Batu)
        this.treesGroup = this.physics.add.staticGroup();
        this.rocksGroup = this.physics.add.staticGroup();

        // 3. Physics Static Group untuk Item Warisan Nusantara
        this.itemsGroup = this.physics.add.staticGroup();

        const itemConfigs = [
            { id: 'batik', name: 'Batik', x: 500, y: 400, color: 0xe91e63 },
            { id: 'borobudur', name: 'Borobudur', x: 1100, y: 350, color: 0xff9800 },
            { id: 'angklung', name: 'Angklung', x: 800, y: 900, color: 0x9c27b0 }
        ];

        // Generate Hutan secara acak
        this.generateForest(worldWidth, worldHeight, itemConfigs);

        // Tambahkan tabrakan (Collision) antara Player dan Pohon/Batu
        this.physics.add.collider(this.player, this.treesGroup);
        this.physics.add.collider(this.player, this.rocksGroup);

        itemConfigs.forEach(cfg => {
            const item = this.add.rectangle(cfg.x, cfg.y, 36, 36, cfg.color);
            item.setData('item_id', cfg.id);
            item.setData('nama_item', cfg.name);

            // Label nama item di atas objek
            this.add.text(cfg.x, cfg.y - 28, cfg.name, {
                fontSize: '12px',
                color: '#ffffff',
                backgroundColor: 'rgba(0,0,0,0.6)',
                padding: { x: 4, y: 2 }
            }).setOrigin(0.5);

            this.itemsGroup.add(item);
        });

        // 4. Input Keyboard (WASD + Arrow Keys + Tombol 'E' + 'F')
        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        this.keyE = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.keyF = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // 5. Teks Prompt Interaksi saat dekat item
        this.promptText = this.add.text(0, 0, 'Tekan [E] untuk Interaksi', {
            fontSize: '14px',
            color: '#ffeb3b',
            backgroundColor: 'rgba(0,0,0,0.7)',
            padding: { x: 6, y: 3 }
        }).setOrigin(0.5).setVisible(false).setDepth(10);

        // 6. Kamera mengikuti pergerakan Player
        this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

        // Variable penampung item dekat
        this.nearItem = null;

        // 7. Event Listener Tombol Tutup Jurnal (Resume Game)
        const tutupBtn = document.getElementById('jurnal-tutup-btn');
        const overlay = document.getElementById('jurnal-overlay');

        if (tutupBtn && overlay) {
            tutupBtn.onclick = () => {
                overlay.style.display = 'none';
                this.scene.resume();
            };
        }

        // 8. Inisialisasi UI HUD & Hotbar Listeners
        initUI();
        initCraftingUI(this);
    }

    update() {
        if (!this.player || !this.player.body) return;

        const speed = 250;

        // Reset kecepatan player
        this.player.setVelocity(0);

        let isMoving = false;

        // Pergerakan Horizontal (Kiri / Kanan)
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-speed);
            this.player.anims.play('walk_side', true);
            this.player.setFlipX(true); // Hadap kiri
            isMoving = true;
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(speed);
            this.player.anims.play('walk_side', true);
            this.player.setFlipX(false); // Hadap kanan
            isMoving = true;
        }

        // Pergerakan Vertikal (Atas / Bawah)
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

        // Normalisasi kecepatan diagonal
        this.player.body.velocity.normalize().scale(speed);

        // Animasi Idle jika tidak bergerak
        if (!isMoving) {
            this.player.anims.play('idle', true);
        }

        // --- Mekanik Overlap & Interaksi Tombol 'E' dan 'F' ---
        let currentNearItem = null;
        this.physics.overlap(this.player, this.itemsGroup, (player, item) => {
            currentNearItem = item;
        });
        this.nearItem = currentNearItem;

        let currentNearTree = null;
        let minTreeDist = 80; // Jarak interaksi tebang pohon
        this.treesGroup.getChildren().forEach(tree => {
            if (tree.active) {
                const dist = Phaser.Math.Distance.Between(this.player.x, this.player.y, tree.x, tree.y);
                if (dist < minTreeDist) {
                    currentNearTree = tree;
                    minTreeDist = dist;
                }
            }
        });
        this.nearTree = currentNearTree;

        if (this.nearItem) {
            this.promptText.setText('Tekan [E] untuk Interaksi');
            this.promptText.setPosition(this.player.x, this.player.y - 35).setVisible(true);

            const now = this.time.now;
            if (Phaser.Input.Keyboard.JustDown(this.keyE)) {
                if (now - this.lastInteractTime > this.interactCooldown && !this.isFetching) {
                    this.lastInteractTime = now;
                    const itemId = this.nearItem.getData('item_id');
                    this.fetchTrivia(itemId);
                }
            }
        } else if (this.nearTree) {
            this.promptText.setText('Tekan [F] untuk Tebang Pohon');
            this.promptText.setPosition(this.player.x, this.player.y - 45).setVisible(true);

            if (Phaser.Input.Keyboard.JustDown(this.keyF)) {
                const now = this.time.now;
                if (now - this.lastInteractTime > 300) { // Cooldown mukul pohon
                    this.lastInteractTime = now;
                    let hp = this.nearTree.getData('hp');
                    hp -= 1;
                    this.nearTree.setData('hp', hp);
                    
                    // Efek visual sederhana (kedip merah)
                    this.nearTree.setTint(0xff0000);
                    this.time.delayedCall(100, () => {
                        if (this.nearTree && this.nearTree.active) this.nearTree.clearTint();
                    });

                    if (hp <= 0) {
                        this.nearTree.destroy(); // Hancur
                        console.log('Mendapatkan 3 Kayu');
                        
                        // Tambahkan kayu ke inventory
                        const wood = G.inv.find(i => i.id === 'wood');
                        if (wood) {
                            wood.qty += 3;
                        } else {
                            G.inv.push({ id: 'wood', name: 'Kayu', qty: 3, icon: '🪵' });
                        }
                        updateHotbarUI();
                    }
                }
            }
        } else {
            this.promptText.setVisible(false);
        }
    }

    /**
     * Memanggil API Laravel untuk mengambil data trivia kebudayaan dan menampilkannya di UI Jurnal
     * @param {string} itemId 
     */
    async fetchTrivia(itemId) {
        this.isFetching = true;
        console.log(`[API Request] Mengambil data trivia untuk item_id: '${itemId}'...`);

        try {
            const response = await fetch(`http://localhost:8000/api/trivia/${itemId}`);

            if (!response.ok) {
                throw new Error(`Gagal mengambil data dari API (Status: ${response.status})`);
            }

            const json = await response.json();

            // Tangkap data item trivia dari response Laravel
            const payload = json.data || json;
            const namaItem = payload.nama_item || 'Item Kebudayaan';
            const funFact = payload.fun_fact || 'Fakta menarik tidak ditemukan.';

            console.log('%c[API Response Success]', 'color: #4caf50; font-weight: bold;', namaItem);

            // Tampilkan Popup Jurnal Nusatopia & Pause Game
            tampilkanJurnal(namaItem, funFact, this);

        } catch (error) {
            console.error('%c[API Request Error]', 'color: #f44336; font-weight: bold;', error.message);
            // Tampilkan pesan error spesifik di Jurnal
            tampilkanJurnal('Gagal Memuat Data', `Terjadi kesalahan saat menghubungi API (${error.message}). Pastikan database MongoDB Atlas sudah di-whitelist IP dan server backend berjalan.`, this);
        } finally {
            this.isFetching = false;
        }
    }

    /**
     * Membangkitkan objek Pohon dan Batu secara acak tanpa menabrak item kebudayaan
     */
    generateForest(worldWidth, worldHeight, itemConfigs) {
        const numTrees = 50;
        const numRocks = 30;

        const isOverlap = (x, y, radius) => {
            // Cek overlap dengan item kebudayaan
            for (let item of itemConfigs) {
                const dist = Phaser.Math.Distance.Between(x, y, item.x, item.y);
                if (dist < radius + 60) return true; // Jarak aman
            }
            return false;
        };

        for (let i = 0; i < numTrees; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(100, worldWidth - 100);
                y = Phaser.Math.Between(100, worldHeight - 100);
            } while (isOverlap(x, y, 40));

            // Pohon dari gambar ekstraksi
            const tree = this.treesGroup.create(x, y, 'tree1');
            tree.setScale(0.3);
            tree.refreshBody();
            tree.setData('type', 'tree');
            tree.setData('hp', 3); // Butuh 3 kali pukul
        }

        for (let i = 0; i < numRocks; i++) {
            let x, y;
            do {
                x = Phaser.Math.Between(100, worldWidth - 100);
                y = Phaser.Math.Between(100, worldHeight - 100);
            } while (isOverlap(x, y, 30));

            // Abu-abu untuk batu
            const rock = this.add.rectangle(x, y, 50, 40, 0x757575);
            this.rocksGroup.add(rock);
            rock.setData('type', 'rock');
        }
    }
}
