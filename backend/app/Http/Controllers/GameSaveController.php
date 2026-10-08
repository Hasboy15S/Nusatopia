<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

class GameSaveController extends Controller
{
    /**
     * Menerima payload JSON dari Frontend untuk menyimpan state game.
     */
    public function save(Request $request)
    {
        try {
            // Struktur Validasi yang solid untuk mencegah cheating / payload ngawur
            $validated = $request->validate([
                'player_id' => 'required|string|max:50',
                
                // Posisi harus berupa angka
                'position' => 'required|array',
                'position.x' => 'required|numeric',
                'position.y' => 'required|numeric',
                
                // Inventory harus array, tiap item punya batas qty logis (anti cheat item 999999)
                'inventory' => 'required|array',
                'inventory.*.id' => 'required|string',
                'inventory.*.qty' => 'required|integer|min:1|max:999',
                
                // Validasi data kalender in-game
                'time' => 'required|array',
                'time.day' => 'required|integer|min:1|max:28',
                'time.season' => 'required|string|in:hujan,kemarau,pancaroba',
                'time.year' => 'required|integer|min:1',
                
                // Validasi sistem hati NPC, tidak boleh lebih dari 5 (anti cheat relationship)
                'npcs' => 'present|array',
                'npcs.*.id' => 'required|string',
                'npcs.*.hearts' => 'required|integer|min:0|max:5',
            ]);

            // Untuk simulasi ini, kita simpan JSON state ke Cache (bisa diganti Eloquent DB Model 'GameSave' nantinya)
            Cache::put('save_state_' . $validated['player_id'], $validated, now()->addDays(30));

            return response()->json([
                'status' => 'success',
                'message' => 'Game state successfully saved',
                'data' => $validated
            ]);

        } catch (ValidationException $e) {
            // Jika ada payload JSON dari sisi client yang dirusak/diedit sembarangan
            return response()->json([
                'status' => 'error',
                'message' => 'Data save tidak valid atau terdeteksi anomali (Cheat terdeteksi).',
                'errors' => $e->errors()
            ], 422);
        }
    }
    
    /**
     * Memuat data save terakhir pemain.
     */
    public function load($player_id)
    {
        $save = Cache::get('save_state_' . $player_id);
        
        if (!$save) {
            return response()->json([
                'status' => 'error',
                'message' => 'Save file not found.'
            ], 404);
        }
        
        return response()->json([
            'status' => 'success',
            'data' => $save
        ]);
    }
}
