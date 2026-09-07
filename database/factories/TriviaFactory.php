<?php

namespace Database\Factories;

use App\Models\Trivia;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Trivia>
 */
class TriviaFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'item_id' => fake()->unique()->slug(2),
            'nama_item' => fake()->words(2, true),
            'fun_fact' => fake()->sentence(),
        ];
    }
}
