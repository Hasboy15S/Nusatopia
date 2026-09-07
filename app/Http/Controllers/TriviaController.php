<?php

namespace App\Http\Controllers;

use App\Models\Trivia;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class TriviaController extends Controller
{
    /**
     * Menampilkan daftar trivia.
     */
    public function index(): JsonResponse
    {
        $trivias = Trivia::query()
            ->orderBy('nama_item')
            ->orderBy('item_id')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $trivias->map(fn (Trivia $trivia): array => $this->triviaPayload($trivia))->values(),
        ]);
    }

    /**
     * Menyimpan trivia baru.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'item_id' => ['required', 'string', 'max:100', 'alpha_dash', Rule::unique(Trivia::class, 'item_id')],
            'nama_item' => ['required', 'string', 'max:255'],
            'fun_fact' => ['required', 'string', 'max:2000'],
        ]);

        $trivia = Trivia::query()->create($validated);

        return response()->json([
            'success' => true,
            'data' => $this->triviaPayload($trivia),
        ], 201);
    }

    /**
     * Menampilkan data trivia berdasarkan item_id.
     */
    public function show(string $item_id): JsonResponse
    {
        $trivia = Trivia::where('item_id', $item_id)->first();

        if (! $trivia) {
            return response()->json([
                'success' => false,
                'message' => 'Trivia tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $this->triviaPayload($trivia),
        ]);
    }

    /**
     * @return array{item_id: string, nama_item: string, fun_fact: string}
     */
    private function triviaPayload(Trivia $trivia): array
    {
        return [
            'item_id' => $trivia->item_id,
            'nama_item' => $trivia->nama_item,
            'fun_fact' => $trivia->fun_fact,
        ];
    }
}
