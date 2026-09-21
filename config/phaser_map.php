<?php

$quarterDefinitions = [
    'q1' => [
        'label' => 'Q1',
        'title' => 'Matter',
        'subtitle' => 'VULCAN CAVERNS',
        'majors' => [
            ['title' => 'Mixtures', 'icon' => 'beaker'],
            ['title' => 'Separation Techniques', 'icon' => 'filter'],
            ['title' => 'Useful Mixtures', 'icon' => 'spark'],
        ],
    ],
    'q2' => [
        'label' => 'Q2',
        'title' => 'Living Things',
        'subtitle' => 'VULCAN CAVERNS',
        'majors' => [
            ['title' => 'Body Systems', 'icon' => 'heart'],
            ['title' => 'Animal Groups', 'icon' => 'paw'],
            ['title' => 'Ecosystems', 'icon' => 'leaf'],
        ],
    ],
    'q3' => [
        'label' => 'Q3',
        'title' => 'Force, Motion, Energy',
        'subtitle' => 'VULCAN CAVERNS',
        'majors' => [
            ['title' => 'Gravity and Friction', 'icon' => 'arrow'],
            ['title' => 'Energy Transformations', 'icon' => 'bolt'],
            ['title' => 'Simple Machines', 'icon' => 'gear'],
        ],
    ],
    'q4' => [
        'label' => 'Q4',
        'title' => 'Earth and Space',
        'subtitle' => 'VULCAN CAVERNS',
        'majors' => [
            ['title' => 'Earthquakes and Volcanoes', 'icon' => 'mountain'],
            ['title' => 'Seasons', 'icon' => 'sun'],
            ['title' => 'Solar System', 'icon' => 'orbit'],
        ],
    ],
];

$quarters = [];

foreach ($quarterDefinitions as $quarterKey => $quarterDefinition) {
    $majors = [];

    foreach ($quarterDefinition['majors'] as $majorIndex => $majorDefinition) {
        $majorNumber = $majorIndex + 1;
        $majorKey = sprintf('%s-major-%d', $quarterKey, $majorNumber);
        $lessons = [];

        for ($lessonNumber = 1; $lessonNumber <= 5; $lessonNumber++) {
            $lessonKey = sprintf('%s-m%d-l%d', $quarterKey, $majorNumber, $lessonNumber);

            $lessons[$lessonKey] = [
                'lesson_key' => $lessonKey,
                'quarter_key' => $quarterKey,
                'quarter_label' => $quarterDefinition['label'],
                'quarter_title' => $quarterDefinition['title'],
                'parent_major_key' => $majorKey,
                'parent_major_title' => $majorDefinition['title'],
                'lesson_number' => $lessonNumber,
                'title' => sprintf('%s %d', $majorDefinition['title'], $lessonNumber),
            ];
        }

        $majors[$majorKey] = [
            'major_key' => $majorKey,
            'quarter_key' => $quarterKey,
            'quarter_label' => $quarterDefinition['label'],
            'quarter_title' => $quarterDefinition['title'],
            'major_number' => $majorNumber,
            'title' => $majorDefinition['title'],
            'icon' => $majorDefinition['icon'],
            'lessons' => $lessons,
        ];
    }

    $quarters[$quarterKey] = [
        'quarter_key' => $quarterKey,
        'label' => $quarterDefinition['label'],
        'title' => $quarterDefinition['title'],
        'subtitle' => $quarterDefinition['subtitle'],
        'majors' => $majors,
    ];
}

return [
    'quarters' => $quarters,
];
