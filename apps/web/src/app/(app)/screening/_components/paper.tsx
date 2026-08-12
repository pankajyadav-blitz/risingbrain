import { QuestionCard } from "./question-card";
import { TopicProgressBar } from "./topic-progress-bar";
import { PaperAttemptProvider } from "./paper-attempt";
import { SubmitBar, TopRetakeButton } from "./submit-bar";
import { PaperTabs } from "./paper-tabs";
import { NotesMarkdown } from "./notes-markdown";
import type { AptPaper } from "../_data";

/**
 * One topic's exam paper. Rendered by the `[topicId]` segment — so it only ever
 * holds the questions for the topic in the URL (the lazy split). The header bar
 * and per-question dots stay live via the shared progress provider.
 *
 * Inside the header, the body is a Notes | Practice switch (`PaperTabs`): the
 * learner lands on the topic's notes (theory + diagrams, rendered from markdown
 * held in `QuizTopic.theory`) and flips to the graded questions when ready.
 */
export function Paper({ paper }: { paper: AptPaper }) {
  const practice = (
    <>
      {/* Questions — paper style */}
      <ol className="divide-y divide-border/60">
        {paper.questions.map((q, i) => (
          <li key={q.id}>
            <QuestionCard
              question={{
                id: q.id,
                prompt: q.prompt,
                options: q.options,
                difficulty: q.difficulty,
                hint: q.hint,
              }}
              index={i + 1}
            />
          </li>
        ))}
      </ol>
      <SubmitBar />
    </>
  );

  return (
    // Plain content, no card: the surrounding pane in `workspace.tsx` IS the card
    // (see the note there on why only one box may carry the radius).
    <div className="p-6 sm:p-8">
      {/* Whole paper shares one attempt so the header's Retake button can react
          to submission state alongside the questions and bottom SubmitBar. */}
      <PaperAttemptProvider
        topicId={paper.topicId}
        questionIds={paper.questions.map((q) => q.id)}
      >
        {/* Header */}
        <div className="mb-7 border-b border-border pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
            {paper.categoryName}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem]">
              {paper.topicName}
            </h3>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm text-muted">
                {paper.questions.length} question{paper.questions.length === 1 ? "" : "s"}
              </span>
              <TopRetakeButton />
            </div>
          </div>
          <TopicProgressBar topicId={paper.topicId} total={paper.questions.length} />
        </div>

        <PaperTabs
          questionCount={paper.questions.length}
          notes={paper.theory ? <NotesMarkdown source={paper.theory} /> : null}
          practice={practice}
        />
      </PaperAttemptProvider>
    </div>
  );
}
