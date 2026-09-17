<?php

use App\Http\Controllers\FarmController;
use App\Http\Controllers\MarketController;
use App\Http\Controllers\NpcController;
use App\Http\Controllers\TriviaController;
use Illuminate\Support\Facades\Route;

// ── Trivia & Jurnal Nusantara ─────────────────────────────────────────────
Route::get('/trivia', [TriviaController::class, 'index'])->name('trivia.index');
Route::post('/trivia', [TriviaController::class, 'store'])->name('trivia.store');
Route::get('/trivia/{item_id}', [TriviaController::class, 'show'])->name('trivia.show');

// ── Farming State API ─────────────────────────────────────────────────────
Route::get('/farm/{player_id}', [FarmController::class, 'show'])->name('farm.show');
Route::post('/farm/save', [FarmController::class, 'save'])->name('farm.save');

// ── NPC Relationship API ──────────────────────────────────────────────────
Route::get('/npc/relationship/{npc_id}', [NpcController::class, 'show'])->name('npc.show');
Route::post('/npc/gift', [NpcController::class, 'gift'])->name('npc.gift');

// ── Market Desa API ───────────────────────────────────────────────────────
Route::get('/market/prices', [MarketController::class, 'prices'])->name('market.prices');
Route::post('/market/sell', [MarketController::class, 'sell'])->name('market.sell');
