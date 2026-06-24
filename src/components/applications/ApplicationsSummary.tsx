"use client";

import { useState } from "react";
import {
  MyApplicationItem,
  type MyApplicationItemData,
} from "@/components/applications/MyApplicationItem";

/**
 * 팬 홈의 진행 중인 신청 요약 — 기본 2개만 노출하고 나머지는 접기/펼치기.
 */
export function ApplicationsSummary({
  applications,
}: {
  applications: MyApplicationItemData[];
}) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_COUNT = 2;
  const visible = expanded ? applications : applications.slice(0, COLLAPSED_COUNT);
  const hiddenCount = applications.length - COLLAPSED_COUNT;

  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {visible.map((app) => (
          <MyApplicationItem key={app.id} application={app} />
        ))}
      </ul>
      {hiddenCount > 0 && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="text-sm font-medium text-brand-primary hover:underline"
        >
          {expanded ? "접기" : `${hiddenCount}개 더 보기`}
        </button>
      )}
    </div>
  );
}
