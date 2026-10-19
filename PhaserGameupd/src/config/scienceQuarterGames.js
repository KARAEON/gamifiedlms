// Grade 6, Science Q1. Each activity has its own interaction and three challenges.
export const SCIENCE_TOOLS = [
  { id: 'magnet', label: 'MAGNET', asset: 'magnet', technique: 'Magnetic separation' },
  { id: 'sieve', label: 'SIEVE', asset: 'sieve', technique: 'Sieving' },
  { id: 'filter', label: 'FILTER', asset: 'funnel', technique: 'Filtration' },
  { id: 'evaporate', label: 'EVAPORATE', asset: 'evaporating-dish', technique: 'Evaporation' },
  { id: 'decant', label: 'DECANT', asset: 'sand-and-water', technique: 'Decantation' },
];

const define = (kind, day, title, subtitle, brief, steps, tip, summary) => ({
  id: `science-${kind}`, kind, day, title, subtitle, brief, steps, tip, summary,
  lessonId: `q1-m${day < 11 ? 2 : day < 16 ? 3 : 4}-l${day < 11 ? day - 5 : day < 16 ? day - 10 : day - 15}`,
  competency: day < 11 ? 'S6MT-Id-f-2' : day < 16 ? 'S6MT-Ig-j-3' : 'S6MT-Ia-c-1',
  rounds: 3,
});

export const scienceQuarterGames = [
  define('magnet', 6, 'MAGNET SWEEP RESCUE', 'Recover iron from a mixed sample.',
    'Move the magnet near each iron piece. Recover the iron and leave nonmagnetic material behind.',
    [['1. INSPECT', 'Find the iron pieces among sand, wood, and copper.'], ['2. SWEEP', 'Drag the magnet, or tap a piece to move the magnet there.'], ['3. RECOVER', 'Release attracted iron into the tray. Check the remaining sample.']],
    'Iron is attracted to this magnet. Sand, wood, and copper are not. Not every metal is magnetic.', 'Move the magnet. Recover iron. Observe what stays behind.'),
  define('sieve', 7, 'SIEVE GATE', 'Separate materials by particle size.',
    'Adjust the mesh opening. Run a batch and inspect what passes through and what remains.',
    [['1. COMPARE SIZES', 'Inspect the small grains and larger stones.'], ['2. ADJUST MESH', 'Use the opening controls to choose a suitable size.'], ['3. RUN A BATCH', 'Check both outputs. Change the opening if both materials pass.']],
    'An opening must let the smaller grains pass while retaining the larger stones. The screen is an enlarged size model.', 'Choose an opening between the two particle sizes.'),
  define('filter', 8, 'FILTER FORGE', 'Build a working filtration apparatus.',
    'Place a receiving jar and filter funnel. Pour the sample, then identify where the desired material went.',
    [['1. BUILD', 'Click or drag each apparatus piece into its marked place.'], ['2. POUR', 'Run the sample through the filter paper.'], ['3. TRACE MATERIAL', 'Inspect the paper and liquid. Identify the requested output.']],
    'Paper filtration retains insoluble solids. Dissolved salt passes through with the water. Clear-looking water is not necessarily safe to drink.', 'Build the apparatus. Follow each material to its output.'),
  define('evaporate', 9, 'SALT CRYSTAL WATCH', 'Observe evaporation and recover salt.',
    'Record observations at the start, during evaporation, and at the end. Identify the recovered material.',
    [['1. RECORD START', 'Capture an observation before advancing simulated time.'], ['2. WATCH CHANGE', 'Advance time and capture a middle observation.'], ['3. IDENTIFY OUTPUT', 'Record the final solid, then identify what remains in the dish.']],
    'Water leaves as vapor. Salt remains in the dish. This process recovers salt; it does not collect drinking water.', 'Observe the start, middle, and end. Trace salt and water.'),
  define('decant', 10, 'STEADY POUR', 'Separate liquid above settled sediment.',
    'Let the sediment settle. Tilt gently and pour the upper liquid. Stop before sediment reaches the lip.',
    [['1. LET IT SETTLE', 'Wait until most sediment rests at the bottom.'], ['2. POUR GENTLY', 'Use the tilt controls and pour in small steps.'], ['3. STOP IN TIME', 'Leave some liquid above the sediment, then check the collected liquid.']],
    'Decantation is not perfect separation. Pouring too steeply or too far carries sediment along. The liquid is not automatically safe to drink.', 'Settle. Pour gently. Leave sediment and some liquid behind.'),
  define('schedule', 11, 'COMMUNITY SHIFT', 'Plan useful separation services.',
    'Select a request, then book a suitable station and start time. Serve every customer without overlapping jobs.',
    [['1. READ REQUESTS', 'Find the material each customer wants recovered.'], ['2. BOOK STATIONS', 'Select a request and place it into the timetable.'], ['3. SERVE COMMUNITY', 'Run the shift. Inspect the products and how people use them.']],
    'A suitable method must recover the requested product. Jobs cannot overlap at the same station, and all must finish within the shift.', 'Choose suitable methods and schedule every community request.'),
  define('circuit', 12, 'RECOVERY CIRCUIT', 'Connect processes and recover useful components.',
    'Choose a material stream and a separation tool, then press Apply Tool. Follow both outputs and process a mixed output again if needed.',
    [['1. SELECT STREAM', 'Begin with the input mixture or an available output.'], ['2. APPLY A METHOD', 'Choose a suitable tool, then press Apply Tool.'], ['3. RECOVER PRODUCTS', 'Trace each component until the requested materials are separated.']],
    'Track both outputs. For iron, sand, and water, magnetic separation and filtration can work in either order if you process the correct output next.', 'Choose a stream, apply a tool, and account for every component.'),
  define('impact', 13, 'VILLAGE IMPACT BOARD', 'Choose services that help the community.',
    'Inspect three locations. Install two suitable tools to recover the greatest useful amount within the budget.',
    [['1. INSPECT NEEDS', 'Read the mixture and potential recovery at each location.'], ['2. INSTALL TOOLS', 'Select a tool and a location. You have two service tokens.'], ['3. SEE THE BENEFIT', 'Compare useful material recovered with the material still unavailable.']],
    'Choose an intervention for the actual mixture. A magnet cannot remove stones from sand. Higher recovery means more material available for reuse.', 'Use two service tokens where suitable separation helps most.'),
  define('diagnose', 14, 'BROKEN SEPARATOR LAB', 'Investigate why separation failed.',
    'Inspect the failed baseline. Change one variable, run a test, and use the output to decide the next change.',
    [['1. INSPECT FAILURE', 'Study the original settings and unsuccessful output.'], ['2. CHANGE ONE THING', 'Adjust one variable so the test has an interpretable cause.'], ['3. TEST AND REPAIR', 'Run the test, compare outputs, and restore the useful product.']],
    'Change one variable per test. A smaller sieve opening, a suitable method, or sufficient settling can restore a failed process.', 'Change one variable. Test it. Explain the recovered benefit.'),
  define('report', 15, 'LUMI FIELD REPORT', 'Explain how separation helped a community.',
    'Capture a before, process, and after image. Write a caption explaining the recovered material and community benefit.',
    [['1. CAPTURE IMAGES', 'Select a report panel, then choose an appropriate scene below.'], ['2. WRITE A CAPTION', 'Explain the mixture, method, recovered material, and benefit in your words.'], ['3. SAVE YOUR REPORT', 'Check the sequence and save it. Download reports for teacher review.']],
    'A completed report is not an automatic mastery judgment. Your written explanation is saved for review; picture order and completeness are checked here.', 'Show the mixture, process, and outcome. Explain who benefits.'),
];

scienceQuarterGames.push(define('mystery', 16, 'MYSTERY SAMPLE TRAIL', 'Observe a sample. Follow the evidence.',
  'Inspect an enlarged portion, stir the sample, and let it rest or test a magnet. Use the evidence and preparation record to describe the mixture.',
  [['1. INSPECT A PORTION', 'Look closely. Record whether separate grains or materials are visible.'], ['2. TRY A TEST', 'Let water samples rest, or test the dry sample with a magnet.'], ['3. MAKE A CONCLUSION', 'Choose the materials and mixture type using your recorded evidence.']],
  'The preparation record tells you which materials were used. Appearance alone cannot identify an arbitrary unknown. Never taste workshop samples. Clear water may still contain dissolved salt.',
  'Observe first. Describe the mixture using evidence.'));

scienceQuarterGames.push({ ...define('kit', 17, 'RECOVERY KIT QUEST', 'Pack tools that match the recovery goal.',
  'Pack up to two equipment modules. Trial them in order, inspect the outputs, and choose the smallest kit that recovers every requested product.',
  [['1. READ THE GOAL', 'Look at the input sample and the products you need to recover.'], ['2. PACK YOUR KIT', 'Tap modules to pack or remove them. Swap two modules to change their order.'], ['3. TRIAL AND CHECK', 'Run a trial. Inspect the outputs, revise the kit if needed, then check the result.']],
  'Each module includes its supporting apparatus. A filter includes paper, a stand, and a receiving jar. Dissolved salt passes through filter paper with water; evaporation recovers salt, while water leaves as vapor.',
  'Choose a suitable kit for the products you need.'), competency: 'S6MT-Id-f-2' });

scienceQuarterGames.push({ ...define('relay', 18, 'SEPARATION RELAY', 'Carry the sample. Keep every useful output.',
  'Choose and operate a separation tool. Inspect both outputs, keep recovered solids in the rack, and carry a mixed output to the next bench.',
  [['1. CHOOSE AND OPERATE', 'Read the carried sample and choose a tool that separates its materials.'], ['2. KEEP BOTH OUTPUTS', 'Recovered solids stay in the rack. Liquid and vapor remain accounted for.'], ['3. CARRY THE MIXTURE', 'Select a mixed output and carry it onward. Recover all requested solids, then check.']],
  'Different scientifically workable orders are accepted. If filtration comes first, keep both the mixed solid residue and saltwater filtrate. A magnet can separate iron from the retained solids. Evaporation leaves water as vapor; it does not collect liquid water.',
  'Track what stays, what passes, and what needs another step.'), competency: 'S6MT-Id-f-2' });

scienceQuarterGames.push({ ...define('fair', 19, 'FAIR TEST ARENA', 'Compare methods using fair trials.',
  'Prepare equal starting samples, run both trials, and choose a method using evidence from the recorded outputs.',
  [['1. SPLIT EQUALLY', 'Give both trials the same starting amounts. Keep the listed conditions equal.'], ['2. RUN BOTH TRIALS', 'Observe each apparatus and compare the collected or retained materials.'], ['3. CHOOSE WITH EVIDENCE', 'Select the method that best meets the goal and evidence supporting your choice.']],
  'These are authored trials, not a claim that one method always wins. Both sand-water trials collect the same liquid amount after equal settling time. Clear liquid is not automatically safe to drink. Evaporation leaves salt and releases water as vapor.',
  'Keep inputs comparable. Choose using observed results.'), competency: 'S6MT-Id-f-2' });

scienceQuarterGames.push({ ...define('revival', 20, 'VULCAN WORKSHOP REVIVAL', 'Investigate. Recover. Restore one workshop.',
  'Observe each sample, separate the useful materials, and apply them to three linked workshop repairs. Write why each recovery helps.',
  [['1. OBSERVE', 'Inspect the prepared sample and record its visible components.'], ['2. SEPARATE', 'Choose an output and tool. Keep both outputs and separate mixtures again as needed.'], ['3. USE MATERIAL', 'Apply the recovered materials, then write an explanation and save the repair.']],
  'Filter paper retains insoluble sand, but dissolved salt passes with water. Evaporation leaves dry salt and releases water as vapor. Your explanation is saved for teacher review; completion is not an automatic mastery judgment.',
  'Use recovered materials to complete a real workshop repair.'), competency: 'S6MT-Id-f-2', competencies: ['S6MT-Ia-c-1', 'S6MT-Id-f-2', 'S6MT-Ig-j-3'] });

export const getScienceGame = lessonId => scienceQuarterGames.find(game => game.lessonId === lessonId);

export const SERVICE_ROUNDS = [
  [
    { id: 'repair', label: 'REPAIR YARD', mixture: 'Iron + sand', product: 'Iron', tool: 'magnet', duration: 1, amount: 8, benefit: 'Recovered iron can be reused for repairs.' },
    { id: 'builder', label: 'BUILDING YARD', mixture: 'Sand + stones', product: 'Sand', tool: 'sieve', duration: 2, amount: 6, benefit: 'Usable sand is recovered for building.' },
    { id: 'saltmaker', label: 'SALT MAKER', mixture: 'Salt + water', product: 'Salt', tool: 'evaporate', duration: 3, amount: 2, benefit: 'Salt is recovered as a useful product.' },
  ],
  [
    { id: 'potter', label: 'POTTERY STUDIO', mixture: 'Clay + water', product: 'Clay', tool: 'filter', duration: 2, amount: 9, benefit: 'Insoluble clay is recovered for pottery.' },
    { id: 'builder', label: 'BUILDING YARD', mixture: 'Gravel + fine sand', product: 'Fine sand', tool: 'sieve', duration: 2, amount: 5, benefit: 'Fine sand becomes available for reuse.' },
    { id: 'repair', label: 'REPAIR YARD', mixture: 'Iron + wood chips', product: 'Iron', tool: 'magnet', duration: 1, amount: 3, benefit: 'Iron pieces can be used again instead of discarded.' },
  ],
  [
    { id: 'settling', label: 'SETTLING STATION', mixture: 'Settled sand + water', product: 'Upper liquid', tool: 'decant', duration: 2, amount: 7, benefit: 'Much of the liquid is removed while settled sand stays behind.' },
    { id: 'saltmaker', label: 'SALT MAKER', mixture: 'Salt + water', product: 'Salt', tool: 'evaporate', duration: 3, amount: 6, benefit: 'Recovering salt makes a useful product available.' },
    { id: 'repair', label: 'REPAIR YARD', mixture: 'Iron + sand', product: 'Iron', tool: 'magnet', duration: 1, amount: 2, benefit: 'Recovering iron reduces discarded reusable material.' },
  ],
];

export const REPORT_CAPTION_LIMIT = 180;
export const REPORT_CASES = [
  { title: 'SAND FOR BUILDING', input: 'Sand + stones', tool: 'sieve', output: 'Usable sand', benefit: 'The building yard can reuse the recovered sand.', inputAsset: 'sand-mound', outputAsset: 'sand-mound' },
  { title: 'IRON FOR REPAIRS', input: 'Iron + sand', tool: 'magnet', output: 'Recovered iron', benefit: 'The repair yard can reuse the iron.', inputAsset: 'sand-mound', outputAsset: 'magnet' },
  { title: 'SALT FOR THE COMMUNITY', input: 'Saltwater', tool: 'evaporate', output: 'Recovered salt', benefit: 'The salt maker gets a useful product from saltwater.', inputAsset: 'saltwater', outputAsset: 'salt' },
];
