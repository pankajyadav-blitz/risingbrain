"use client";

import * as React from "react";

/**
 * Six-box one-time-code input. Auto-advances on type, supports backspace,
 * arrow-key navigation, and pasting the full code at once. Reports the joined
 * value up via onChange and fires onComplete when all six digits are present.
 */
export function OtpInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete?: (code: string) => void;
  disabled?: boolean;
}) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = React.useMemo(() => {
    const arr = value.split("").slice(0, 6);
    while (arr.length < 6) arr.push("");
    return arr;
  }, [value]);

  function setAt(index: number, char: string) {
    const next = digits.slice();
    next[index] = char;
    const joined = next.join("").slice(0, 6);
    onChange(joined);
    if (joined.length === 6 && !joined.includes("") && onComplete) onComplete(joined);
  }

  function handleChange(index: number, raw: string) {
    const char = raw.replace(/\D/g, "").slice(-1);
    if (!char) return;
    setAt(index, char);
    if (index < 5) refs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[index]) {
        setAt(index, "");
      } else if (index > 0) {
        refs.current[index - 1]?.focus();
        setAt(index - 1, "");
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      refs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      refs.current[index + 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;
    onChange(pasted);
    const focusIndex = Math.min(pasted.length, 5);
    refs.current[focusIndex]?.focus();
    if (pasted.length === 6 && onComplete) onComplete(pasted);
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="One-time code">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          aria-label={`Digit ${i + 1}`}
          className="glass-pill h-14 w-full rounded-xl text-center text-xl font-semibold text-foreground outline-none transition focus:ring-2 focus:ring-ring disabled:opacity-60"
        />
      ))}
    </div>
  );
}
