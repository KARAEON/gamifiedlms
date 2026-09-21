<?php

namespace App\Enums;

enum ActivityType: string
{
    case MULTIPLE_CHOICE = 'multiple_choice';
    case MATCHING = 'matching';
    case GUESS_WORD = 'guess_word';
    case PICS_WORD = 'pics_word';
    case VISUAL_CHALLENGE = 'visual_challenge';

    /**
     * @return array<string, string>
     */
    public static function labels(): array
    {
        return [
            self::MULTIPLE_CHOICE->value => 'Multiple Choice Quiz',
            self::MATCHING->value => 'Matching Type',
            self::GUESS_WORD->value => 'Guess The Word',
            self::PICS_WORD->value => '4 Pics 1 Word',
            self::VISUAL_CHALLENGE->value => 'Visual Challenge',
        ];
    }
}

