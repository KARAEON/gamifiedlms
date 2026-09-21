import { getAssessmentForLesson } from '../config/content.js';

export function getPostGameAssessment(lessonId) {
  return getAssessmentForLesson(lessonId);
}

export function startPostGameAssessment(scene, {
  islandId,
  quarterId,
  majorId,
  lessonId,
  returnScrollY = 0,
  minigameResult,
  minigameScore = 0,
}) {
  const assessment = getPostGameAssessment(lessonId);
  if (!assessment) {
    scene.scene.start('QuarterDetailScene', {
      islandId,
      quarterId,
      scrollY: returnScrollY,
    });
    return;
  }

  scene.scene.start('AssessmentScene', {
    islandId,
    quarterId,
    majorId,
    lessonId,
    assessmentId: assessment.id,
    returnScrollY,
    minigameResult,
    minigameScore,
  });
}

export function getPostGameAssessmentLabel(lessonId) {
  const assessment = getPostGameAssessment(lessonId);
  if (!assessment) {
    return 'CONTINUE';
  }

  return assessment.type === 'summative' ? 'START ST' : 'START FT';
}
