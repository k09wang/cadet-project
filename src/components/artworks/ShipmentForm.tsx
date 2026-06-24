"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

interface ShipmentFormProps {
  orderId: string;
}

export function ShipmentForm({ orderId }: ShipmentFormProps) {
  const [carrier, setCarrier] = useState("");
  const [trackingNo, setTrackingNo] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function submitShipment() {
    if (!carrier.trim() || !trackingNo.trim()) return;
    setPending(true);
    setResult(null);
    try {
      const res = await fetch(`/api/artwork-orders/${orderId}/shipment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ carrier, trackingNo }),
      });
      if (!res.ok) {
        setResult("발송 처리에 실패했습니다.");
        return;
      }
      setResult("발송 처리되었습니다.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
      <input
        value={carrier}
        onChange={(event) => setCarrier(event.target.value)}
        placeholder="택배사"
        className="h-10 rounded-[var(--radius-control)] border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
      />
      <input
        value={trackingNo}
        onChange={(event) => setTrackingNo(event.target.value)}
        placeholder="송장번호"
        className="h-10 rounded-[var(--radius-control)] border border-border-default px-3 text-sm outline-none focus:border-brand-primary"
      />
      <Button
        type="button"
        size="sm"
        disabled={pending || !carrier.trim() || !trackingNo.trim()}
        onClick={submitShipment}
      >
        {pending ? "처리 중" : "발송 처리"}
      </Button>
      {result ? <p className="text-xs text-text-muted sm:col-span-3">{result}</p> : null}
    </div>
  );
}
