// Original, authored Grade 6 Q1 Week 1 items. Sound keys describe the supplied
// en-US recording; word spellings are never used to infer a literary device.
export const ENGLISH_SOUND_BANK = {
  s: { label: 'S · as in sail', speech: 'Sail. Silver. Seven.' },
  k: { label: 'K · as in cat', speech: 'Cat. Kite. Carry.' },
  b: { label: 'B · as in bird', speech: 'Bird. Bright. Berry.' },
  ay: { label: 'AY · as in day', speech: 'Day. Rain. Lake.' },
  oo: { label: 'OO · as in moon', speech: 'Moon. Blue. Room.' },
  oh: { label: 'OH · as in boat', speech: 'Boat. Slow. Home.' },
  t: { label: 'T · as in net', speech: 'Net. Boat. Hit.' },
  m: { label: 'M · as in room', speech: 'Room. Beam.' },
  p: { label: 'P · as in cap', speech: 'Cap. Rope.' },
};

export const ENGLISH_DEVICES = ['Onomatopoeia', 'Alliteration', 'Assonance', 'Consonance'];
export const cleanEnglishWord = value => value.toLowerCase().replace(/[^a-z']/g, '');
export const englishWords = line => line.split(/\s+/).filter(Boolean).map((label, index) => ({ id: `w${index}`, label, word: cleanEnglishWord(label) }));
const reason = (id, text) => ({ id, text });
const task = (id, line, targetWords, options = {}) => {
  const words = englishWords(line);
  const targets = words.filter(word => targetWords.includes(word.word)).map(word => word.id);
  return {
    id, line, words, targets, acceptedTargets: [targets],
    kind: 'evidence', prompt: 'Choose the words that support your answer.',
    reasonId: 'sound', reasons: [reason('sound', 'The repeated sounds create the pattern.'), reason('letters', 'Every matching letter always makes the same sound.'), reason('length', 'The words have the same number of letters.')],
    explanation: 'Listen again and use the sounds as evidence.', ...options,
  };
};
const event = (id, label, word) => ({ id, label, word });

const soundscape = [
  task('e1-r1', 'Buzz! A bee circles the bloom.', ['buzz'], {
    kind: 'timeline', prompt: 'Find the sound word. Place it beside the event it imitates.',
    events: [event('bee', 'Bee flying', 'buzz')],
    reasons: [reason('sound', 'Buzz imitates the sound of the flying bee.'), reason('source', 'Bee is the name of the sound word.'), reason('letters', 'Every word beginning with B imitates a sound.')],
    explanation: 'Buzz imitates a sound. Bee names the animal making it.',
  }),
  task('e1-r2', 'Under the roof we hear drip, drop.', ['drip', 'drop'], {
    kind: 'timeline', prompt: 'Find both sound words, then put them in the dripping sequence.',
    events: [event('first-drop', 'First falling drop', 'drip'), event('second-drop', 'Next falling drop', 'drop')],
    reasons: [reason('sound', 'Drip and drop imitate the water sounds in this line.'), reason('source', 'Roof names a sound made by water.'), reason('letters', 'Only words in capital letters can imitate sounds.')],
    explanation: 'The line gives a drip, then a drop. Both words imitate water sounds.',
  }),
  task('e1-r3', 'Crack! The branch breaks; splash! It falls into the pond.', ['crack', 'splash'], {
    kind: 'timeline', prompt: 'Restore the two events: a branch breaks, then reaches the pond.',
    events: [event('break', 'Branch breaking', 'crack'), event('pond', 'Water impact', 'splash')],
    reasons: [reason('sound', 'Crack fits the break; splash fits the water impact.'), reason('source', 'Both sound words belong only to the branch breaking.'), reason('letters', 'Pond is the sound word because it names the water.')],
    explanation: 'Match each sound word to its event: crack at the break, splash at the pond.',
  }),
  task('e1-exit', 'Clang! The bell rings above the gate.', ['clang'], {
    kind: 'timeline', prompt: 'Exit check: find the sound word and match its event.',
    events: [event('bell', 'Bell ringing', 'clang')],
    reasons: [reason('sound', 'Clang imitates a ringing bell.'), reason('source', 'Bell is a word imitating its own sound.'), reason('letters', 'Gate and bell have matching sounds.')],
    explanation: 'Clang is sound imitation; bell names its source.', exit: true,
  }),
];

const airship = [
  task('e2-r1', 'Seven silver sails sway.', ['seven', 'silver', 'sails', 'sway'], {
    kind: 'phrase', prompt: 'Repair the sail phrase: Seven ___ sails ___.', sound: 's',
    soundOptions: ['s', 'k', 'b'], pool: ['sway', 'green', 'silver', 'sails', 'Seven', 'run'],
    fixed: { 0: 'Seven', 2: 'sails' }, acceptedPhrases: [['Seven', 'silver', 'sails', 'sway']],
    explanation: 'Seven, silver, sails and sway begin with the same S sound.',
  }),
  task('e2-r2', 'Kind cats carry kites.', ['kind', 'cats', 'carry', 'kites'], {
    kind: 'phrase', prompt: 'Build a meaningful four-word phrase with the opening K sound.', sound: 'k',
    soundOptions: ['k', 's', 'b'], pool: ['kites', 'city', 'Kind', 'sleep', 'carry', 'cats'], fixed: {},
    acceptedPhrases: [['Kind', 'cats', 'carry', 'kites']],
    reasons: [reason('sound', 'Kind and cats start with the same sound despite different letters.'), reason('letters', 'City belongs because its first letter is C.'), reason('length', 'All words must have four letters.')],
    explanation: 'Kind and cats begin with K. City begins with S in the recording.',
  }),
  task('e2-r3', 'Bright birds balance berries.', ['bright', 'birds', 'balance', 'berries'], {
    kind: 'phrase', prompt: 'Choose a meaningful phrase for the garden sail. Keep the B sound.', sound: 'b',
    soundOptions: ['b', 's', 'k'], pool: ['berries', 'Blue', 'birds', 'Bright', 'balance', 'silver'], fixed: {},
    acceptedPhrases: [['Bright', 'birds', 'balance', 'berries'], ['Blue', 'birds', 'balance', 'berries']],
    explanation: 'Bright birds or Blue birds both work. The four words share an opening B sound.',
  }),
  task('e2-exit', 'Lazy cats carry coats.', ['cats', 'carry', 'coats'], {
    prompt: 'Exit check: highlight the words that begin with the K sound.', sound: 'k', soundOptions: ['k', 's', 'b'], exit: true,
    explanation: 'Cats, carry and coats begin with K. Lazy begins with L.',
  }),
];

const cavern = [
  task('e3-r1', 'Rain trails across the pale lake.', ['rain', 'trails', 'pale', 'lake'], {
    kind: 'echo', prompt: 'Connect word lanterns with the same vowel echo.', sound: 'ay', soundOptions: ['ay', 'oo', 'oh'],
    explanation: 'Rain, trails, pale and lake repeat the AY vowel sound.',
  }),
  task('e3-r2', 'A blue moon lights the room.', ['blue', 'moon', 'room'], {
    kind: 'echo', prompt: 'Find the OO echo even when its spelling changes.', sound: 'oo', soundOptions: ['oo', 'ay', 'oh'],
    reasons: [reason('sound', 'Blue, moon and room repeat the OO vowel sound.'), reason('letters', 'Only the words spelled with OO can share this sound.'), reason('length', 'Lights shares the sound because it is in the sentence.')],
    explanation: 'Blue and moon have different spellings but the same vowel sound here.',
  }),
  task('e3-r3', 'We wait by the pale lake until late.', ['wait', 'pale', 'lake', 'late'], {
    kind: 'echo', prompt: 'Repair the final word, then connect the AY echoes.', sound: 'ay', soundOptions: ['ay', 'oo', 'oh'],
    repair: { index: 7, choices: ['late', 'dawn', 'night'], answer: 'late' },
    contrast: 'rain-said',
    explanation: 'Late continues the AY echo in wait, pale and lake. Spelling alone is not a sound test.',
  }),
  task('e3-exit', 'The slow boat floats home.', ['slow', 'boat', 'floats', 'home'], {
    kind: 'echo', prompt: 'Exit check: connect the vowel echoes in the new line.', sound: 'oh', soundOptions: ['oh', 'ay', 'oo'], exit: true,
    explanation: 'Slow, boat, floats and home share the OH vowel sound in the recording.',
  }),
];

const threadworks = [
  task('e4-r1', 'The boat hit the net.', ['boat', 'hit', 'net'], {
    kind: 'thread', prompt: 'Thread the matching consonant sounds. Mark where each sound occurs.', sound: 't', soundOptions: ['t', 'k', 'm'], position: 'end',
    reasons: [reason('sound', 'Boat, hit and net repeat T at the end; their vowels differ.'), reason('letters', 'Every word begins with the same consonant.'), reason('length', 'The words all repeat the same vowel.')],
    explanation: 'These words end in T. A shared ending consonant creates this thread.',
  }),
  task('e4-r2', 'The duck shook the sack.', ['duck', 'shook', 'sack'], {
    kind: 'thread', prompt: 'Compare opening K in “Kind cats carry kites” with the endings here.', sound: 'k', soundOptions: ['k', 't', 'm'], position: 'end',
    reasons: [reason('sound', 'Duck, shook and sack repeat K at the end; the comparison repeats it at the start.'), reason('letters', 'Duck and shook repeat the same vowel sound.'), reason('length', 'Only the first letter can create a consonant echo.')],
    explanation: 'The K sound is at the ends here. In Kind cats carry kites, it starts the words.',
  }),
  task('e4-r3', 'A beam of light falls across the room.', ['beam', 'room'], {
    kind: 'thread', prompt: 'Repair the line and thread its final M sounds.', sound: 'm', soundOptions: ['m', 't', 'k'], position: 'end',
    repair: { index: 7, choices: ['room', 'roof', 'road'], answer: 'room' },
    explanation: 'Beam and room repeat M at the end. Roof and road do not continue this thread.',
  }),
  task('e4-exit', 'A cap fell beside the rope.', ['cap', 'rope'], {
    kind: 'thread', prompt: 'Exit check: connect two words with a final P sound.', sound: 'p', soundOptions: ['p', 't', 'm'], position: 'end', exit: true,
    explanation: 'Cap and rope end in P. The silent E in rope does not add another sound.',
  }),
];

const festival = [
  task('e5-r1', 'Buzz! Bright bees circle the bloom.', ['buzz', 'bright', 'bees', 'bloom'], {
    prompt: 'Find the sound imitation AND the words with an opening B sound.',
    reasons: [reason('sound', 'Buzz imitates a sound; Buzz, Bright, bees and bloom also begin with B.'), reason('letters', 'Every word in the line is sound imitation.'), reason('length', 'A line can contain only one sound device.')],
    explanation: 'One line can have several devices. Buzz imitates sound and also joins the B pattern.',
  }),
  task('e5-r2', 'A blue moon lights the room.', ['blue', 'moon', 'room'], {
    kind: 'echo', prompt: 'Light the lanterns that share a vowel sound.', sound: 'oo', soundOptions: ['oo', 'ay', 'oh'],
    explanation: 'Blue, moon and room repeat OO. Different spellings can share a vowel sound.',
  }),
  task('e5-r3', 'The boat hit the net.', ['boat', 'hit', 'net'], {
    kind: 'thread', prompt: 'One last sound thread before you write your own poem.', sound: 't', soundOptions: ['t', 'k', 'm'], position: 'end',
    explanation: 'The ending T thread is consonance. Now try a sound effect in your own writing.',
  }),
];

const define = (day, kind, title, subtitle, backdrop, rounds, tutorial, tip) => ({
  id: `english-${kind}`, lessonId: `reading-island-q1-week-1-day-${day}`,
  day, kind, title, subtitle, backdrop, rounds, tutorial, tip,
  brief: subtitle, summary: tutorial,
  competencyRefs: day === 5 ? ['EN6WC-Ia-2.2.2', 'EN6RC-Ia sound-device family'] : ['EN6RC-Ia sound-device family'],
});

export const englishWeekOneGames = [
  define(1, 'soundscape', 'SOUNDSCAPE STUDIO', 'Restore sound words to their events.', 'studio-backdrop', soundscape,
    'Listen to the line. Choose sound words, match each event, and explain your evidence.',
    'A sound word imitates a noise. The object making a sound is a different idea.'),
  define(2, 'airship', 'ALLITERATION AIRSHIP', 'Build phrases that share an opening sound.', 'airship-backdrop', airship,
    'Choose word tiles to fill the sail sockets. Keep a meaningful order and a shared opening sound.',
    'Listen to beginnings: cat and kite share K, while city begins with S.'),
  define(3, 'cavern', 'VOWEL ECHO CAVERN', 'Connect the vowel sounds inside words.', 'cavern-backdrop', cavern,
    'Select matching word lanterns. Tune the vowel echo, then explain the sound you hear.',
    'Assonance follows vowel sounds. Rain and said are not the same vowel in this recording.'),
  define(4, 'threadworks', 'CONSONANCE THREADWORKS', 'Thread consonant sounds through a line.', 'threadworks-backdrop', threadworks,
    'Select a sound position on each matching word, choose the sound, and explain your thread.',
    'Start, middle and end are sound locations. Silent letters do not add sounds.'),
  define(5, 'festival', 'POETRY LANTERN FESTIVAL', 'Explore sound patterns. Write your own poem.', 'festival-backdrop', festival,
    'Inspect three model lines, then write four stanzas of three lines. Mark intended devices and save your poem.',
    'Your device labels show your intention. A teacher reviews how the sound effects work.'),
];

export const getEnglishGame = lessonId => englishWeekOneGames.find(game => game.lessonId === lessonId);
export const englishWordAudioKey = word => `english-word-${cleanEnglishWord(word)}`;
const uniqueWords = [...new Set(englishWeekOneGames.flatMap(game => game.rounds.flatMap(round => [
  ...round.words.map(word => word.word), ...(round.pool ?? []).map(cleanEnglishWord), ...(round.repair?.choices ?? []).map(cleanEnglishWord),
])).filter(Boolean))];
export const ENGLISH_AUDIO_CLIPS = [
  { key: 'english-contrast-rain-said', text: 'Rain. Said. Rain. Said.' },
  ...englishWeekOneGames.flatMap(game => game.rounds.map(round => ({ key: `english-${round.id}`, text: round.line }))),
  ...uniqueWords.map(word => ({ key: englishWordAudioKey(word), text: word })),
  ...Object.entries(ENGLISH_SOUND_BANK).map(([id, value]) => ({ key: `english-sound-${id}`, text: value.speech })),
];
