import { getAdminQuizTree } from "./_data";
import { QuizManager } from "./_components/quiz-manager";

/** Screening (quiz) admin editor — server-fetch the full tree, edit on the client. */
export default async function AdminScreeningPage() {
  const tree = await getAdminQuizTree();
  return <QuizManager tree={tree} />;
}
