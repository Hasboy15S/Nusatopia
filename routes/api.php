<?php

use App\Http\Controllers\TriviaController;
use Illuminate\Support\Facades\Route;

Route::get('/trivia', [TriviaController::class, 'index'])->name('trivia.index');
Route::post('/trivia', [TriviaController::class, 'store'])->name('trivia.store');
Route::get('/trivia/{item_id}', [TriviaController::class, 'show'])->name('trivia.show');
