import type { ReactNode } from "react";

/**
 * Renders the <strong>…</strong> part of a translated sentence, e.g. the email address in
 * "We sent a link to <strong>{email}</strong>": `t.rich("key", { email, strong: highlight })`.
 */
export function highlight(chunks: ReactNode) {
  return <span className="text-text">{chunks}</span>;
}
