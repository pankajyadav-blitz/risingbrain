import { BookOpen, Sigma, type LucideIcon } from "lucide-react";
import { QuestionCard } from "./question-card";
import { TopicProgressBar } from "./topic-progress-bar";
import { PaperAttemptProvider } from "./paper-attempt";
import { SubmitBar, TopRetakeButton } from "./submit-bar";
import type { AptPaper } from "../_data";

function NoteBox({
  icon: Icon,
  title,
  body,
  mono = false,
}: {
  icon: LucideIcon;
  title: string;
  body: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-surface-2 p-3.5">
      <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-accent">
        <Icon className="h-3.5 w-3.5" /> {title}
      </p>
      <p
        className={`whitespace-pre-line text-sm leading-relaxed text-muted ${mono ? "font-mono" : ""}`}
      >
        {body}
      </p>
    </div>
  );
}

/**
 * One topic's exam paper. Rendered by the `[topicId]` segment — so it only ever
 * holds the questions for the topic in the URL (the lazy split). The header bar
 * and per-question dots stay live via the shared progress provider.
 */
export function Paper({ paper }: { paper: AptPaper }) {
  return (
    <div className="glass rounded-3xl p-5 sm:p-7">
      {/* Whole paper shares one attempt so the header's Retake button can react
          to submission state alongside the questions and bottom SubmitBar. */}
      <PaperAttemptProvider
        topicId={paper.topicId}
        questionIds={paper.questions.map((q) => q.id)}
      >
        {/* Header */}
        <div className="mb-6 border-b border-border pb-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-accent">
            {paper.categoryName}
          </p>
          <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-xl font-bold tracking-tight sm:text-2xl">{paper.topicName}</h3>
            <div className="flex shrink-0 items-center gap-3">
              <span className="text-sm text-muted">
                {paper.questions.length} question{paper.questions.length === 1 ? "" : "s"}
              </span>
              <TopRetakeButton />
            </div>
          </div>
          <TopicProgressBar topicId={paper.topicId} total={paper.questions.length} />
        </div>

        {/* Theory / formulae */}
        {paper.theory || paper.formula ? (
          <div className="mb-6 grid gap-3 sm:grid-cols-2">
            {paper.theory ? <NoteBox icon={BookOpen} title="Theory" body={paper.theory} /> : null}
            {paper.formula ? (
              <NoteBox icon={Sigma} title="Key formulae" body={paper.formula} mono />
            ) : null}
          </div>
        ) : null}

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
      </PaperAttemptProvider>
    </div>
  );
}
