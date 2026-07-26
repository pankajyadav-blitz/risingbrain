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
    <article className="glass rounded-3xl p-5 sm:p-7">
      {/* Header */}
      <div className="mb-6 border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-accent">
          {topic.subjectLabel} · {topic.groupLabel}
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{topic.title}</h1>
        {topic.summary ? <p className="mt-2 text-sm text-muted">{topic.summary}</p> : null}
      </div>

      <ContentTabs
        notes={<NotesMarkdown source={topic.notes} />}
        example={topic.example ? <NotesMarkdown source={topic.example} /> : null}
      />
    </article>
  );
}
