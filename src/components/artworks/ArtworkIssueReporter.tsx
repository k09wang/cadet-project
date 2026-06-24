"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ArtworkIssueReporterProps {
  orderId: string;
  disabled?: boolean;
  type?: "NOT_DELIVERED" | "DAMAGED" | "WRONG_ITEM" | "NOT_AS_DESCRIBED" | "REFUND_REQUEST" | "OTHER";
  label?: string;
  title?: string;
  placeholder?: string;
  successMessage?: string;
}

export function ArtworkIssueReporter({
  orderId,
  disabled = false,
  type = "OTHER",
  label = "문제 신고",
  title = "신고 내용",
  placeholder,
  successMessage = "문제 신고가 접수되었습니다.",
}: ArtworkIssueReporterProps) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submitIssue() {
    if (!message.trim()) return;
    setPending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/artwork-orders/${orderId}/issues`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message }),
      });
      if (!res.ok) {
        setResult("문제 신고 접수에 실패했습니다.");
        return;
      }
      setMessage("");
      setOpen(false);
      setResult(successMessage);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        size="xs"
        variant="outline"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </Button>
      {open ? (
        <div className="space-y-2 rounded-[var(--radius-card)] border border-border-default bg-neutral-50 p-3">
          <label className="block text-xs font-medium text-text-muted" htmlFor={`issue-${orderId}`}>
            {title}
          </label>
          <textarea
            id={`issue-${orderId}`}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={3}
            placeholder={placeholder}
            className="w-full rounded-[var(--radius-control)] border border-border-default bg-white px-3 py-2 text-sm outline-none focus:border-brand-primary"
          />
          <Button type="button" size="xs" disabled={pending || !message.trim()} onClick={submitIssue}>
            {pending ? "접수 중" : "접수"}
          </Button>
        </div>
      ) : null}
      {result ? <p className="text-xs text-text-muted">{result}</p> : null}
    </div>
  );
}
