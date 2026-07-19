import {
  pictureConversationAssessmentSchema,
  type PictureConversationAssessment,
} from "./learning-assessment.schema";

export const lessonAssessmentStorageKey = "grammar_police_lesson_assessment";

type LessonAssessmentStorage = Pick<
  Storage,
  "getItem" | "removeItem" | "setItem"
>;

export function saveLessonAssessment(
  assessment: unknown,
  storage: LessonAssessmentStorage = sessionStorage,
) {
  const validatedAssessment =
    pictureConversationAssessmentSchema.parse(assessment);
  storage.setItem(
    lessonAssessmentStorageKey,
    JSON.stringify(validatedAssessment),
  );
}

export function loadLessonAssessment(
  storage: LessonAssessmentStorage = sessionStorage,
): PictureConversationAssessment | null {
  const storedAssessment = storage.getItem(lessonAssessmentStorageKey);
  if (!storedAssessment) return null;

  try {
    return pictureConversationAssessmentSchema.parse(
      JSON.parse(storedAssessment) as unknown,
    );
  } catch (error) {
    storage.removeItem(lessonAssessmentStorageKey);
    throw new Error("The saved learning assessment is invalid.", {
      cause: error,
    });
  }
}
