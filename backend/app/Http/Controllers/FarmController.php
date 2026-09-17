<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FarmController extends Controller
{
    /**
     * Mengambil state lahan pertanian pemain
     */
    public function show(string $player_id): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'player_id' => $player_id,
                'farm_area' => 'Lahan Pertanian Nusatopia',
                'plots' => [],
            ],
        ]);
    }

    /**
     * Menyimpan state lahan pertanian pemain
     */
    public function save(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'State lahan pertanian berhasil disimpan ke database.',
        ]);
    }
}
