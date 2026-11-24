// Edit the intro sequence and Krae's one-sided dialogue here.
// The story lines below are placeholders for the final script.
// Add stitched cinematic segments to `clips` in the order they should play.
export const INTRO_FLOW = [
  {
    id: 'cinematic',
    type: 'cutscene',
    clips: [{ key: 'intro-cutscene-1', durationMs: 39450 }],
  },
  {
    id: 'library',
    type: 'dialogue',
    character: { id: 'krae', name: 'KRAE' },
    background: 'intro-library-background',
    location: 'GRAND LIBRARY',
    lines: [
      { pose: 'talk', text: 'You made it! I’m Krae, keeper of the Grand Library. That glowing book brought you all the way to Lumora.' },
      { pose: 'cry', text: 'Oh, dear… a strange mist has scattered our knowledge and hidden the paths between the islands.' },
      { pose: 'talk', text: 'But you’re here now. With your curiosity, we can find what was lost and help Lumora shine again.' },
      { pose: 'smile', text: 'Come with me. I want to show you the world we’ll explore together.' },
    ],
  },
  {
    id: 'world-intro',
    type: 'cutscene',
    fadeFromPrevious: true,
    clips: [{ key: 'world-intro', durationMs: 21386 }],
  },
  {
    id: 'world-introduction',
    type: 'dialogue',
    character: { id: 'krae', name: 'KRAE' },
    fadeFromPrevious: true,
    background: 'floating-sky',
    location: 'LUMORA',
    lines: [
      { pose: 'talk', text: 'Welcome to the world of Lumora! Each floating island holds a different part of our shared knowledge.' },
      { pose: 'smile', text: 'The Grand Library is our home. From here, you can explore Vulcan Caverns, Reading Island, and Numeric Ruins.' },
      { pose: 'smile', text: 'Choose whichever island sparks your curiosity. Take your time, ask questions, and enjoy learning.' },
      { pose: 'talk', text: 'Use the arrows or swipe to bring an island to the center. Select it to visit; the islands behind the mist will open in time.' },
    ],
  },
  { id: 'world', type: 'world', fadeFromPrevious: true },
];

export const INTRO_FADE_MS = 600;
export const MENU_START_FADE_MS = 2000;
