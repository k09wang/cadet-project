"use client";

import { useEffect, useState } from "react";
import { Toast, ToastContainer } from "@/components/ui/toast";

/**
 * 포스트 작성/임시저장 완료 후 상세 페이지 진입 시 노출되는 완료 토스트.
 * ?created=published|draft 쿼리로 진입했을 때 마운트되며, 일정 시간 후 자동 사라진다.
 */
export function PostCreatedToast({ kind }: { kind: "published" | "draft" }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShow(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  const message =
    kind === "draft"
      ? "임시저장되었습니다. 작성한 포스트를 확인해보세요."
      : "포스트가 작성되었습니다.";

  return (
    <ToastContainer>
      <Toast variant="success" message={message} onClose={() => setShow(false)} />
    </ToastContainer>
  );
}
