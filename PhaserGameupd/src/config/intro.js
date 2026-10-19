// Edit the intro sequence and Quill's one-sided dialogue here.
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
    background: 'intro-library-background',
    location: 'GRAND LIBRARY',
    lines: [
      { pose: 'talk', text: 'You made it! I am Quill, keeper of the Grand Library. This book has brought you to Lumora.' },
      { pose: 'sad', text: 'A strange mist has scattered our knowledge and hidden the paths between our islands.' },
      { pose: 'talk', text: 'We need a curious mind to help us uncover what was lost. Will you lend us your courage and curiosity?' },
      { pose: 'default', text: 'Come with me. There is something you should see.' },
    ],
  },
  {
    id: 'world-introduction',
    type: 'dialogue',
    revealDurationMs: 4000,
    fadeFromPrevious: true,
    background: 'lumora-world',
    location: 'LUMORA',
    lines: [
      { pose: 'talk', text: 'This is Lumora: a world of islands, each holding a different part of our shared knowledge.' },
      { pose: 'talk', text: 'Three islands are open to you: Vulcan Caverns, Reading Island, and Numeric Ruins.' },
      { pose: 'default', text: 'Begin in Vulcan Caverns, or visit the other open islands. Take your time, ask questions, and keep learning.' },
      { pose: 'talk', text: 'Hover over an island to see its name and subject, then click an open island to visit. On a touch screen, tap once to look and again to visit.' },
    ],
  },
  { id: 'world', type: 'world', fadeFromPrevious: true },
];

export const INTRO_FADE_MS = 600;
export const MENU_START_FADE_MS = 2000;
