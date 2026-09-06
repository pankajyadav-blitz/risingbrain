import type { InterviewVerdict, Difficulty } from "@risingbrain/database/enums";

/** Shape passed from the listing server component into the client feed. */
export interface FeedExperience {
  id: string;
  /** URL segment — hrefs use this; the id stays the key for API calls. */
  slug: string;
  company: string;
  role: string;
  verdict: InterviewVerdict;
  difficulty: Difficulty;
  roundsCount: number;
  title: string;
  excerpt: string | null;
  tags: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
  /** Relative time computed on the server (avoids a client-side Date.now() hydration mismatch). */
  createdAtLabel: string;
  author: { name: string | null; image: string | null };
  liked: boolean;
}

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string;
  /** Relative time computed on the server (avoids a client-side Date.now() hydration mismatch). */
  createdAtLabel: string;
  author: { name: string | null; image: string | null };
}
