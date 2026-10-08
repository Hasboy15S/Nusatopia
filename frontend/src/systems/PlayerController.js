import Phaser from 'phaser';
import { G } from '../ui';

export class PlayerController {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.speed = 230;
        this.state = 'idle'; // 'idle', 'walk', 'action'
        this.facing = 'down'; // 'up', 'down', 'left', 'right'

        // Hitbox marker untuk deteksi interaksi dinamis di depan karakter (32x32)
        this.interactionHitbox = this.scene.add.rectangle(0, 0, 32, 32, 0xff0000, 0.3).setDepth(9999);
        this.interactionHitbox.setVisible(false); // Ubah ke true jika ingin melihat hitbox (debug)
        this.scene.physics.add.existing(this.interactionHitbox); // Jadikan physics object agar bisa di-overlap

        this.initInput();
    }

    initInput() {
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        this.wasd = this.scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            right: Phaser.Input.Keyboard.KeyCodes.D
        });
        
        this.keySpace = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    setupCamera(worldWidth, worldHeight) {
        // Setup batas map agar kamera tidak keluar
        this.scene.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
        // Setup fitur lerp (smooth camera) sebesar 0.08
        this.scene.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    }

    update() {
        // Jika sedang beraksi, kunci pergerakan
        if (this.state === 'action') {
            this.player.setVelocity(0);
            return; 
        }

        let velX = 0;
        let velY = 0;

        // Baca input dari Keyboard
        if (this.cursors.left.isDown || this.wasd.left.isDown) velX = -1;
        else if (this.cursors.right.isDown || this.wasd.right.isDown) velX = 1;

        if (this.cursors.up.isDown || this.wasd.up.isDown) velY = -1;
        else if (this.cursors.down.isDown || this.wasd.down.isDown) velY = 1;

        // State Machine sederhana untuk Movement dan Animasi
        if (velX !== 0 || velY !== 0) {
            // Normalisasi kecepatan diagonal menggunakan vector2
            const vec = new Phaser.Math.Vector2(velX, velY).normalize();
            this.player.setVelocity(vec.x * this.speed, vec.y * this.speed);
            this.state = 'walk';
            
            // Perbarui arah pandangan (facing)
            if (velX < 0) this.facing = 'left';
            else if (velX > 0) this.facing = 'right';
            else if (velY < 0) this.facing = 'up';
            else if (velY > 0) this.facing = 'down';

            // Mainkan Animasi sesuai arah
            if (velX !== 0) {
                this.player.anims.play('walk_side', true);
                this.player.setFlipX(velX < 0);
            } else if (velY < 0) {
                this.player.anims.play('walk_up', true);
            } else if (velY > 0) {
                this.player.anims.play('walk_down', true);
            }
        } else {
            this.player.setVelocity(0);
            this.state = 'idle';
            this.player.anims.play('idle', true);
        }

        // Hitung posisi hitbox di depan karakter (jarak 40px)
        const offsetDist = 40; 
        let hx = this.player.x;
        let hy = this.player.y - 16; // offset center point

        if (this.facing === 'up') hy -= offsetDist;
        else if (this.facing === 'down') hy += offsetDist;
        else if (this.facing === 'left') hx -= offsetDist;
        else if (this.facing === 'right') hx += offsetDist;

        this.interactionHitbox.setPosition(hx, hy);

        // Deteksi tombol SPACE untuk aksi (Bertani/Mencangkul dll)
        if (Phaser.Input.Keyboard.JustDown(this.keySpace)) {
            this.performAction();
        }
    }

    performAction() {
        this.state = 'action';
        this.player.setVelocity(0);
        
        // Tentukan animasi berdasarkan arah menghadap (facing)
        let animKey = 'action_down'; // Default ke bawah/atas
        if (this.facing === 'left' || this.facing === 'right') {
            animKey = 'action_side';
            // Pastikan sprite menghadap yang benar
            this.player.flipX = (this.facing === 'left');
        }

        // Cek alat spesifik (misal jika ada kapak untuk nebang)
        const currentItem = G.inv[G.selectedSlot];
        if (currentItem && currentItem.name.toLowerCase().includes('kapak')) {
            animKey = 'action_slice';
        }

        // Mainkan animasi sprite yang benar-benar ada
        this.player.anims.play(animKey, true);

        // Setelah animasi selesai, kembalikan ke idle dan eksekusi efek pertanian
        this.player.once('animationcomplete', () => {
            this.state = 'idle';
            this.player.anims.play('idle', true);
            this.scene.handleFarmingActionAt(this.interactionHitbox.x, this.interactionHitbox.y);
        });
    }
    
    getHitboxPos() {
        return { x: this.interactionHitbox.x, y: this.interactionHitbox.y };
    }
}
