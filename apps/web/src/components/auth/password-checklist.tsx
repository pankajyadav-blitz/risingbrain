"use client";

import { Check, X } from "lucide-react";
import { PASSWORD_RULES } from "@/lib/auth/password-policy";

/**
 * Live password-strength checklist. Mirrors the exact rules the backend Zod
 * schema enforces (shared via password-policy), so what the user sees is what
 * the server validates.
 */
export function PasswordChecklist({ value }: { value: string }) {
  return (
    <ul className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
      {PASSWORD_RULES.map((rule) => {
        const passed = rule.test(value);
        return (
          <li
            key={rule.id}
            className={`flex items-center gap-1.5 text-xs transition-colors ${
              passed ? "text-rb-green-300" : "text-muted"
            }`}
          >
            <span
              className={`grid h-4 w-4 shrink-0 place-items-center rounded-full ${
                passed ? "bg-rb-green-500/20" : "bg-surface-2"
              }`}
            >
              {passed ? (
                <Check className="h-3 w-3" strokeWidth={3} />
              ) : (
                <X className="h-3 w-3 text-muted" strokeWidth={2.5} />
              )}
            </span>
            {rule.label}
          </li>
        );
      })}
    </ul>
  );
}
