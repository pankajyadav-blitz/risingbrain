import { ContentTabs } from "./content-tabs";
import { NotesMarkdown } from "./notes-markdown";
import type { DomainTopicDetail } from "../_data";

/**
 * One topic's content pane — rendered by the `[topicId]` segment, so it only ever
 * holds the topic in the URL (the lazy split). A header (subject → group → title)
 * over a Notes | Example switch. The markdown is rendered on the SERVER; the only
 * client JS is the tiny tab toggle.
 */
export function TopicView({ topic }: { topic: DomainTopicDetail }) {
  return (
    // Plain content, no card: the surrounding pane in `workspace.tsx` IS the card
    // (see the note there on why only one box may carry the radius).
    <article className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-7 border-b border-border pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-accent">
          {topic.subjectLabel} · {topic.groupLabel}
        </p>
        <h1 className="mt-1.5 text-2xl font-bold tracking-tight text-balance sm:text-[1.75rem]">
          {topic.title}
        </h1>
        {topic.summary ? (
          <p className="mt-2.5 text-base leading-relaxed text-muted">{topic.summary}</p>
        ) : null}
      </div>

      <ContentTabs
        notes={<NotesMarkdown source={topic.notes} />}
        example={topic.example ? <NotesMarkdown source={topic.example} /> : null}
      />
    </article>
  );
}
