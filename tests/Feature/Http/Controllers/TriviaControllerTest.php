<?php

namespace Tests\Feature\Http\Controllers;

use App\Models\Trivia;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class TriviaControllerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        config(['database.connections.mongodb.database' => 'nusatopia_testing']);
        DB::purge('mongodb');

        try {
            Trivia::query()->delete();
        } catch (\Throwable $exception) {
            $this->markTestSkipped('MongoDB tidak dapat dihubungi untuk pengujian.');
        }
    }

    public function test_index_returns_empty_list_when_no_trivia_exists(): void
    {
        $this->getJson('/api/trivia')
            ->assertOk()
            ->assertExactJson([
                'success' => true,
                'data' => [],
            ]);
    }

    public function test_index_returns_trivia_sorted_by_nama_item(): void
    {
        Trivia::factory()->create([
            'item_id' => 'wayang',
            'nama_item' => 'Wayang Kulit',
            'fun_fact' => 'Wayang adalah seni pertunjukan Jawa.',
        ]);

        Trivia::factory()->create([
            'item_id' => 'batik',
            'nama_item' => 'Batik',
            'fun_fact' => 'Batik diakui UNESCO.',
        ]);

        $this->getJson('/api/trivia')
            ->assertOk()
            ->assertExactJson([
                'success' => true,
                'data' => [
                    [
                        'item_id' => 'batik',
                        'nama_item' => 'Batik',
                        'fun_fact' => 'Batik diakui UNESCO.',
                    ],
                    [
                        'item_id' => 'wayang',
                        'nama_item' => 'Wayang Kulit',
                        'fun_fact' => 'Wayang adalah seni pertunjukan Jawa.',
                    ],
                ],
            ]);
    }

    public function test_show_returns_trivia_for_matching_item_id(): void
    {
        Trivia::factory()->create([
            'item_id' => 'rendang',
            'nama_item' => 'Rendang',
            'fun_fact' => 'Rendang berasal dari Minangkabau.',
        ]);

        $this->getJson('/api/trivia/rendang')
            ->assertOk()
            ->assertExactJson([
                'success' => true,
                'data' => [
                    'item_id' => 'rendang',
                    'nama_item' => 'Rendang',
                    'fun_fact' => 'Rendang berasal dari Minangkabau.',
                ],
            ]);
    }

    public function test_show_returns_404_when_trivia_does_not_exist(): void
    {
        $this->getJson('/api/trivia/tidak-ada')
            ->assertNotFound()
            ->assertExactJson([
                'success' => false,
                'message' => 'Trivia tidak ditemukan.',
            ]);
    }

    public function test_store_creates_trivia_and_returns_201(): void
    {
        $this->postJson('/api/trivia', [
            'item_id' => 'batik',
            'nama_item' => 'Batik',
            'fun_fact' => 'Batik diakui UNESCO.',
        ])
            ->assertCreated()
            ->assertExactJson([
                'success' => true,
                'data' => [
                    'item_id' => 'batik',
                    'nama_item' => 'Batik',
                    'fun_fact' => 'Batik diakui UNESCO.',
                ],
            ]);

        $this->assertNotNull(Trivia::query()->where('item_id', 'batik')->first());
    }

    public function test_store_returns_422_when_payload_is_empty(): void
    {
        $this->postJson('/api/trivia', [])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['item_id', 'nama_item', 'fun_fact']);

        $this->assertSame(0, Trivia::query()->count());
    }

    public function test_store_returns_422_when_item_id_already_exists(): void
    {
        Trivia::factory()->create([
            'item_id' => 'batik',
            'nama_item' => 'Batik',
            'fun_fact' => 'Batik diakui UNESCO.',
        ]);

        $this->postJson('/api/trivia', [
            'item_id' => 'batik',
            'nama_item' => 'Batik Jawa',
            'fun_fact' => 'Fun fact lain.',
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors(['item_id']);

        $this->assertSame(1, Trivia::query()->count());
    }
}
