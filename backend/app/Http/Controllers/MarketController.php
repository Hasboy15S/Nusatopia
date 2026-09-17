<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MarketController extends Controller
{
    /**
     * Mengambil daftar harga pasar berdasarkan musim
     */
    public function prices(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'data' => [
                'currency' => 'Keping Nusa',
                'season' => $request->query('season', 'hujan'),
                'multipliers' => [
                    'padi' => 1.35,
                    'rempah' => 1.20,
                    'kopi' => 1.50,
                ],
            ],
        ]);
    }

    /**
     * Transaksi penjualan hasil panen
     */
    public function sell(Request $request): JsonResponse
    {
        return response()->json([
            'status' => 'success',
            'message' => 'Transaksi jual hasil panen berhasil diproses.',
        ]);
    }
}
