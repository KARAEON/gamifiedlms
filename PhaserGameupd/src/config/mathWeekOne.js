const rounds = (kind, items) => items.map((item, i) => ({ ...item, kind, id: `${kind}-${i + 1}`, exit: i === 3 }));
export const MATH_UNITS = [2, 3, 4, 5, 6, 8, 10, 12, 15, 16, 18, 20, 24, 30, 36, 40, 48];
export const mathWeekOneGames = [
  {
    day: 1, id: 'fraction-bridgeworks', kind: 'bridge', title: 'Fraction Bridgeworks', subtitle: 'Join like fractions', backdrop: 'bridgeworks',
    tip: 'Keep the whole rail fixed. Joining pieces changes their count, never their size.',
    tutorial: 'For 1/6 + 2/6, place one ochre piece and two teal pieces on a six-part rail. Three pieces each worth 1/6 cover 3/6, or 1/2, of the same whole.',
    steps: ['Choose the original size of each piece.', 'Tap supply buttons or drag pieces onto the rail.', 'Record the total length. The denominator still names the original unit.'],
    rounds: rounds('bridge', [
      { a: '2/8', b: '3/8', d: 8, counts: [2, 3], prompt: 'Join the two stone supplies: 2/8 + 3/8.', hint: 'Both supplies use eighths. Place two ochre pieces and three teal pieces.' },
      { a: '3/10', b: '4/10', d: 10, counts: [3, 4], extras: true, prompt: 'Use only the order: 3/10 + 4/10. Extra stones can stay behind.', hint: 'There are extras in the trays. The order needs exactly three ochre and four teal tenths.' },
      { a: '5/12', b: '4/12', d: 12, counts: [5, 4], prompt: 'Build 5/12 + 4/12 and name an equivalent total.', hint: 'Nine twelfths cover the same length as three fourths.' },
      { a: '1/6', b: '3/6', d: 6, counts: [1, 3], prompt: 'Exit check: 1/6 + 3/6. Which piece size stays unchanged?', hint: 'Four pieces are joined. Every piece is still one sixth of the original rail.' },
    ]),
  },
  {
    day: 2, id: 'mosaic-converter', kind: 'mosaic', title: 'Mosaic Converter', subtitle: 'Find a shared unit', backdrop: 'mosaic-courtyard',
    tip: 'Both panels represent the same-sized whole. Repartitioning preserves each shaded area.',
    tutorial: 'For 1/2 + 1/3, use sixths: 1/2 = 3/6 and 1/3 = 2/6. Transfer both groups. The combined mosaic covers 5/6. Twelfths also work: 6/12 + 4/12 = 10/12.',
    steps: ['Choose a unit that divides both whole panels evenly.', 'Move each tile handle to match its shaded area, or enter a tile count.', 'Transfer the groups to add or remove tiles, then record the result.'],
    rounds: rounds('mosaic', [
      { a: '1/3', b: '1/4', op: '+', prompt: 'Combine 1/3 and 1/4 of a mosaic.', hint: 'Twelfths work: 1/3 = 4/12 and 1/4 = 3/12. A larger common multiple also works.' },
      { a: '5/6', b: '1/4', op: '-', prompt: 'Remove 1/4 from a mosaic covering 5/6.', hint: 'Use twelfths: 10/12 − 3/12. Both conversions must preserve their original areas.' },
      { a: '7/8', b: '1/6', op: '-', prompt: 'Remove 1/6 from 7/8. Plan a finer shared grid.', hint: 'Twenty-fourths work: 21/24 − 4/24.' },
      { a: '3/4', b: '1/3', op: '-', prompt: 'Exit check: show 3/4 − 1/3 with shared tiles.', hint: 'Use twelfths: 9/12 − 4/12.' },
    ]),
  },
  {
    day: 3, id: 'whole-trade-depot', kind: 'depot', title: 'Whole-Trade Depot', subtitle: 'Add mixed-number loads', backdrop: 'whole-trade-depot',
    tip: 'A trade exchanges exactly one whole’s worth of equal parts. Nothing is created or lost.',
    tutorial: 'For 1 3/4 + 2 2/4, unload three whole crates and five quarter parcels. Select four parcels and trade them for one crate. The load is now 4 1/4.',
    steps: ['Choose a common parcel size and unload both loads.', 'If enough parts make a whole, select and trade exactly that many.', 'If no trade is needed, say so. Record the final load.'],
    rounds: rounds('depot', [
      { a: '1 2/5', b: '2 1/5', prompt: 'Combine 1 2/5 and 2 1/5 crates. Is a trade needed?', hint: 'Three fifth parcels are less than five. Keep the three whole crates and choose “No exchange needed”.' },
      { a: '2 3/4', b: '1 2/4', prompt: 'Combine 2 3/4 and 1 2/4 crates, then trade.', hint: 'Three whole crates and five quarters become four whole crates and one quarter.' },
      { a: '1 2/3', b: '2 5/6', prompt: 'Combine 1 2/3 and 2 5/6 crates using a shared parcel size.', hint: 'Use sixths. Four sixths plus five sixths give nine sixths; trade six for one whole.' },
      { a: '1 5/6', b: '2 2/3', prompt: 'Exit check: combine 1 5/6 and 2 2/3 crates.', hint: 'Use sixths: five plus four parts. Trade six of the nine parts for one whole.' },
    ]),
  },
  {
    day: 4, id: 'reservoir-rescue', kind: 'reservoir', title: 'Reservoir Rescue', subtitle: 'Subtract measured water', backdrop: 'reservoir-rescue',
    tip: 'Water in the reservoir plus water delivered always equals the starting amount.',
    tutorial: 'For 2 1/4 L − 3/4 L, exchange one whole litre for four quarters. The reservoir becomes 1 whole and 5 quarters. Draw three quarters; 1 2/4 L remains.',
    steps: ['Choose a common measuring unit and prepare the reservoir.', 'Exchange a whole litre for parts when needed.', 'Tap a tank or draw loose measures to fill the jug to its order line. Record the water left.'],
    rounds: rounds('reservoir', [
      { a: '2 5/8', b: '1 3/8', unit: 'L', prompt: 'The reservoir has 2 5/8 L. Deliver 1 3/8 L.', hint: 'Draw one whole litre and three eighths. This order needs no exchange.' },
      { a: '3 1/4', b: '1 3/4', unit: 'L', prompt: 'The reservoir has 3 1/4 L. Deliver 1 3/4 L.', hint: 'Exchange one litre for four quarters: 2 whole litres and 5 quarters. Then draw the order.' },
      { a: '4 1/6', b: '2 3/4', unit: 'L', prompt: 'The reservoir has 4 1/6 L. Deliver 2 3/4 L.', hint: 'Use twelfths: 4 2/12. An exchange gives 3 whole litres and 14 twelfths.' },
      { a: '2 1/3', b: '5/6', unit: 'L', prompt: 'Exit check: deliver 5/6 L from 2 1/3 L.', hint: 'Use sixths. Exchange a whole litre, then draw five sixths.' },
    ]),
  },
  {
    day: 5, id: 'caravan-supply-planner', kind: 'caravan', title: 'Caravan Supply Planner', subtitle: 'Use fractions on a journey', backdrop: 'caravan-planner',
    tip: 'Let the story choose the operation. A route works only when every supply condition holds.',
    tutorial: 'Joining two ropes uses addition: 1/2 m + 1/4 m = 3/4 m. Cutting a piece uses subtraction. For a route, add the deliveries and subtract that total from the starting water.',
    steps: ['Choose quantity cards, their operation, and the measured unit.', 'For a cut, show the regrouped ledger before subtracting.', 'Tap three distinct stations on the map. Try the route and check both the delivery and reserve.'],
    rounds: [
      { id: 'caravan-1', kind: 'caravan', a: '2 1/4', b: '1 2/3', op: '+', unit: 'm', modelD: 12, prompt: 'Join a 2 1/4 m rope and a 1 2/3 m rope. How long is the new rope?', hint: 'Join means add. Use twelfths: 2 3/12 + 1 8/12.' },
      { id: 'caravan-2', kind: 'caravan', a: '3 1/4', b: '1 5/6', op: '-', unit: 'm', modelD: 12, regroup: true, prompt: 'Cut 1 5/6 m from a 3 1/4 m ribbon. How much remains?', hint: 'Use twelfths. Exchange a whole: 3 3/12 becomes 2 15/12. Remove 1 10/12.' },
      { id: 'caravan-3', kind: 'route', a: '5', unit: 'L', stations: [{ id: 'A', amount: '1 1/2' }, { id: 'B', amount: '1 3/4' }, { id: 'C', amount: '3/4' }, { id: 'D', amount: '1 1/4' }], prompt: 'Start with 5 L. Visit exactly 3 different stations. Deliver at least 3 1/2 L and keep at least 1 L.', hint: 'Several routes work. Add three station orders, then subtract that total from 5 L. ABC, ACD and BCD each meet both conditions.' },
      { id: 'caravan-4', kind: 'caravan', a: '2 1/2', b: '3/4', op: '-', unit: 'm', modelD: 4, exit: true, prompt: 'Exit check: cut 3/4 m from 2 1/2 m of rope. How much remains?', hint: 'Use quarters: 2 2/4 becomes 1 6/4. Remove 3/4. Used rope plus rope left equals the starting rope.', explanations: [{ id: 'balance', text: 'Used rope + rope left = starting rope.' }, { id: 'add-order', text: 'Starting rope + cut rope = rope left.' }, { id: 'change-unit', text: 'Cutting changes metres into litres.' }], explanation: 'balance' },
    ],
  },
].map(game => ({
  ...game, lessonId: `numeric-ruins-q1-week-1-day-${game.day}`, brief: game.tip,
  rounds: game.rounds.map(round => ({ ...round, checkpoints: round.kind === 'bridge' ? ['pieces', 'unit', 'answer'] : round.kind === 'mosaic' ? ['grid', 'conversions', 'transfer', 'answer'] : round.kind === 'depot' ? ['load', 'exchange', 'conservation', 'answer'] : round.kind === 'reservoir' ? ['delivery', 'conservation', 'unit', 'answer'] : round.kind === 'route' ? ['route', 'equations', 'ledger', 'unit'] : ['equation', ...(round.regroup ? ['regroup'] : []), 'unit', 'answer', ...(round.explanations ? ['explanation'] : [])] })),
}));
export const getMathGame = lessonId => mathWeekOneGames.find(game => game.lessonId === lessonId);
