<?php

namespace App\Enums;

enum ActivityPhase: string
{
    case GAMIFIED = 'gamified';
    case FORMATIVE = 'formative';
    case SUMMATIVE = 'summative';

    /**
     * @return array<string, string>
     */
    public static function labels(): array
    {
        return [
            self::GAMIFIED->value => 'Gamified Activity',
            self::FORMATIVE->value => 'Formative Quiz',
            self::SUMMATIVE->value => 'Weekly Summative Test',
        ];
    }
}
