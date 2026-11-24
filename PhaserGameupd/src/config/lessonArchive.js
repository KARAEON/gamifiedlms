import {
  islands, islandCurricula, mixMatchMixturesGame, supplyCartSortingGame,
  mixtureDetectiveGame, scienceCourtGame, inventMixWorkshopGame,
} from './content.js';
import { ISLAND_VISUALS } from './islandVisuals.js';

const topicNotes = {
  'Mixtures': 'A mixture contains two or more materials. In a uniform mixture, the components are evenly spread, as in dissolved salt in water. In a non-uniform mixture, different parts can still be seen or settle into separate layers.',
  'Separation Techniques': 'Pick a method based on the property that differs. Magnets attract iron, sieves sort by particle size, and filters trap insoluble particles. Decantation pours liquid away from settled material, while evaporation can leave a dissolved solid behind.',
  'Benefits of Separation': 'Separation can recover useful materials and reduce waste. Decide which component you need, match the method to the mixture, and use evidence from both outputs to judge how well it worked.',
  'Mixtures and Separation in Action': 'Make a plan from observations, follow every component through each step, and put the recovered materials to use. Compare methods under the same starting conditions when you need to decide which works better.',
  'Body Systems': 'Organs work together in systems. The digestive system breaks down food, the respiratory system exchanges gases, and the circulatory system carries materials such as oxygen and nutrients around the body.',
  'Animal Groups': 'Scientists group animals by shared traits. Vertebrates have backbones. Invertebrates, such as insects and earthworms, do not. Look for observable evidence before deciding where an animal belongs.',
  'Ecosystems': 'An ecosystem includes living things and their physical surroundings. Plants, animals, and decomposers depend on resources and on one another. A food chain traces how energy moves from one organism to another.',
  'Gravity and Friction': 'Gravity pulls objects with mass toward one another. Friction acts against relative motion between surfaces in contact. A rougher surface often produces more friction, which you can investigate with a fair comparison.',
  'Energy Transformations': 'Energy can change form. A lamp transforms electrical energy into light and heat, while a moving fan turns electrical energy into motion, sound, and heat.',
  'Simple Machines': 'Levers, pulleys, ramps, and other simple machines can change the size or direction of a force. A ramp lets you raise a load with a smaller force spread over a longer distance.',
  'Earthquakes and Volcanoes': 'Earthquakes occur when stored energy is released in Earth’s crust, often along a fault. Volcanoes form in places where molten rock and gases reach the surface. Maps of past events help identify hazard zones.',
  'Seasons': 'Earth’s tilted axis changes the angle of sunlight and the length of daylight as Earth orbits the Sun. When one hemisphere is tilted toward the Sun, it gets more direct sunlight and longer days.',
  'Solar System': 'The Sun is the star at the center of our solar system. Planets orbit the Sun, moons orbit planets, and smaller bodies include asteroids and comets. Models use scale to show relative sizes or distances.',

  'Fraction Operations': 'Fractions count equal parts of a whole. Add or subtract only after the parts have the same size. With mixed numbers, exchange one whole for equal fractional parts whenever you need to regroup.',
  'Decimal Addition and Subtraction': 'Line up place values so tenths combine with tenths and hundredths with hundredths. For example, write 2.4 as 2.40 before subtracting 0.36.',
  'Decimal Multiplication': 'Use place value to locate the decimal point in a product. As a check, 0.4 × 0.3 is four tenths of three tenths, or twelve hundredths.',
  'Decimal Division': 'Multiply both numbers by the same power of ten to make a decimal divisor a whole number. For instance, 4.2 ÷ 0.6 has the same quotient as 42 ÷ 6.',
  'Ratio and Proportion': 'A ratio compares two quantities. A proportion says two ratios are equal. A recipe using 2 cups of rice for 3 cups of water keeps the same ratio at 4 cups to 6 cups.',
  'Percent and Its Applications': 'Percent means per hundred. Find 25% of a quantity by multiplying it by 25/100. The same idea applies to discounts, survey results, and changes in price.',
  'Exponents and GEMDAS': 'An exponent counts repeated factors, so 3² means 3 × 3. Evaluate grouping and exponents first, then multiplication and division left to right, then addition and subtraction left to right.',
  'Integers': 'Integers include positive and negative whole numbers and zero. On a number line, values increase to the right. Opposites such as 4 and −4 are equally far from zero.',
  'Solid Figures': 'Three-dimensional figures occupy space. Identify them by features such as faces, edges, vertices, and curved surfaces. A net shows how flat faces fold into a solid.',
  'Patterns and Equations': 'A pattern follows a rule that connects terms. An equation states that two expressions are equal. For the rule add 3, a sequence beginning at 2 continues 5, 8, 11.',
  'Speed and Composite Area': 'Average speed equals total distance divided by total time. For a composite area, split the figure into familiar shapes and add their areas, or subtract the area of a cutout.',
  'Surface Area': 'Surface area measures the outside of a solid in square units. Draw or imagine the net and add the areas of every face once.',
  'Volume of Solids': 'Volume measures the space inside a solid in cubic units. For a rectangular prism, multiply length × width × height to count unit cubes.',
  'Electric and Water Meters': 'Subtract an earlier meter reading from a later reading to find consumption. Report the unit shown, such as kilowatt-hours for electricity or cubic metres for water.',
  'Pie Graphs': 'Each sector shows a share of a whole. All shares total 100%, or 360°. A category that makes up one quarter of the data takes up a 90° sector.',
  'Probability': 'Probability describes how likely an event is, from 0 for impossible to 1 for certain. When outcomes are equally likely, divide favorable outcomes by all possible outcomes.',

  'Sound Devices and Poetry': 'Poets use sound to create emphasis, rhythm, or mood. Listen for words that imitate sounds and for repeated consonant or vowel sounds. Read lines aloud to hear what spelling alone can hide.',
  'Figurative Language': 'Figurative language describes something through an imaginative comparison or expression. A simile uses like or as, a metaphor makes a direct comparison, and personification gives a human quality to something nonhuman.',
  'Story Elements': 'Characters act within a setting and face a conflict that shapes the plot. The theme is a takeaway about life or people supported by what happens in the story.',
  'Narratives and Grammar': 'A narrative tells events in a meaningful order. Consistent verb tense and clear pronouns help readers follow who did what and when.',
  'Informational Texts': 'Informational texts explain a topic with facts and examples. Identify the central idea, then use details, headings, and diagrams to see how the author develops it.',
  'Research and Text Details': 'Begin with a clear question. Compare trustworthy sources, record where information came from, and use specific details to support what you write.',
  'Adverbs and Clear Writing': 'Adverbs can tell how, when, where, or how often something happens. Choose the word and its position so the reader can tell which action it describes.',
  'Conjunctions and Composition': 'Conjunctions connect ideas. And adds information, but signals a contrast, and because introduces a reason. Choose the connector that matches the relationship you want to show.',
  'Text Types and Opinions': 'Texts can tell a story, explain, or persuade. A claim of fact can be checked with evidence. An opinion expresses a view and can still be supported with reasons and facts.',
  'Bias and Propaganda': 'Word choice, selected evidence, and emotional appeals shape how readers see an issue. Compare sources and ask whose perspective is represented or missing.',
  'Discussion and Editorials': 'In discussion, listen, respond to the point, and support your view with evidence. An editorial states a position and explains why its reasons matter to readers.',
  'Reports and Viewpoints': 'A report organizes information around a purpose and uses checkable details. Comparing viewpoints helps a reader see where people agree, disagree, or emphasize different evidence.',
  'Cause and Effect': 'A cause helps explain why something happened. An effect is what followed because of it. Look for evidence of the link, even when signal words such as because are absent.',
  'Problem and Solution': 'A text may describe a problem, explain what causes it, and propose one or more solutions. Judge a solution by whether it addresses the cause and can work in the situation.',
  'Research and Summaries': 'A summary states the main idea and essential details in your own words. Leave out minor examples and keep track of which source supplied the information.',
  'Persuasive Writing': 'Persuasive writing makes a clear claim and supports it with reasons and evidence. Address a likely objection and close with what you want readers to think or do.',
};

const lessonNotes = {
  'q1-m1-l1': 'Match each mixture to the clue that describes it. Dissolved salt water looks even throughout, while sand and water show separate components.',
  'q1-m1-l2': 'Sort useful mixtures by whether their parts are evenly spread. Then connect each mixture to its everyday use, such as a drink or a building material.',
  'q1-m1-l3': 'Look closely at samples and compare what you can see or what settles. Use those observations as evidence for a uniform or non-uniform classification.',
  'q1-m1-l4': 'Defend a classification with a relevant observation. A sound explanation connects what you saw in the sample to the way its components are distributed.',
  'q1-m1-l5': 'Choose ingredients for a purpose and predict how they will mix. Classify the new mixture and explain how its properties support the use you planned.',
  'q1-m2-l1': 'Move a magnet through a mixed sample to recover iron. Sand, wood, and copper stay behind with this magnet, so being a metal alone is not enough.',
  'q1-m2-l2': 'Choose a mesh opening between two particle sizes. Smaller grains pass through while stones larger than the holes stay in the sieve.',
  'q1-m2-l3': 'Set up a funnel, filter paper, and receiving jar. Insoluble grains remain as residue and dissolved salt travels with the liquid that passes through.',
  'q1-m2-l4': 'Compare the salt solution before, during, and after evaporation. Water changes into vapor and the dissolved salt is left behind as crystals.',
  'q1-m2-l5': 'Let sediment settle, then pour off the upper liquid gently. Steep tilting or pouring too far can carry some sediment into the collected liquid.',
  'q1-m3-l1': 'Match each request to a method that recovers the desired material. Fit the jobs into the shift so two requests never use the same station at the same time.',
  'q1-m3-l2': 'Track both outputs from each separator. When an output still has several components, move that stream to another suitable tool.',
  'q1-m3-l3': 'Use limited service tokens where the method matches the mixture and recovers the most useful material. Compare what the community can reuse after each plan.',
  'q1-m3-l4': 'Study the failed result and change one condition at a time. Comparing the new output with the baseline helps explain what restored the process.',
  'q1-m3-l5': 'Build a before, during, and after report. Explain the original mixture, the method used, the material recovered, and how someone can use it.',
  'q1-m4-l1': 'Inspect the sample, then stir, settle, or test it with a magnet. Use observations and the preparation record together to explain what is in the mixture.',
  'q1-m4-l2': 'Pack the smallest set of tools that can recover the requested products. Run the process in order and check what each tool leaves behind or passes on.',
  'q1-m4-l3': 'Carry a mixed output to another bench while storing recovered material. More than one order can work if you keep track of all the solids, liquids, and vapor.',
  'q1-m4-l4': 'Start with equal amounts and keep relevant conditions the same. Compare what each method collects or retains and choose using the observed result.',
  'q1-m4-l5': 'Recover the specific materials needed for workshop repairs. Record observations, track both outputs, and explain why each recovered material helps.',

  'numeric-ruins-q1-week-1-day-1': 'Join pieces of the same size on a fixed rail. Two eighths plus three eighths makes five eighths. The part size stays an eighth.',
  'numeric-ruins-q1-week-1-day-2': 'Give two mosaics a common tile size while keeping their shaded areas fixed. One third and one fourth become four twelfths and three twelfths, so their total is seven twelfths.',
  'numeric-ruins-q1-week-1-day-3': 'Combine whole crates and equal-sized parcels. Four quarters can trade for one whole crate. Adding 2 3/4 and 1 2/4 therefore gives 4 1/4.',
  'numeric-ruins-q1-week-1-day-4': 'Exchange a litre for smaller parts when you need to draw more loose measures than you have. Starting with 3 1/4 L and delivering 1 3/4 L leaves 1 1/2 L.',
  'numeric-ruins-q1-week-1-day-5': 'Join lengths by adding and find what is left after a cut by subtracting. For a supply route, add the station orders, then subtract the total from the starting water to check the reserve.',

  'reading-island-q1-week-1-day-1': 'Onomatopoeia uses words that imitate sounds. Read words such as buzz, crack, or splash aloud and explain what each one adds to the scene.',
  'reading-island-q1-week-1-day-2': 'Alliteration repeats an initial consonant sound in nearby words. Listen for the repeated sound in silver sails and use it to make a phrase memorable.',
  'reading-island-q1-week-1-day-3': 'Assonance repeats a vowel sound in nearby words, as in deep green leaves. Listen to the vowel sound you hear across the words.',
  'reading-island-q1-week-1-day-4': 'Consonance repeats consonant sounds within or at the ends of nearby words. Read a phrase aloud, find the repeated sound, and describe the effect it creates.',
  'reading-island-q1-week-1-day-5': 'Draft an original four-stanza poem and mark examples of deliberate sound choices. Read it aloud, revise it, and explain how each sound choice supports the intended mood.',
};

const earlyScienceGames = Object.fromEntries([
  mixMatchMixturesGame, supplyCartSortingGame, mixtureDetectiveGame, scienceCourtGame, inventMixWorkshopGame,
].map(game => [game.lessonId, game.title]));

const bookFinishes = {
  'vulcan-caverns': 'ember', 'reading-island': 'moss', 'numeric-ruins': 'ocean',
  'hibla-archipelago': 'clay', 'hearthwork-terraces': 'olive', 'tala-crossroad': 'russet', 'concord-grove': 'pine',
};

function archiveQuarters(islandId) {
  const quarters = islandCurricula[islandId]?.quarters ?? {};
  return Object.values(quarters).map((quarter, index) => ({
    id: quarter.id,
    label: `Quarter ${index + 1}`,
    topics: quarter.majors.filter(major => topicNotes[major.title]).map(major => ({
      id: major.id,
      title: major.title,
      note: topicNotes[major.title],
      lessons: major.lessons.flatMap(lesson => {
        const note = lessonNotes[lesson.id];
        if (!note) return [];
        const title = earlyScienceGames[lesson.id] ?? lesson.title;
        const label = title === title.toUpperCase() ? title.toLowerCase().replace(/\b[a-z]/g, letter => letter.toUpperCase()) : title;
        return [{ id: lesson.id, title: label, note }];
      }),
    })),
  }));
}

export const archiveVolumes = Object.entries(bookFinishes).map(([islandId, finish]) => {
  const island = islands.find(item => item.id === islandId);
  return { island, finish, subject: ISLAND_VISUALS[islandId].subject, quarters: archiveQuarters(islandId) };
});
