import { ContentTabs } from "./content-tabs";
import { NotesMarkdown } from "./notes-markdown";
import { PracticeAttemptProvider } from "./practice-attempt";
import { DomainQuestionCard } from "./question-card";
import { SubmitBar, TopRetakeButton } from "./submit-bar";
import { TopicProgressBar } from "./topic-progress-bar";
import type { DomainTopicDetail } from "../_data";

/**
 * One topic's content pane — rendered by the `[topicId]` segment, so it only ever
 * holds the topic in the URL (the lazy split). A header (subject → group → title)
 * over a Notes | Practice switch. The markdown is rendered on the SERVER; the
 * client JS is the tab toggle and the practice attempt.
 */
export function TopicView({ topic }: { topic: DomainTopicDetail }) {
  const questions = topic.questions;

  const practice =
    questions.length > 0 ? (
      <>
        {/* Questions — paper style */}
        <ol className="divide-y divide-border/60">
          {questions.map((q, i) => (
            <li key={q.id}>
              <DomainQuestionCard question={q} index={i + 1} />
            </li>
          ))}
        </ol>
        <SubmitBar />
      </>
    ) : null;

  return (
    // Plain content, no card and no frame inset: horizontal gutters come from the
    // page <Container>, the scrollbar gutter from the pane in `workspace.tsx`. Only
    // a bottom gutter is ours, so the last line isn't flush to the scroll end.
    <article className="pb-10">
      {/* The whole topic shares one attempt, so the header's Retake button can
          react to submission state alongside the questions and the SubmitBar. */}
      <PracticeAttemptProvider topicId={topic.id} questionIds={questions.map((q) => q.id)}>
        {/* Header */}
        <div className="mb-7 border-b border-border pb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
            {topic.subjectLabel} · {topic.groupLabel}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem]">
              {topic.title}
            </h1>
            <TopRetakeButton />
          </div>
          {topic.summary ? (
            <p className="mt-2.5 text-base leading-relaxed text-muted">{topic.summary}</p>
          ) : null}
          <TopicProgressBar topicId={topic.id} total={questions.length} />
        </div>

        <ContentTabs
          notes={<NotesMarkdown source={topic.notes} />}
          practice={practice}
          questionCount={questions.length}
        />
      </PracticeAttemptProvider>
    </article>
  );
}
