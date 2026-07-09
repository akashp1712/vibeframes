"use client";

import { useRef } from "react";
import { TEMPLATES } from "@/remotion/templates";

/** The prompt composer — textarea + send, with starter templates when empty. */
export function Composer({
  value,
  onChange,
  onSubmit,
  busy,
  showSuggestions,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  busy: boolean;
  showSuggestions: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const submit = () => {
    if (!value.trim() || busy) return;
    onSubmit();
  };

  return (
    <div className="studio-composer">
      {showSuggestions && (
        <div className="studio-templates">
          <div className="studio-templates-label">Start from a template</div>
          <div className="studio-template-grid">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                className="studio-template"
                onClick={() => onChange(t.prompt)}
                disabled={busy}
              >
                <span className="studio-template-name">{t.label}</span>
                <span className="studio-template-blurb">{t.blurb}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="studio-composer-box">
        <textarea
          ref={ref}
          className="studio-input"
          rows={2}
          value={value}
          disabled={busy}
          placeholder="Describe the video you want…"
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <div className="studio-composer-actions">
          <span className="studio-hint">⏎ to direct · ⇧⏎ new line</span>
          <button className="studio-send" onClick={submit} disabled={busy || !value.trim()}>
            {busy ? "Directing…" : "Direct →"}
          </button>
        </div>
      </div>
    </div>
  );
}
