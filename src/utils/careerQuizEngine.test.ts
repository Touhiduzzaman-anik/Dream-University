import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAREER_QUIZ_QUESTIONS,
  WHATSAPP_CONTACT_URL,
  WHATSAPP_PHONE_DISPLAY,
  evaluateCareerQuiz,
  resolveUniversitiesForTrack,
} from './careerQuizEngine';

function buildUniformAnswers(optionIndex: 0 | 1 | 2 | 3): Record<number, string> {
  const answers: Record<number, string> = {};
  for (const q of CAREER_QUIZ_QUESTIONS) {
    answers[q.id] = q.options[optionIndex].id;
  }
  return answers;
}

test('career quiz engine contains 30 bilingual progressive questions across 3 sections', () => {
  assert.equal(CAREER_QUIZ_QUESTIONS.length, 30);

  const ids = CAREER_QUIZ_QUESTIONS.map((q) => q.id);
  assert.deepEqual(
    ids,
    Array.from({ length: 30 }, (_, idx) => idx + 1)
  );

  const sections = new Set(CAREER_QUIZ_QUESTIONS.map((q) => q.section));
  assert.deepEqual([...sections].sort(), ['future_jobs', 'interests', 'work_style']);

  for (const q of CAREER_QUIZ_QUESTIONS) {
    assert.ok(q.promptEn.trim().length > 10);
    assert.ok(q.promptBn.trim().length > 10);
    assert.equal(q.options.length, 4);
    for (const opt of q.options) {
      assert.ok(opt.labelEn.trim().length > 4);
      assert.ok(opt.labelBn.trim().length > 4);
      assert.ok(opt.traitTagEn.trim().length > 4);
      assert.ok(opt.traitTagBn.trim().length > 4);
      assert.ok(Object.keys(opt.weights).length >= 1);
    }
  }
});

test('evaluateCareerQuiz ranks CSE #1 when tech/coding options are selected across all 30 questions', () => {
  const answers = buildUniformAnswers(0);
  const result = evaluateCareerQuiz(answers);

  assert.equal(result.answeredCount, 30);
  assert.equal(result.totalQuestions, 30);
  assert.equal(result.topSubjects.length, 4);
  assert.equal(result.topSubjects[0].id, 'cse');
  assert.ok(result.topSubjects[0].matchPercentage >= 80 && result.topSubjects[0].matchPercentage <= 98);
  assert.ok(result.dominantTraitsEn.length >= 1);
});

test('evaluateCareerQuiz ranks Medical & Pharmacy in top 2 for healthcare/lab responses', () => {
  const answers: Record<number, string> = {};
  for (const q of CAREER_QUIZ_QUESTIONS) {
    const bioOption =
      q.options.find((o) => (o.weights.medical ?? 0) >= 4 || (o.weights.pharmacy ?? 0) >= 4) ??
      q.options[1];
    answers[q.id] = bioOption.id;
  }

  const result = evaluateCareerQuiz(answers);
  const topIds = result.topSubjects.slice(0, 2).map((m) => m.id);
  assert.ok(topIds.includes('medical'));
  assert.ok(topIds.includes('pharmacy'));
});

test('evaluateCareerQuiz ranks BBA & Economics in top 2 for finance/business responses', () => {
  const answers: Record<number, string> = {};
  for (const q of CAREER_QUIZ_QUESTIONS) {
    const bizOption =
      q.options.find((o) => (o.weights.bba ?? 0) >= 4 || (o.weights.economics ?? 0) >= 4) ??
      q.options[2];
    answers[q.id] = bizOption.id;
  }

  const result = evaluateCareerQuiz(answers);
  const topIds = result.topSubjects.slice(0, 2).map((m) => m.id);
  assert.ok(topIds.includes('bba'));
  assert.ok(topIds.includes('economics'));
});

test('top 4 matches include bounded percentages, personalized fit, job outlook, and real BD universities', () => {
  const answers = buildUniformAnswers(3);
  const result = evaluateCareerQuiz(answers);

  assert.equal(result.topSubjects.length, 4);
  for (let i = 0; i < result.topSubjects.length; i += 1) {
    const subject = result.topSubjects[i];
    assert.ok(subject.matchPercentage >= 25 && subject.matchPercentage <= 98);
    if (i > 0) {
      assert.ok(result.topSubjects[i - 1].matchPercentage >= subject.matchPercentage);
    }
    assert.ok(subject.whyItFitsEn.trim().length > 25);
    assert.ok(subject.whyItFitsBn.trim().length > 20);
    assert.ok(subject.jobOutlookEn.includes('2026–2035'));
    assert.ok(subject.jobOutlookBn.includes('২০২৬–২০৩৫'));
    assert.ok(subject.topUniversities.length >= 3);
  }

  assert.equal(WHATSAPP_PHONE_DISPLAY, '01753653351');
  assert.ok(WHATSAPP_CONTACT_URL.startsWith('https://wa.me/8801753653351?text='));
  assert.ok(resolveUniversitiesForTrack(['BUET', 'DU', 'NSU']).length === 3);
});
