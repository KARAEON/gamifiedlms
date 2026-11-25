<?php

namespace App\Services;

class GameAssessmentPool
{
    /** @return array<int, array<string, mixed>> */
    public function additionalItems(string $lessonKey): array
    {
        return match ($lessonKey) {
            'q1-m1-l1' => array_merge($this->classificationItems(), $this->bonusItems('l1')),
            'q1-m1-l2' => array_merge($this->sortingAndUsesItems(), $this->bonusItems('l2')),
            'q1-m1-l3' => array_merge($this->comparisonItems(), $this->bonusItems('l3')),
            'q1-m1-l4' => array_merge($this->evidenceItems(), $this->bonusItems('l4')),
            'q1-m1-l5' => $this->summativeItems(),
            default => [],
        };
    }

    /** @return array<int, array<string, mixed>> */
    private function classificationItems(): array
    {
        $examples = [
            ['salt water', 'Uniform Mixture', 'the dissolved salt is not visible'],
            ['sugar water', 'Uniform Mixture', 'the dissolved sugar is spread evenly'],
            ['clear tea', 'Uniform Mixture', 'the filtered drink looks the same throughout'],
            ['soy sauce', 'Uniform Mixture', 'it has a consistent appearance'],
            ['food coloring mixed into water', 'Uniform Mixture', 'the color is spread evenly'],
            ['fruit salad', 'Non-uniform Mixture', 'the different fruit pieces are visible'],
            ['sand and water', 'Non-uniform Mixture', 'the sand can be seen separately'],
            ['oil and water', 'Non-uniform Mixture', 'two separate layers can be seen'],
            ['cereal with milk', 'Non-uniform Mixture', 'the cereal pieces remain visible'],
            ['trail snack mix', 'Non-uniform Mixture', 'the nuts and raisins can be seen separately'],
        ];
        $items = [];
        foreach ($examples as $index => [$name, $type, $evidence]) {
            $other = $type === 'Uniform Mixture' ? 'Non-uniform Mixture' : 'Uniform Mixture';
            $opposite = $type === 'Uniform Mixture' ? 'its parts are visibly separate' : 'it looks the same throughout';
            $id = 'l1-'.($index * 4 + 6);
            $items[] = $this->item($id, "How should {$name} be classified?", [$type, $other, 'Pure substance'], $type, "For {$name}, {$evidence}.");
            $items[] = $this->item('l1-'.($index * 4 + 7), "What observation best describes {$name}?", [$evidence, $opposite, 'It contains no matter'], $evidence, ucfirst($evidence).'.');
            $items[] = $this->item('l1-'.($index * 4 + 8), "Why is {$name} a {$type}?", [$evidence, $opposite, 'Its name tells us its type'], $evidence, ucfirst($evidence).'.');
            $claim = ucfirst($name)." is a {$type} because {$evidence}.";
            $items[] = $this->item('l1-'.($index * 4 + 9), "Which claim about {$name} uses observable evidence?", [$claim, ucfirst($name)." is a {$other} because {$evidence}.", ucfirst($name).' cannot be classified by observation.'], $claim, $claim);
        }
        return $items;
    }

    /** @return array<int, array<string, mixed>> */
    private function sortingAndUsesItems(): array
    {
        $examples = [
            ['lemonade with dissolved sugar', 'Uniform', 'beverage', 'it looks the same throughout'],
            ['vegetable salad', 'Non-uniform', 'food', 'the vegetables are visible'],
            ['salt water', 'Uniform', 'cooking', 'the salt is dissolved evenly'],
            ['fruit salad', 'Non-uniform', 'food', 'the fruit pieces are visible'],
            ['soy sauce', 'Uniform', 'seasoning', 'it has a consistent appearance'],
            ['trail snack mix', 'Non-uniform', 'snack', 'the ingredients remain visible'],
            ['powdered juice dissolved in water', 'Uniform', 'beverage', 'the powder is spread evenly'],
            ['cereal with milk', 'Non-uniform', 'breakfast food', 'the cereal and milk can be seen separately'],
            ['oil and water in a demonstration jar', 'Non-uniform', 'science demonstration', 'two layers form'],
            ['food coloring mixed evenly in water', 'Uniform', 'coloring for an experiment', 'the color spreads throughout'],
        ];
        $items = [];
        foreach ($examples as $index => [$name, $type, $use, $evidence]) {
            $other = $type === 'Uniform' ? 'Non-uniform' : 'Uniform';
            $base = $index * 4 + 6;
            $items[] = $this->item('l2-'.$base, "Which sorting bin fits {$name}?", [$type, $other, 'Not a mixture'], $type, ucfirst($evidence).'.');
            $items[] = $this->item('l2-'.($base + 1), "Which real-life use fits {$name}?", [$use, 'fuel for a vehicle', 'building a computer'], $use, ucfirst($name)." can be used as {$use}.");
            $items[] = $this->item('l2-'.($base + 2), "What observation helps sort {$name}?", [$evidence, 'its container color', 'its price'], $evidence, ucfirst($evidence).'.');
            $pair = ucfirst($name)." — {$type} — {$use}";
            $items[] = $this->item('l2-'.($base + 3), "Which classification and use pair is correct for {$name}?", [$pair, ucfirst($name)." — {$other} — {$use}", ucfirst($name).' — pure substance — fuel'], $pair, $pair.'.');
        }
        return $items;
    }

    /** @return array<int, array<string, mixed>> */
    private function comparisonItems(): array
    {
        $pairs = [
            ['salt water', 'sand and water'],
            ['soy sauce', 'fruit salad'],
            ['clear tea', 'vegetable salad'],
            ['sugar water', 'cereal with milk'],
            ['dissolved powdered juice', 'trail snack mix'],
            ['vinegar', 'oil and water'],
            ['food coloring mixed evenly in water', 'halo-halo'],
            ['filtered coffee', 'mixed nuts'],
            ['sports drink', 'soil with pebbles'],
            ['clear broth', 'vegetable soup with visible pieces'],
        ];
        $items = [];
        foreach ($pairs as $index => [$uniform, $nonuniform]) {
            $base = $index * 4 + 6;
            $items[] = $this->item('l3-'.$base, "Which looks the same throughout: {$uniform} or {$nonuniform}?", [$uniform, $nonuniform, 'Both have visible pieces'], $uniform, ucfirst($uniform).' is uniform in appearance.');
            $items[] = $this->item('l3-'.($base + 1), "Which has visibly separate parts: {$uniform} or {$nonuniform}?", [$nonuniform, $uniform, 'Neither mixture'], $nonuniform, ucfirst($nonuniform).' has visible parts.');
            $pair = ucfirst($uniform).' is uniform; '.ucfirst($nonuniform).' is non-uniform';
            $items[] = $this->item('l3-'.($base + 2), "Which comparison of {$uniform} and {$nonuniform} is correct?", [$pair, ucfirst($uniform).' is non-uniform; '.ucfirst($nonuniform).' is uniform', 'Both are pure substances'], $pair, $pair.'.');
            $reason = ucfirst($uniform).' looks even, while '.ucfirst($nonuniform).' has visible parts';
            $items[] = $this->item('l3-'.($base + 3), "What evidence distinguishes {$uniform} from {$nonuniform}?", [$reason, 'Their containers have different sizes', 'Both must be classified by taste'], $reason, $reason.'.');
        }
        return $items;
    }

    /** @return array<int, array<string, mixed>> */
    private function evidenceItems(): array
    {
        $cases = [
            ['halo-halo', 'Non-uniform', 'its ingredients can be seen separately'],
            ['soy sauce', 'Uniform', 'it looks the same throughout'],
            ['oil and water', 'Non-uniform', 'it separates into two layers'],
            ['dissolved powdered juice', 'Uniform', 'its color is evenly spread'],
            ['vegetable salad', 'Non-uniform', 'the vegetables remain visible'],
            ['clear tea', 'Uniform', 'it has the same appearance throughout'],
            ['trail snack mix', 'Non-uniform', 'its nuts and raisins remain visible'],
            ['salt water', 'Uniform', 'the dissolved salt cannot be seen separately'],
            ['cereal with milk', 'Non-uniform', 'the cereal pieces can be seen in the milk'],
            ['food coloring mixed evenly in water', 'Uniform', 'the color is distributed throughout'],
        ];
        $items = [];
        foreach ($cases as $index => [$name, $type, $evidence]) {
            $other = $type === 'Uniform' ? 'Non-uniform' : 'Uniform';
            $base = $index * 4 + 6;
            $claim = ucfirst($name)." is {$type} because {$evidence}.";
            $items[] = $this->item('l4-'.$base, "What is the best classification of {$name}?", [$type, $other, 'Pure element'], $type, ucfirst($evidence).'.');
            $items[] = $this->item('l4-'.($base + 1), "Which observation supports the classification of {$name}?", [$evidence, 'its name sounds familiar', 'its container is large'], $evidence, ucfirst($evidence).'.');
            $items[] = $this->item('l4-'.($base + 2), "Which science defense of {$name} includes a claim and evidence?", [$claim, ucfirst($name).' is interesting.', ucfirst($name).' is a mixture because I like it.'], $claim, $claim);
            $items[] = $this->item('l4-'.($base + 3), "A classmate calls {$name} {$other}. Which evidence corrects the claim?", [$evidence, 'the classmate said it loudly', 'the mixture has a label'], $evidence, ucfirst($evidence).'.');
        }
        return $items;
    }

    /** @return array<int, array<string, mixed>> */
    private function summativeItems(): array
    {
        $items = [];
        foreach (['q1-m1-l1', 'q1-m1-l2', 'q1-m1-l3', 'q1-m1-l4'] as $lesson) {
            foreach ($this->additionalItems($lesson) as $index => $item) {
                if ($index >= 40 || $index % 4 >= 2) {
                    continue;
                }
                $item['id'] = 'st-'.(count($items) + 21);
                $items[] = $item;
            }
        }
        return $items;
    }

    /** @return array<int, array<string, mixed>> */
    private function bonusItems(string $lesson): array
    {
        $questions = match ($lesson) {
            'l1' => [
                ['A jar contains water and visible pebbles. What type of mixture is it?', ['Non-uniform Mixture', 'Uniform Mixture', 'Pure substance'], 'Non-uniform Mixture'],
                ['A clear, fully dissolved sugar solution is observed. Which property identifies it?', ['Same appearance throughout', 'Visible sugar grains', 'Separate layers'], 'Same appearance throughout'],
                ['Which mixture has visible ingredients?', ['Mixed nuts', 'Salt water', 'Filtered tea'], 'Mixed nuts'],
                ['Which sample is uniform in appearance?', ['Vinegar', 'Fruit salad', 'Sand and water'], 'Vinegar'],
                ['What is the key difference between uniform and non-uniform mixtures?', ['Whether parts can be seen separately', 'The size of the container', 'The mixture name'], 'Whether parts can be seen separately'],
            ],
            'l2' => [
                ['A lunchbox contains nuts and raisins. Where should it be sorted?', ['Non-uniform', 'Uniform', 'Pure liquid'], 'Non-uniform'],
                ['Which mixture is commonly used as a drink?', ['Lemonade', 'Sand and water', 'Trail mix'], 'Lemonade'],
                ['Which mixture is commonly used to season food?', ['Soy sauce', 'Soil with pebbles', 'Oil and water in a jar'], 'Soy sauce'],
                ['Why does fruit salad belong in the non-uniform bin?', ['Its fruit pieces are visible', 'It is served cold', 'It is sweet'], 'Its fruit pieces are visible'],
                ['What use best fits a layered oil and water sample?', ['Science demonstration', 'Breakfast cereal', 'Seasoning'], 'Science demonstration'],
            ],
            'l3' => [
                ['Compare clear tea and halo-halo. Which is non-uniform?', ['Halo-halo', 'Clear tea', 'Both'], 'Halo-halo'],
                ['Compare sugar water and mixed nuts. Which is uniform?', ['Sugar water', 'Mixed nuts', 'Both'], 'Sugar water'],
                ['Why is oil and water different from vinegar?', ['Oil and water forms visible layers', 'Vinegar has visible pebbles', 'Both are pure elements'], 'Oil and water forms visible layers'],
                ['Which pair contains one uniform and one non-uniform mixture?', ['Soy sauce and fruit salad', 'Salt water and sugar water', 'Sand and water and trail mix'], 'Soy sauce and fruit salad'],
                ['Which sample has the more even appearance: filtered coffee or cereal with milk?', ['Filtered coffee', 'Cereal with milk', 'They are identical'], 'Filtered coffee'],
            ],
            'l4' => [
                ['Which evidence supports calling a snack mix non-uniform?', ['Nuts and raisins are visible', 'Its packet is colorful', 'It tastes sweet'], 'Nuts and raisins are visible'],
                ['A student says salt water is uniform. Which evidence supports the claim?', ['Dissolved salt is spread evenly', 'The cup is transparent', 'The cup is full'], 'Dissolved salt is spread evenly'],
                ['Which claim about oil and water includes sound evidence?', ['It is non-uniform because two layers form', 'It is uniform because it is liquid', 'It is pure because it is clear'], 'It is non-uniform because two layers form'],
                ['Which observation would challenge a claim that a salad is uniform?', ['Separate vegetable pieces can be seen', 'It is in a bowl', 'It is served for lunch'], 'Separate vegetable pieces can be seen'],
                ['A good defense of a mixture classification must include what?', ['A claim supported by an observation', 'Only a guess', 'Only the name of the container'], 'A claim supported by an observation'],
            ],
            default => [],
        };
        $items = [];
        foreach ($questions as $index => [$prompt, $choices, $answer]) {
            $items[] = $this->item($lesson.'-'.($index + 46), $prompt, $choices, $answer, 'Observe the mixture and use visible evidence.');
        }
        return $items;
    }

    /** @param array<int, string> $choices
     *  @return array<string, mixed>
     */
    private function item(string $id, string $prompt, array $choices, string $answer, string $feedback): array
    {
        return compact('id', 'prompt', 'choices', 'answer', 'feedback') + ['kind' => 'classification'];
    }
}
