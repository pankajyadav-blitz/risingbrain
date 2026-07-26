"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Layers, Folder, CircleHelp, Plus, Trash2 } from "lucide-react";
import { QuizKind, Difficulty } from "@risingbrain/database/enums";
import { Field, TextInput, TextArea, NumberInput, Select, Section } from "../../_components/fields";
import { TreeRow, AddButton, CountBadge } from "../../_components/tree";
import { EditorFrame, EditorEmpty } from "../../_components/editor-frame";
import { ManagerShell } from "../../_components/manager-shell";
import { ConfirmDialog } from "../../_components/confirm-dialog";
import { adminMutate } from "../../_lib/mutate";
import type { AdminQuizTree, QuizOption } from "../_data";

type NodeType = "category" | "topic" | "question";
type Sel = { type: NodeType; id: string } | null;

const ENDPOINT: Record<NodeType, string> = {
  category: "/api/admin/quiz/category",
  topic: "/api/admin/quiz/topic",
  question: "/api/admin/quiz/question",
};
const ENTITY: Record<NodeType, string> = {
  category: "quizCategory",
  topic: "quizTopic",
  question: "quizQuestion",
};
const eq = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

const KINDS = [
  { value: QuizKind.APTITUDE, label: "Aptitude" },
  { value: QuizKind.LOGICAL_REASONING, label: "Logical reasoning" },
  { value: QuizKind.PUZZLE, label: "Puzzle" },
];
const DIFFICULTIES = [
  { value: "", label: "— none —" },
  { value: Difficulty.EASY, label: "Easy" },
  { value: Difficulty.MEDIUM, label: "Medium" },
  { value: Difficulty.HARD, label: "Hard" },
];

function toOptions(raw: unknown): QuizOption[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((o): o is QuizOption => !!o && typeof o === "object" && "key" in o && "label" in o)
    .map((o) => ({ key: String(o.key), label: String(o.label) }));
}

export function QuizManager({ tree }: { tree: AdminQuizTree }) {
  const router = useRouter();
  const [selected, setSelected] = useState<Sel>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const refresh = () => startTransition(() => router.refresh());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  async function create(type: NodeType, body: object, parentId?: string) {
    const r = await adminMutate<{ id: string }>("POST", ENDPOINT[type], body);
    if (r.ok) {
      if (parentId) setExpanded((prev) => new Set(prev).add(parentId));
      setSelected({ type, id: r.data.id });
      refresh();
    }
  }

  async function reorder(type: NodeType, aId: string, bId: string) {
    const r = await adminMutate("POST", "/api/admin/reorder", { entity: ENTITY[type], aId, bId });
    if (r.ok) refresh();
  }

  function resolve(): { node: object; siblings: { id: string }[]; crumbs: string[] } | null {
    if (!selected) return null;
    if (selected.type === "category") {
      const node = tree.find((c) => c.id === selected.id);
      return node ? { node, siblings: tree, crumbs: [] } : null;
    }
    for (const cat of tree) {
      if (selected.type === "topic") {
        const node = cat.topics.find((t) => t.id === selected.id);
        if (node) return { node, siblings: cat.topics, crumbs: [cat.name] };
      }
      for (const topic of cat.topics) {
        if (selected.type === "question") {
          const node = topic.questions.find((q) => q.id === selected.id);
          if (node) return { node, siblings: topic.questions, crumbs: [cat.name, topic.name] };
        }
      }
    }
    return null;
  }

  const resolved = resolve();
  const move = (type: NodeType, id: string, siblings: { id: string }[]) => {
    const i = siblings.findIndex((s) => s.id === id);
    return {
      onMoveUp: i > 0 ? () => void reorder(type, id, siblings[i - 1]!.id) : undefined,
      onMoveDown: i >= 0 && i < siblings.length - 1 ? () => void reorder(type, id, siblings[i + 1]!.id) : undefined,
    };
  };
  const onDone = (sel?: null) => {
    if (sel === null) setSelected(null);
    refresh();
  };

  const sidebar = (
    <>
      {tree.map((cat) => (
        <div key={cat.id}>
          <TreeRow
            label={cat.name}
            icon={Layers}
            depth={0}
            active={selected?.type === "category" && selected.id === cat.id}
            expandable={cat.topics.length > 0}
            expanded={expanded.has(cat.id)}
            onToggle={() => toggle(cat.id)}
            onSelect={() => setSelected({ type: "category", id: cat.id })}
            badge={<CountBadge>{cat.topics.length}</CountBadge>}
          />
          {expanded.has(cat.id) &&
            cat.topics.map((topic) => (
              <div key={topic.id}>
                <TreeRow
                  label={topic.name}
                  icon={Folder}
                  depth={1}
                  active={selected?.type === "topic" && selected.id === topic.id}
                  expandable={topic.questions.length > 0}
                  expanded={expanded.has(topic.id)}
                  onToggle={() => toggle(topic.id)}
                  onSelect={() => setSelected({ type: "topic", id: topic.id })}
                  badge={<CountBadge>{topic.questions.length}</CountBadge>}
                />
                {expanded.has(topic.id) &&
                  topic.questions.map((q, i) => (
                    <TreeRow
                      key={q.id}
                      label={`${i + 1}. ${q.prompt.slice(0, 40)}`}
                      icon={CircleHelp}
                      depth={2}
                      active={selected?.type === "question" && selected.id === q.id}
                      onSelect={() => setSelected({ type: "question", id: q.id })}
                    />
                  ))}
                <AddButton
                  label="Add question"
                  depth={1}
                  onClick={() =>
                    void create(
                      "question",
                      {
                        topicId: topic.id,
                        prompt: "New question",
                        options: [
                          { key: "a", label: "Option A" },
                          { key: "b", label: "Option B" },
                        ],
                        answerKey: "a",
                      },
                      topic.id,
                    )
                  }
                />
              </div>
            ))}
          <AddButton
            label="Add topic"
            depth={0}
            onClick={() => void create("topic", { categoryId: cat.id, name: "New topic" }, cat.id)}
          />
        </div>
      ))}
    </>
  );

  return (
    <ManagerShell
      sidebarTitle="Screening"
      sidebarAction={
        <button
          type="button"
          onClick={() => void create("category", { kind: QuizKind.APTITUDE, name: "New category" })}
          className="btn-glow inline-flex items-center gap-1 rounded-full bg-rb-green-500 px-3 py-1.5 text-xs font-semibold text-black"
        >
          <Plus className="h-3.5 w-3.5" /> Category
        </button>
      }
      sidebar={sidebar}
      hasSelection={!!selected}
      onBack={() => setSelected(null)}
      detail={
        !resolved || !selected ? (
          <EditorEmpty
            icon={CircleHelp}
            title="Nothing selected"
            message="Pick a category, topic or question from the list — or add a new one."
          />
        ) : selected.type === "category" ? (
          <CategoryEditor
            key={selected.id}
            node={resolved.node as AdminQuizTree[number]}
            onDone={onDone}
            {...move("category", selected.id, resolved.siblings)}
          />
        ) : selected.type === "topic" ? (
          <TopicEditor
            key={selected.id}
            node={resolved.node as AdminQuizTree[number]["topics"][number]}
            crumbs={resolved.crumbs}
            onDone={onDone}
            {...move("topic", selected.id, resolved.siblings)}
          />
        ) : (
          <QuestionEditor
            key={selected.id}
            node={resolved.node as AdminQuizTree[number]["topics"][number]["questions"][number]}
            crumbs={resolved.crumbs}
            onDone={onDone}
            {...move("question", selected.id, resolved.siblings)}
          />
        )
      }
    />
  );
}

type Move = { onMoveUp?: () => void; onMoveDown?: () => void };
type Done = { onDone: (sel?: null) => void };
type Crumbs = { crumbs?: string[] };

function CategoryEditor({ node, onDone, onMoveUp, onMoveDown }: { node: AdminQuizTree[number] } & Move & Done) {
  const initial = { kind: node.kind, name: node.name, order: node.order };
  const [form, setForm] = useState(initial);
  const [ui, setUi] = useState({ saving: false, saved: false, error: null as string | null, confirming: false, deleting: false });
  const dirty = !eq(form, initial);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setUi((u) => ({ ...u, saved: false }));
  };

  async function save() {
    setUi((u) => ({ ...u, saving: true, error: null }));
    const r = await adminMutate("PATCH", ENDPOINT.category, { id: node.id, ...form });
    setUi((u) => ({ ...u, saving: false, saved: r.ok, error: r.ok ? null : r.error }));
    if (r.ok) onDone();
  }
  async function remove() {
    setUi((u) => ({ ...u, deleting: true }));
    const r = await adminMutate("DELETE", ENDPOINT.category, { id: node.id });
    setUi((u) => ({ ...u, deleting: false, confirming: false, error: r.ok ? null : r.error }));
    if (r.ok) onDone(null);
  }

  return (
    <>
      <EditorFrame
        eyebrow="Category"
        icon={Layers}
        title={node.name || "Untitled category"}
        dirty={dirty}
        saving={ui.saving}
        saved={ui.saved}
        error={ui.error}
        onSave={() => void save()}
        onReset={() => setForm(initial)}
        onDelete={() => setUi((u) => ({ ...u, confirming: true }))}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      >
        <Section title="Details" cols={2}>
          <Field label="Name" required>
            <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Kind" required>
            <Select value={form.kind} onChange={(v) => set("kind", v as QuizKind)} options={KINDS} />
          </Field>
          <Field label="Order" hint="lower shows first">
            <NumberInput value={form.order} onChange={(e) => set("order", Number(e.target.value) || 0)} />
          </Field>
        </Section>
      </EditorFrame>
      <ConfirmDialog
        open={ui.confirming}
        title="Delete this category?"
        message={`This permanently deletes “${node.name}” and all ${node.topics.length} topic(s) and their questions.`}
        busy={ui.deleting}
        onConfirm={() => void remove()}
        onCancel={() => setUi((u) => ({ ...u, confirming: false }))}
      />
    </>
  );
}

function TopicEditor({
  node,
  crumbs,
  onDone,
  onMoveUp,
  onMoveDown,
}: { node: AdminQuizTree[number]["topics"][number] } & Move & Done & Crumbs) {
  const initial = { name: node.name, theory: node.theory ?? "", formula: node.formula ?? "", order: node.order };
  const [form, setForm] = useState(initial);
  const [ui, setUi] = useState({ saving: false, saved: false, error: null as string | null, confirming: false, deleting: false });
  const dirty = !eq(form, initial);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setUi((u) => ({ ...u, saved: false }));
  };

  async function save() {
    setUi((u) => ({ ...u, saving: true, error: null }));
    const r = await adminMutate("PATCH", ENDPOINT.topic, { id: node.id, ...form });
    setUi((u) => ({ ...u, saving: false, saved: r.ok, error: r.ok ? null : r.error }));
    if (r.ok) onDone();
  }
  async function remove() {
    setUi((u) => ({ ...u, deleting: true }));
    const r = await adminMutate("DELETE", ENDPOINT.topic, { id: node.id });
    setUi((u) => ({ ...u, deleting: false, confirming: false, error: r.ok ? null : r.error }));
    if (r.ok) onDone(null);
  }

  return (
    <>
      <EditorFrame
        eyebrow="Topic"
        breadcrumb={crumbs}
        icon={Folder}
        title={node.name || "Untitled topic"}
        dirty={dirty}
        saving={ui.saving}
        saved={ui.saved}
        error={ui.error}
        onSave={() => void save()}
        onReset={() => setForm(initial)}
        onDelete={() => setUi((u) => ({ ...u, confirming: true }))}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      >
        <Section title="Details" cols={2}>
          <Field label="Name" required>
            <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} />
          </Field>
          <Field label="Order" hint="lower shows first">
            <NumberInput value={form.order} onChange={(e) => set("order", Number(e.target.value) || 0)} />
          </Field>
        </Section>
        <Section title="Theory & formulae" description="Markdown — rendered as the “Notes” tab above the questions.">
          <Field label="Theory" hint="topic notes / diagrams — shown as the Notes tab">
            <TextArea value={form.theory} onChange={(e) => set("theory", e.target.value)} className="min-h-[200px]" />
          </Field>
          <Field label="Formula" hint="key formulae">
            <TextArea value={form.formula} onChange={(e) => set("formula", e.target.value)} />
          </Field>
        </Section>
      </EditorFrame>
      <ConfirmDialog
        open={ui.confirming}
        title="Delete this topic?"
        message={`This permanently deletes “${node.name}” and all ${node.questions.length} question(s).`}
        busy={ui.deleting}
        onConfirm={() => void remove()}
        onCancel={() => setUi((u) => ({ ...u, confirming: false }))}
      />
    </>
  );
}

function QuestionEditor({
  node,
  crumbs,
  onDone,
  onMoveUp,
  onMoveDown,
}: { node: AdminQuizTree[number]["topics"][number]["questions"][number] } & Move & Done & Crumbs) {
  const initial = {
    prompt: node.prompt,
    options: toOptions(node.options),
    answerKey: node.answerKey,
    explanation: node.explanation ?? "",
    hint: node.hint ?? "",
    difficulty: (node.difficulty ?? "") as string,
    order: node.order,
  };
  const [form, setForm] = useState(initial);
  const [ui, setUi] = useState({ saving: false, saved: false, error: null as string | null, confirming: false, deleting: false });
  const dirty = !eq(form, initial);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setUi((u) => ({ ...u, saved: false }));
  };

  function setOption(i: number, patch: Partial<QuizOption>) {
    set("options", form.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o)));
  }
  function addOption() {
    const used = new Set(form.options.map((o) => o.key));
    const key = "abcdefgh".split("").find((c) => !used.has(c)) ?? String(form.options.length + 1);
    set("options", [...form.options, { key, label: "" }]);
  }
  function removeOption(i: number) {
    const removed = form.options[i];
    const next = form.options.filter((_, idx) => idx !== i);
    setForm((f) => ({
      ...f,
      options: next,
      answerKey: removed?.key === f.answerKey ? (next[0]?.key ?? "") : f.answerKey,
    }));
    setUi((u) => ({ ...u, saved: false }));
  }

  async function save() {
    if (form.options.length < 2) {
      setUi((u) => ({ ...u, error: "Add at least two options." }));
      return;
    }
    if (!form.options.some((o) => o.key === form.answerKey)) {
      setUi((u) => ({ ...u, error: "Mark one option as the correct answer." }));
      return;
    }
    setUi((u) => ({ ...u, saving: true, error: null }));
    const payload = {
      id: node.id,
      prompt: form.prompt,
      options: form.options,
      answerKey: form.answerKey,
      explanation: form.explanation,
      hint: form.hint,
      order: form.order,
      ...(form.difficulty ? { difficulty: form.difficulty } : {}),
    };
    const r = await adminMutate("PATCH", ENDPOINT.question, payload);
    setUi((u) => ({ ...u, saving: false, saved: r.ok, error: r.ok ? null : r.error }));
    if (r.ok) onDone();
  }
  async function remove() {
    setUi((u) => ({ ...u, deleting: true }));
    const r = await adminMutate("DELETE", ENDPOINT.question, { id: node.id });
    setUi((u) => ({ ...u, deleting: false, confirming: false, error: r.ok ? null : r.error }));
    if (r.ok) onDone(null);
  }

  return (
    <>
      <EditorFrame
        eyebrow="Question"
        breadcrumb={crumbs}
        icon={CircleHelp}
        title={node.prompt.slice(0, 60) || "Question"}
        dirty={dirty}
        saving={ui.saving}
        saved={ui.saved}
        error={ui.error}
        onSave={() => void save()}
        onReset={() => setForm(initial)}
        onDelete={() => setUi((u) => ({ ...u, confirming: true }))}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
      >
        <Section title="Question">
          <Field label="Prompt" required hint="markdown">
            <TextArea value={form.prompt} onChange={(e) => set("prompt", e.target.value)} />
          </Field>
        </Section>

        <Section title="Options" description="Select the radio next to the correct answer.">
          <div className="space-y-2">
            {form.options.map((o, i) => {
              const correct = form.answerKey === o.key;
              return (
                <div
                  key={i}
                  className={cnRow(correct)}
                >
                  <input
                    type="radio"
                    name="answerKey"
                    aria-label={`Mark option ${o.key} correct`}
                    checked={correct}
                    onChange={() => set("answerKey", o.key)}
                    className="h-4 w-4 shrink-0 accent-rb-green-500"
                  />
                  <input
                    value={o.key}
                    onChange={(e) => setOption(i, { key: e.target.value })}
                    aria-label="Option key"
                    className="w-10 shrink-0 rounded-lg border border-border bg-surface/60 px-1 py-2 text-center text-sm font-semibold text-foreground outline-none focus:border-rb-green-500/60"
                  />
                  <input
                    value={o.label}
                    onChange={(e) => setOption(i, { label: e.target.value })}
                    aria-label="Option label"
                    placeholder="Option text"
                    className="min-w-0 flex-1 rounded-lg border border-border bg-surface/60 px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-rb-green-500/60"
                  />
                  <button
                    type="button"
                    aria-label="Remove option"
                    onClick={() => removeOption(i)}
                    disabled={form.options.length <= 2}
                    className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-muted transition-colors hover:text-rose-500 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
            <button
              type="button"
              onClick={addOption}
              disabled={form.options.length >= 8}
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-accent hover:bg-rb-green-500/10 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" /> Add option
            </button>
          </div>
        </Section>

        <Section title="Help & meta">
          <Field label="Explanation" hint="shown after submit">
            <TextArea value={form.explanation} onChange={(e) => set("explanation", e.target.value)} />
          </Field>
          <Field label="Hint" hint="method nudge — never the answer">
            <TextInput value={form.hint} onChange={(e) => set("hint", e.target.value)} className="font-sans" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Difficulty">
              <Select value={form.difficulty} onChange={(v) => set("difficulty", v)} options={DIFFICULTIES} />
            </Field>
            <Field label="Order" hint="lower shows first">
              <NumberInput value={form.order} onChange={(e) => set("order", Number(e.target.value) || 0)} />
            </Field>
          </div>
        </Section>
      </EditorFrame>
      <ConfirmDialog
        open={ui.confirming}
        title="Delete this question?"
        message="This permanently deletes the question."
        busy={ui.deleting}
        onConfirm={() => void remove()}
        onCancel={() => setUi((u) => ({ ...u, confirming: false }))}
      />
    </>
  );
}

/** Row styling for an option — highlighted when it's the correct answer. */
function cnRow(correct: boolean) {
  return [
    "flex items-center gap-2 rounded-xl border p-1.5 transition-colors",
    correct ? "border-rb-green-500/40 bg-rb-green-500/5" : "border-transparent",
  ].join(" ");
}
