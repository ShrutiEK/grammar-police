import { randomInt } from "node:crypto";

import { StudentAssessment } from "@/features/assessment/components/student-assessment";
import { pictureFilenames } from "@/features/picture-prompt/picture-prompt.data";

export const dynamic = "force-dynamic";

export default function HomePage() {
  const initialPictureFilename =
    pictureFilenames[randomInt(pictureFilenames.length)]!;

  return <StudentAssessment initialPictureFilename={initialPictureFilename} />;
}
