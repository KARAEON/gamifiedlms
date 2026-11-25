<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GradeExportTemplate extends Model
{
    protected $fillable = ['teacher_id', 'name', 'sheet_name', 'heading', 'accent_color', 'columns', 'file_path', 'file_data'];

    protected function casts(): array
    {
        return ['columns' => 'array'];
    }
}
