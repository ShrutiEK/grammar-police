import type { z } from "zod";

import type { learnerAssessmentSchema } from "./assessment.schema";

export type LearnerAssessment = z.infer<typeof learnerAssessmentSchema>;
