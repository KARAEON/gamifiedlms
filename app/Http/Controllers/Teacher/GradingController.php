<?php

namespace App\Http\Controllers\Teacher;

use App\Http\Controllers\Controller;
use App\Models\GradeEntry;
use App\Models\GradeExportTemplate;
use App\Models\Section;
use App\Models\User;
use App\Models\SchoolSetting;
use App\Services\GradeComputationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\View\View;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class GradingController extends Controller
{
    /** @var array<string, string> */
    public const EXPORT_COLUMNS = [
        'student' => 'Student',
        'ww_total' => 'Written Works Score',
        'ww_hps' => 'Written Works HPS',
        'ww_ps' => 'Written Works PS (%)',
        'pt_1' => 'Performance Task 1', 'pt_2' => 'Performance Task 2',
        'pt_3' => 'Performance Task 3', 'pt_4' => 'Performance Task 4',
        'pt_5' => 'Performance Task 5', 'pt_6' => 'Performance Task 6',
        'pt_7' => 'Performance Task 7', 'pt_8' => 'Performance Task 8',
        'pt_9' => 'Performance Task 9', 'pt_10' => 'Performance Task 10',
        'pt_1_hps' => 'Performance Task 1 HPS', 'pt_2_hps' => 'Performance Task 2 HPS',
        'pt_3_hps' => 'Performance Task 3 HPS', 'pt_4_hps' => 'Performance Task 4 HPS',
        'pt_5_hps' => 'Performance Task 5 HPS', 'pt_6_hps' => 'Performance Task 6 HPS',
        'pt_7_hps' => 'Performance Task 7 HPS', 'pt_8_hps' => 'Performance Task 8 HPS',
        'pt_9_hps' => 'Performance Task 9 HPS', 'pt_10_hps' => 'Performance Task 10 HPS',
        'pt_total' => 'Performance Tasks Total',
        'pt_hps' => 'Performance Tasks HPS',
        'pt_ps' => 'Performance Tasks PS (%)',
        'pt_ws' => 'Performance Tasks WS',
        'qa_score' => 'Quarterly Assessment Score',
        'qa_hps' => 'Quarterly Assessment HPS',
        'quarterly_grade' => 'Quarterly Grade',
        'q1' => 'Quarter 1 Grade', 'q2' => 'Quarter 2 Grade',
        'q3' => 'Quarter 3 Grade', 'q4' => 'Quarter 4 Grade',
        'final_grade' => 'Final Grade', 'remark' => 'Remark',
    ];

    public function index(Request $request, GradeComputationService $gradeComputationService): View
    {
        $teacher = $request->user();
        $allowedSectionIds = $teacher->handledSections()->pluck('sections.id');

        $sections = Section::query()
            ->when($allowedSectionIds->isNotEmpty(), fn ($builder) => $builder->whereIn('id', $allowedSectionIds))
            ->orderBy('name')
            ->get(['id', 'name']);

        $subject = (string) $request->query('subject', 'English');
        $quarter = (int) $request->query('quarter', SchoolSetting::currentQuarter());
        $sectionId = (int) $request->query('section_id', ($sections->first()->id ?? 0));

        $students = User::query()
            ->where('role', \App\Enums\UserRole::STUDENT)
            ->whereHas('studentProfile', fn ($builder) => $builder->where('section_id', $sectionId))
            ->orderBy('name')
            ->get(['id', 'name']);

        $existingEntries = Schema::hasTable('grade_entries')
            ? GradeEntry::query()
                ->where('section_id', $sectionId)
                ->where('subject', $subject)
                ->where('quarter', $quarter)
                ->get()
                ->keyBy('student_id')
            : collect();

        $gradeRows = $students->map(function (User $student) use ($gradeComputationService, $subject, $quarter, $existingEntries): array {
            return [
                'student' => $student,
                'entry' => $existingEntries->get($student->id),
                'computed' => $gradeComputationService->computeForStudentSubjectQuarter($student, $subject, $quarter),
            ];
        });

        return view('teacher.grading.index', [
            'sections' => $sections,
            'subjects' => $gradeComputationService->supportedSubjects(),
            'selectedSectionId' => $sectionId,
            'selectedSubject' => $subject,
            'selectedQuarter' => $quarter,
            'gradeRows' => $gradeRows,
            'exportTemplates' => GradeExportTemplate::query()->where('teacher_id', $teacher->id)
                ->where(fn ($query) => $query->whereNotNull('file_data')->orWhereNotNull('file_path'))
                ->orderBy('name')->get(['id', 'name']),
        ]);
    }

    public function export(Request $request, GradeComputationService $gradeComputationService): BinaryFileResponse
    {
        $validated = $request->validate([
            'section_id' => ['required', 'integer', Rule::exists('sections', 'id')],
            'subject' => ['required', Rule::in($gradeComputationService->supportedSubjects())],
            'quarter' => ['required', 'integer', 'between:1,4'],
            'template_id' => ['nullable', 'integer', Rule::exists('grade_export_templates', 'id')],
            'filename' => ['nullable', 'string', 'max:80'],
        ]);

        $teacher = $request->user();
        $sectionId = (int) $validated['section_id'];
        $allowedSectionIds = $teacher->handledSections()->pluck('sections.id');
        $section = Section::query()
            ->when($allowedSectionIds->isNotEmpty(), fn ($builder) => $builder->whereIn('id', $allowedSectionIds))
            ->findOrFail($sectionId);
        $subject = (string) $validated['subject'];
        $quarter = (int) $validated['quarter'];
        $template = isset($validated['template_id'])
            ? GradeExportTemplate::query()->where('teacher_id', $teacher->id)->findOrFail($validated['template_id'])
            : null;
        $columnSettings = $template?->columns ?? array_map(
            fn (string $key, string $label) => ['key' => $key, 'label' => $label],
            array_keys(self::EXPORT_COLUMNS), self::EXPORT_COLUMNS
        );
        $columns = array_column($columnSettings, 'key');
        $students = User::query()
            ->where('role', \App\Enums\UserRole::STUDENT)
            ->whereHas('studentProfile', fn ($builder) => $builder->where('section_id', $sectionId))
            ->orderBy('name')
            ->get(['id', 'name']);

        $rows = [array_column($columnSettings, 'label')];
        $classRecords = [];
        foreach ($students as $student) {
            $grade = $gradeComputationService->computeForStudentSubjectQuarter($student, $subject, $quarter);
            $classRecords[] = ['name' => $student->name, 'grade' => $grade];
            $values = [
                'student' => $student->name,
                'ww_total' => $grade['written_works']['total'],
                'ww_hps' => $grade['written_works']['hps_total'],
                'ww_ps' => $grade['written_works']['percentage_score'],
                'pt_total' => $grade['performance_tasks']['total'],
                'pt_hps' => $grade['performance_tasks']['hps_total'],
                'pt_ps' => $grade['performance_tasks']['percentage_score'],
                'pt_ws' => $grade['performance_tasks']['weighted_score'],
                'qa_score' => $grade['quarterly_assessment']['score'],
                'qa_hps' => $grade['quarterly_assessment']['hps'],
                'quarterly_grade' => $grade['quarterly_grade'],
                'q1' => $grade['yearly_summary']['q1'],
                'q2' => $grade['yearly_summary']['q2'],
                'q3' => $grade['yearly_summary']['q3'],
                'q4' => $grade['yearly_summary']['q4'],
                'final_grade' => $grade['yearly_summary']['final_grade'],
                'remark' => $grade['yearly_summary']['remark'],
            ];
            foreach (range(1, 10) as $item) {
                $values['pt_'.$item] = $grade['performance_task_items'][$item - 1] ?? null;
                $values['pt_'.$item.'_hps'] = $grade['performance_task_hps_items'][$item - 1] ?? null;
            }
            $rows[] = array_map(fn (string $key) => $values[$key], $columns);
        }

        $safeBase = Str::slug($validated['filename'] ?? "{$section->name}-{$subject}-q{$quarter}-grades") ?: 'student-grades';
        $path = tempnam(storage_path('framework/cache'), 'grades-');
        $source = resource_path('templates/class-record.xlsx');
        $temporarySource = false;
        if ($template?->file_data !== null) {
            $source = tempnam(storage_path('framework/cache'), 'template-');
            $temporarySource = true;
            if ($source !== false) {
                file_put_contents($source, base64_decode($template->file_data, true));
            }
        } elseif ($template?->file_path) {
            $source = Storage::disk('local')->path($template->file_path);
        }
        $created = $path !== false && $source && $this->fillUploadedWorkbook($source, $path, $rows,
            $classRecords, $section->name, $teacher->name, $subject, $quarter);
        if ($temporarySource && $source) {
            unlink($source);
        }
        if (! $created) {
            throw new \RuntimeException('Unable to create the Excel grade export.');
        }

        return response()->download($path, $safeBase.'.xlsx', [
            'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        ])->deleteFileAfterSend(true);
    }

    /** @param array<int, array<int, mixed>> $rows */
    private function fillUploadedWorkbook(string $source, string $path, array $rows, array $classRecords = [],
        string $section = '', string $teacher = '', string $subject = '', int $quarter = 1): bool
    {
        if (! is_file($source) || ! copy($source, $path)) {
            return false;
        }
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            return false;
        }

        $workbook = new \DOMDocument();
        $relationships = new \DOMDocument();
        $types = new \DOMDocument();
        if (! $workbook->loadXML((string) $zip->getFromName('xl/workbook.xml'))
            || ! $relationships->loadXML((string) $zip->getFromName('xl/_rels/workbook.xml.rels'))
            || ! $types->loadXML((string) $zip->getFromName('[Content_Types].xml'))) {
            $zip->close();

            return false;
        }

        $mainNs = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        $relNs = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
        $packageRelNs = 'http://schemas.openxmlformats.org/package/2006/relationships';
        $contentNs = 'http://schemas.openxmlformats.org/package/2006/content-types';
        $calculationRelationships = [];
        foreach ($relationships->getElementsByTagNameNS($packageRelNs, 'Relationship') as $item) {
            if (str_ends_with($item->getAttribute('Type'), '/calcChain')) {
                $calculationRelationships[] = $item;
            }
        }
        foreach ($calculationRelationships as $item) {
            $item->parentNode->removeChild($item);
        }
        $calculationTypes = [];
        foreach ($types->getElementsByTagNameNS($contentNs, 'Override') as $item) {
            if ($item->getAttribute('PartName') === '/xl/calcChain.xml') {
                $calculationTypes[] = $item;
            }
        }
        foreach ($calculationTypes as $item) {
            $item->parentNode->removeChild($item);
        }
        $zip->deleteName('xl/calcChain.xml');
        $calculation = $workbook->getElementsByTagNameNS($mainNs, 'calcPr')->item(0);
        if ($calculation) {
            $calculation->setAttribute('calcMode', 'auto');
            $calculation->setAttribute('fullCalcOnLoad', '1');
            $calculation->setAttribute('forceFullCalc', '1');
        }
        $sheets = $workbook->getElementsByTagNameNS($mainNs, 'sheets')->item(0);
        if (! $sheets) {
            $zip->close();

            return false;
        }
        $existingNames = [];
        $maxSheetId = 0;
        foreach ($sheets->getElementsByTagNameNS($mainNs, 'sheet') as $sheet) {
            $existingNames[] = $sheet->getAttribute('name');
            $maxSheetId = max($maxSheetId, (int) $sheet->getAttribute('sheetId'));
        }
        if (($existingNames[0] ?? null) === 'INPUT DATA'
            && str_ends_with($existingNames[1] ?? '', '_Q1')
            && ($existingNames[5] ?? null) === 'SUMMARY OF QUARTERLY GRADES') {
            if (count($classRecords) > 100) {
                $zip->close();
                throw \Illuminate\Validation\ValidationException::withMessages([
                    'template_id' => 'This class-record template has room for 100 learners. Use a larger template for this section.',
                ]);
            }
            $this->fillClassRecordSheets($zip, $classRecords, $section, $teacher, $subject, $quarter);
            foreach ($workbook->getElementsByTagNameNS($mainNs, 'workbookView') as $view) {
                $view->setAttribute('activeTab', (string) $quarter);
            }
            foreach ($sheets->getElementsByTagNameNS($mainNs, 'sheet') as $index => $classSheet) {
                if ($index >= 1 && $index <= 4) {
                    $classSheet->setAttribute('name', strtoupper($subject).'_Q'.$index);
                }
            }
        }
        $sheetName = 'GLMS Grades';
        for ($number = 2; in_array($sheetName, $existingNames, true); $number++) {
            $sheetName = 'GLMS Grades '.$number;
        }
        $maxRelId = 0;
        $maxSheetFile = 0;
        foreach ($relationships->getElementsByTagNameNS($packageRelNs, 'Relationship') as $relationship) {
            if (preg_match('/^rId(\d+)$/', $relationship->getAttribute('Id'), $match)) {
                $maxRelId = max($maxRelId, (int) $match[1]);
            }
            if (preg_match('/sheet(\d+)\.xml$/', $relationship->getAttribute('Target'), $match)) {
                $maxSheetFile = max($maxSheetFile, (int) $match[1]);
            }
        }
        $id = 'rId'.($maxRelId + 1);
        $file = 'sheet'.($maxSheetFile + 1).'.xml';
        $sheet = $workbook->createElementNS($mainNs, 'sheet');
        $sheet->setAttribute('name', $sheetName);
        $sheet->setAttribute('sheetId', (string) ($maxSheetId + 1));
        $sheet->setAttributeNS($relNs, 'r:id', $id);
        $sheets->appendChild($sheet);
        $relationship = $relationships->createElementNS($packageRelNs, 'Relationship');
        $relationship->setAttribute('Id', $id);
        $relationship->setAttribute('Type', $relNs.'/worksheet');
        $relationship->setAttribute('Target', 'worksheets/'.$file);
        $relationships->documentElement->appendChild($relationship);
        $override = $types->createElementNS($contentNs, 'Override');
        $override->setAttribute('PartName', '/xl/worksheets/'.$file);
        $override->setAttribute('ContentType', 'application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml');
        $types->documentElement->appendChild($override);

        $sheetRows = '';
        foreach ($rows as $rowIndex => $row) {
            $cells = '';
            foreach ($row as $columnIndex => $value) {
                $cell = $this->columnName($columnIndex + 1).($rowIndex + 1);
                if ($rowIndex > 0 && is_numeric($value) && $value !== '') {
                    $cells .= '<c r="'.$cell.'"><v>'.htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</v></c>';
                } else {
                    $cells .= '<c r="'.$cell.'" t="inlineStr"><is><t xml:space="preserve">'
                        .htmlspecialchars((string) ($value ?? ''), ENT_XML1 | ENT_QUOTES, 'UTF-8')
                        .'</t></is></c>';
                }
            }
            $sheetRows .= '<row r="'.($rowIndex + 1).'">'.$cells.'</row>';
        }
        $zip->addFromString('xl/workbook.xml', $workbook->saveXML());
        $zip->addFromString('xl/_rels/workbook.xml.rels', $relationships->saveXML());
        $zip->addFromString('[Content_Types].xml', $types->saveXML());
        $zip->addFromString('xl/worksheets/'.$file,
            '<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="'.$mainNs.'"><sheetData>'.$sheetRows.'</sheetData></worksheet>');

        $this->removeWorksheetProtection($zip, $mainNs);

        return $zip->close();
    }

    private function removeWorksheetProtection(\ZipArchive $zip, string $namespace): void
    {
        for ($index = 0; $index < $zip->numFiles; $index++) {
            $name = $zip->getNameIndex($index);
            if (! is_string($name) || ! preg_match('~^xl/worksheets/[^/]+\.xml$~', $name)) {
                continue;
            }

            $xml = $zip->getFromIndex($index);
            if (! is_string($xml) || ! str_contains($xml, 'sheetProtection')) {
                continue;
            }

            $document = new \DOMDocument();
            if (! $document->loadXML($xml)) {
                continue;
            }
            $this->removeSheetProtection($document, $namespace);
            $zip->addFromString($name, $document->saveXML());
        }
    }

    private function removeSheetProtection(\DOMDocument $document, string $namespace): void
    {
        foreach (iterator_to_array($document->getElementsByTagNameNS($namespace, 'sheetProtection')) as $protection) {
            $protection->parentNode->removeChild($protection);
        }
    }

    /** @param array<int, array{name: string, grade: array<string, mixed>}> $records */
    private function fillClassRecordSheets(\ZipArchive $zip, array $records, string $section, string $teacher,
        string $subject, int $selectedQuarter): void
    {
        $namespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        $wwWeight = $subject === 'Mathematics' ? 0.20 : 0.40;
        $ptWeight = $subject === 'Mathematics' ? 0.60 : 0.40;

        for ($sheetNumber = 1; $sheetNumber <= 6; $sheetNumber++) {
            $path = 'xl/worksheets/sheet'.$sheetNumber.'.xml';
            $xml = $zip->getFromName($path);
            if ($xml === false) {
                continue;
            }
            $document = new \DOMDocument();
            if (! $document->loadXML($xml)) {
                continue;
            }
            $this->removeSheetProtection($document, $namespace);
            $sharedMasters = [];
            foreach ($document->getElementsByTagNameNS($namespace, 'f') as $formula) {
                if ($formula->getAttribute('t') === 'shared' && trim($formula->textContent) !== '') {
                    $sharedMasters[$formula->getAttribute('si')] = [
                        'formula' => $formula->textContent,
                        'row' => (int) preg_replace('/^[A-Z]+/', '', $formula->parentNode->getAttribute('r')),
                    ];
                }
            }
            $cells = [];
            $rows = [];
            foreach ($document->getElementsByTagNameNS($namespace, 'row') as $rowNode) {
                $rows[(int) $rowNode->getAttribute('r')] = $rowNode;
                foreach ($rowNode->getElementsByTagNameNS($namespace, 'c') as $cellNode) {
                    $cells[$cellNode->getAttribute('r')] = $cellNode;
                }
            }
            $put = function (string $address, mixed $value) use ($document, $namespace, &$cells, &$rows): void {
                $rowNumber = (int) preg_replace('/^[A-Z]+/', '', $address);
                if (! isset($rows[$rowNumber])) {
                    return;
                }
                $cell = $cells[$address] ?? null;
                if (! $cell) {
                    $cell = $document->createElementNS($namespace, 'c');
                    $cell->setAttribute('r', $address);
                    $rows[$rowNumber]->appendChild($cell);
                    $cells[$address] = $cell;
                }
                while ($cell->firstChild) {
                    $cell->removeChild($cell->firstChild);
                }
                if ($value === null || $value === '') {
                    $cell->setAttribute('t', 'inlineStr');
                    $cell->appendChild($document->createElementNS($namespace, 'is'));
                } elseif (is_int($value) || is_float($value)) {
                    $cell->removeAttribute('t');
                    $cell->appendChild($document->createElementNS($namespace, 'v', (string) $value));
                } else {
                    $cell->setAttribute('t', 'inlineStr');
                    $inline = $document->createElementNS($namespace, 'is');
                    $text = $document->createElementNS($namespace, 't');
                    $text->appendChild($document->createTextNode((string) $value));
                    $inline->appendChild($text);
                    $cell->appendChild($inline);
                }
            };

            if ($sheetNumber === 1) {
                $put('K7', $section);
                $put('S7', $teacher);
                $put('AG7', $subject);
                $put('B11', 'CLASS LIST (1–50)');
                $put('B62', 'CLASS LIST (51–100)');
            } elseif ($sheetNumber <= 5) {
                $put('K7', $section);
                $put('S7', $teacher);
                $put('AG7', $subject);
                $put('F8', 'WRITTEN WORKS ('.round($wwWeight * 100).'%)');
                $put('S8', 'PERFORMANCE TASKS ('.round($ptWeight * 100).'%)');
                $put('R10', $wwWeight);
                $put('AE10', $ptWeight);
                $put('B11', 'CLASS LIST (1–50)');
                $put('B62', 'CLASS LIST (51–100)');
            } else {
                $put('K8', $section);
                $put('K9', $teacher);
                $put('W9', $subject);
                foreach (['F10', 'J10', 'N10', 'R10'] as $address) {
                    $put($address, strtoupper($subject));
                }
                $put('B12', 'CLASS LIST (1–50)');
                $put('B63', 'CLASS LIST (51–100)');
            }

            if ($sheetNumber === $selectedQuarter + 1) {
                $put('F10', collect($records)->max('grade.written_works.hps_total') ?: null);
                foreach (range(0, 9) as $item) {
                    $put($this->columnName(19 + $item).'10',
                        collect($records)->max('grade.performance_task_hps_items.'.$item) ?: null);
                }
                $put('AF10', collect($records)->max('grade.quarterly_assessment.hps') ?: null);
            }
            foreach ($document->getElementsByTagNameNS($namespace, 'sheetView') as $view) {
                $view->setAttribute('topLeftCell', 'A1');
                $view->setAttribute('tabSelected', $sheetNumber === $selectedQuarter + 1 ? '1' : '0');
                foreach ($view->getElementsByTagNameNS($namespace, 'selection') as $selection) {
                    $selection->setAttribute('activeCell', 'A1');
                    $selection->setAttribute('sqref', 'A1');
                }
            }

            for ($index = 0; $index < 100; $index++) {
                $record = $records[$index] ?? null;
                $row = $index < 50 ? 12 + $index : 63 + $index - 50;
                $summaryRow = $row + 1;
                if ($sheetNumber === 1) {
                    $put('B'.$row, $record['name'] ?? null);
                    continue;
                }
                if ($sheetNumber <= 5) {
                    $put('B'.$row, $record['name'] ?? null);
                    $quarter = $sheetNumber - 1;
                    $grade = $record['grade'] ?? null;
                    $put('AJ'.$row, $grade['yearly_summary']['q'.$quarter] ?? null);
                    if ($quarter === $selectedQuarter) {
                        $put('F'.$row, ($grade['written_works']['hps_total'] ?? null) ? $grade['written_works']['total'] : null);
                        $put('P'.$row, ($grade['written_works']['hps_total'] ?? null) ? $grade['written_works']['total'] : null);
                        $put('Q'.$row, $grade['written_works']['percentage_score'] ?? null);
                        $put('R'.$row, $grade['written_works']['weighted_score'] ?? null);
                        $put('AC'.$row, $grade['performance_tasks']['total'] ?? null);
                        $put('AD'.$row, $grade['performance_tasks']['percentage_score'] ?? null);
                        $put('AE'.$row, $grade['performance_tasks']['weighted_score'] ?? null);
                        $put('AF'.$row, $grade['quarterly_assessment']['score'] ?? null);
                        $put('AG'.$row, $grade['quarterly_assessment']['percentage_score'] ?? null);
                        $put('AH'.$row, $grade['quarterly_assessment']['weighted_score'] ?? null);
                        $put('AI'.$row, $grade['initial_grade'] ?? null);
                        foreach (range(0, 9) as $item) {
                            $put($this->columnName(19 + $item).$row, $grade['performance_task_items'][$item] ?? null);
                        }
                    }
                    continue;
                }
                $put('B'.$summaryRow, $record['name'] ?? null);
                $grade = $record['grade'] ?? null;
                foreach ([1 => 'F', 2 => 'J', 3 => 'N', 4 => 'R'] as $quarter => $column) {
                    $put($column.$summaryRow, $grade['yearly_summary']['q'.$quarter] ?? null);
                }
                $put('V'.$summaryRow, $grade['yearly_summary']['final_grade'] ?? null);
                $put('Z'.$summaryRow, $grade['yearly_summary']['remark'] ?? null);
            }
            foreach (iterator_to_array($document->getElementsByTagNameNS($namespace, 'f')) as $formula) {
                if ($formula->getAttribute('t') !== 'shared') {
                    continue;
                }
                $master = $sharedMasters[$formula->getAttribute('si')] ?? null;
                if (! $master) {
                    $formula->parentNode->removeChild($formula);
                    continue;
                }
                $targetRow = (int) preg_replace('/^[A-Z]+/', '', $formula->parentNode->getAttribute('r'));
                $offset = $targetRow - $master['row'];
                $expanded = preg_replace_callback('/(\$?[A-Z]{1,3})(\$?)(\d+)/',
                    fn (array $match) => $match[1].$match[2].($match[2] === '$' ? $match[3] : (int) $match[3] + $offset),
                    $master['formula']);
                $formula->removeAttribute('t');
                $formula->removeAttribute('si');
                $formula->removeAttribute('ref');
                $formula->nodeValue = $expanded;
            }
            $zip->addFromString($path, $document->saveXML());
        }
    }

    /** @param array<int, array<int, mixed>> $rows */
    private function writeXlsx(string $path, array $rows, ?GradeExportTemplate $template, string $section, string $subject, int $quarter): bool
    {
        $zip = new \ZipArchive();
        if ($zip->open($path, \ZipArchive::OVERWRITE) !== true) {
            return false;
        }

        $heading = htmlspecialchars($template?->heading ?? 'Student Gradebook', ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $scope = htmlspecialchars("{$section} | {$subject} | Quarter {$quarter}", ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $sheetRows = '<row r="1"><c r="A1" s="2" t="inlineStr"><is><t>'.$heading.'</t></is></c></row>'
            .'<row r="2"><c r="A2" t="inlineStr"><is><t>'.$scope.'</t></is></c></row>';
        foreach ($rows as $rowIndex => $row) {
            $cells = '';
            foreach ($row as $columnIndex => $value) {
                $cell = $this->columnName($columnIndex + 1).($rowIndex + 4);
                if ($rowIndex > 0 && is_numeric($value) && $value !== '') {
                    $cells .= '<c r="'.$cell.'"><v>'.htmlspecialchars((string) $value, ENT_XML1 | ENT_QUOTES, 'UTF-8').'</v></c>';
                } else {
                    $text = htmlspecialchars((string) ($value ?? ''), ENT_XML1 | ENT_QUOTES, 'UTF-8');
                    $style = $rowIndex === 0 ? ' s="1"' : '';
                    $cells .= '<c r="'.$cell.'"'.$style.' t="inlineStr"><is><t xml:space="preserve">'.$text.'</t></is></c>';
                }
            }
            $sheetRows .= '<row r="'.($rowIndex + 4).'">'.$cells.'</row>';
        }

        $sheetName = htmlspecialchars($template?->sheet_name ?? 'Student Grades', ENT_XML1 | ENT_QUOTES, 'UTF-8');
        $accent = strtoupper(ltrim($template?->accent_color ?? '#1E40AF', '#'));
        $lastColumn = $this->columnName(count($rows[0]));

        $files = [
            '[Content_Types].xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>',
            '_rels/.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
            'xl/workbook.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="'.$sheetName.'" sheetId="1" r:id="rId1"/></sheets></workbook>',
            'xl/_rels/workbook.xml.rels' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>',
            'xl/worksheets/sheet1.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="4" topLeftCell="A5" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><sheetData>'.$sheetRows.'</sheetData><mergeCells count="1"><mergeCell ref="A1:'.$lastColumn.'1"/></mergeCells><autoFilter ref="A4:'.$lastColumn.(count($rows) + 3).'"/></worksheet>',
            'xl/styles.xml' => '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Aptos"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Aptos"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF'.$accent.'"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs></styleSheet>',
        ];
        foreach ($files as $name => $content) {
            $zip->addFromString($name, $content);
        }

        return $zip->close();
    }

    private function columnName(int $number): string
    {
        $name = '';
        while ($number > 0) {
            $number--;
            $name = chr(65 + ($number % 26)).$name;
            $number = intdiv($number, 26);
        }

        return $name;
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'student_id' => ['required', 'integer', Rule::exists('users', 'id')],
            'section_id' => ['required', 'integer', Rule::exists('sections', 'id')],
            'subject' => ['required', Rule::in(['English', 'Mathematics', 'Science'])],
            'quarter' => ['required', 'integer', 'between:1,4'],
            'performance_task_items' => ['nullable', 'array'],
            'performance_task_items.*' => ['nullable', 'numeric', 'min:0'],
            'performance_task_hps_items' => ['nullable', 'array'],
            'performance_task_hps_items.*' => ['nullable', 'numeric', 'min:0'],
            'performance_task_score' => ['nullable', 'numeric', 'min:0'],
            'performance_task_hps' => ['nullable', 'numeric', 'min:0'],
            'quarterly_assessment_score' => ['nullable', 'numeric', 'min:0'],
            'quarterly_assessment_hps' => ['nullable', 'numeric', 'min:0'],
        ]);

        $ptItems = collect($validated['performance_task_items'] ?? [])->take(10)->pad(10, null)->values()->all();
        $ptHpsItems = collect($validated['performance_task_hps_items'] ?? [])->take(10)->pad(10, null)->values()->all();
        $ptTotal = collect($ptItems)->filter(fn ($value) => $value !== null && $value !== '')->sum();
        $ptHpsTotal = collect($ptHpsItems)->filter(fn ($value) => $value !== null && $value !== '')->sum();

        GradeEntry::query()->updateOrCreate(
            [
                'student_id' => $validated['student_id'],
                'section_id' => $validated['section_id'],
                'subject' => $validated['subject'],
                'quarter' => $validated['quarter'],
            ],
            [
                'performance_task_items' => $ptItems,
                'performance_task_hps_items' => $ptHpsItems,
                'performance_task_score' => $ptTotal > 0 ? $ptTotal : ($validated['performance_task_score'] ?? null),
                'performance_task_hps' => $ptHpsTotal > 0 ? $ptHpsTotal : ($validated['performance_task_hps'] ?? null),
                'quarterly_assessment_score' => $validated['quarterly_assessment_score'] ?? null,
                'quarterly_assessment_hps' => $validated['quarterly_assessment_hps'] ?? null,
                'updated_by' => $request->user()->id,
            ]
        );

        return redirect()->route('teacher.grading.index', [
            'section_id' => $validated['section_id'],
            'subject' => $validated['subject'],
            'quarter' => $validated['quarter'],
        ])->with('status', 'Grading inputs saved successfully.');
    }
}
