<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SchoolSetting extends Model
{
    protected $fillable = ['current_quarter'];

    protected function casts(): array
    {
        return ['current_quarter' => 'integer'];
    }

    public static function currentQuarter(): int
    {
        return (int) (static::query()->whereKey(1)->value('current_quarter') ?? 1);
    }
}
