<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NpcController extends Controller
{
    /**
     * Mengambil level persahabatan NPC
     */
    public function show(string $npc_id): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'npc_id' => $npc_id,
                'hearts' => 3,
                'points' => 250,
            ],
        ]);
    }

    /**
     * Mengirim hadiah ke NPC
     */
    public function gift(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Hadiah berhasil diterima oleh warga desa.',
        ]);
    }
}
