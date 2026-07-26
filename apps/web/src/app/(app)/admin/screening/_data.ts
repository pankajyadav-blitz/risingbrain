import { prisma } from "@/lib/db";

/**
 * Full screening (quiz) tree for the admin editor — NOT cached and, unlike the
 * public `getAptitudeTopic()` loader, it DOES include `answerKey`/`explanation`
 * (the public loader deliberately strips them so the answer key never reaches a
 * candidate's browser; the admin editor legitimately needs them).
 */
export async function getAdminQuizTree() {
  return prisma.quizCategory.findMany({
    orderBy: { order: "asc" },
    select: {
      id: true,
      kind: true,
      slug: true,
      name: true,
      order: true,
      topics: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          slug: true,
          name: true,
          theory: true,
          formula: true,
          order: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              prompt: true,
              options: true,
              answerKey: true,
              explanation: true,
              hint: true,
              difficulty: true,
              order: true,
            },
          },
        },
      },
    },
  });
}

export type AdminQuizTree = Awaited<ReturnType<typeof getAdminQuizTree>>;
export type AdminQuizCategory = AdminQuizTree[number];
export type AdminQuizTopic = AdminQuizCategory["topics"][number];
export type AdminQuizQuestion = AdminQuizTopic["questions"][number];
export type QuizOption = { key: string; label: string };
