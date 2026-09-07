<?php

namespace Database\Seeders;

use App\Models\Trivia;
use Illuminate\Database\Seeder;

class TriviaSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $trivias = [
            [
                'item_id' => 'batik',
                'nama_item' => 'Batik',
                'fun_fact' => 'UNESCO mengakui batik Indonesia sebagai Warisan Budaya Takbenda pada tahun 2009.',
            ],
            [
                'item_id' => 'rendang',
                'nama_item' => 'Rendang',
                'fun_fact' => 'Rendang dari Minangkabau sering disebut sebagai salah satu makanan terenak di dunia.',
            ],
            [
                'item_id' => 'borobudur',
                'nama_item' => 'Candi Borobudur',
                'fun_fact' => 'Borobudur adalah candi Buddha terbesar di dunia dan dibangun pada abad ke-8.',
            ],
            [
                'item_id' => 'komodo',
                'nama_item' => 'Komodo',
                'fun_fact' => 'Komodo hanya hidup alami di beberapa pulau di Nusa Tenggara Timur, termasuk Pulau Komodo.',
            ],
            [
                'item_id' => 'wayang',
                'nama_item' => 'Wayang Kulit',
                'fun_fact' => 'Pertunjukan wayang kulit masuk daftar Warisan Budaya Takbenda UNESCO sejak 2003.',
            ],
            [
                'item_id' => 'angklung',
                'nama_item' => 'Angklung',
                'fun_fact' => 'Angklung Sunda terbuat dari bambu, dan tiap tabungnya menghasilkan satu nada.',
            ],
            [
                'item_id' => 'rumah-gadang',
                'nama_item' => 'Rumah Gadang',
                'fun_fact' => 'Atap gonjong Rumah Gadang Minangkabau menyerupai tanduk kerbau.',
            ],
            [
                'item_id' => 'cendrawasih',
                'nama_item' => 'Cendrawasih',
                'fun_fact' => 'Cendrawasih Papua dikenal sebagai bird of paradise karena bulu jantan yang mencolok.',
            ],
        ];

        foreach ($trivias as $trivia) {
            Trivia::query()->updateOrCreate(
                ['item_id' => $trivia['item_id']],
                $trivia,
            );
        }
    }
}
