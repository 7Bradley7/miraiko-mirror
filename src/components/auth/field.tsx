"use client";

import { useId } from "react";

type FieldProps = {
  label: string;
  name: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  minLength?: number;
  hint?: string;
};

/** Labelled input used by every authentication form. */
export function Field({ label, name, type, autoComplete, minLength, hint }: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="text-muted block text-sm">
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required
        minLength={minLength}
        maxLength={type === "password" ? 128 : 254}
        aria-describedby={hint ? `${id}-hint` : undefined}
        className="border-line bg-night text-text placeholder:text-subtle focus:border-amber w-full rounded-xl border px-4 py-3 outline-none"
      />
      {hint && (
        <p id={`${id}-hint`} className="text-subtle text-xs">
          {hint}
        </p>
      )}
    </div>
  );
}
