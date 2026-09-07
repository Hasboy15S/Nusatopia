<?php

namespace App\Models;

use Database\Factories\TriviaFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use MongoDB\Laravel\Eloquent\Model;

class Trivia extends Model
{
    /** @use HasFactory<TriviaFactory> */
    use HasFactory;

    /**
     * Koneksi database yang digunakan model ini.
     *
     * @var string
     */
    protected $connection = 'mongodb';

    /**
     * Nama collection MongoDB.
     *
     * @var string
     */
    protected $table = 'trivias';

    /**
     * Atribut yang boleh diisi secara mass-assignment.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'item_id',
        'nama_item',
        'fun_fact',
    ];
}
