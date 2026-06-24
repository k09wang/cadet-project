"use client";

import type { ProgramStatus } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { effectiveStatus, PROGRAM_STATUS_LABELS } from "@/lib/program-status";

/**
 * 프로그램 생성/수정 폼 (SPEC-004 FR-001, FR-006, 7장 ProgramForm).
 * - 생성/수정 모두 상태 직접 선택 없이 일정 기준으로 자동 계산한다.
 */
export interface ProgramFormInitial {
  title: string;
  description?: string | null;
  priceKrw: number;
  category?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  recruitDeadline?: string | null;
  maxParticipants?: number | null;
  status: ProgramStatus;
}

interface ProgramFormProps {
  action: (formData: FormData) => void | Promise<void>;
  initial?: ProgramFormInitial;
  mode?: "create" | "edit";
  submitLabel?: string;
}

function field(value: string | null | undefined): string {
  return value ?? "";
}

export function ProgramForm({ action, initial, mode = "create", submitLabel }: ProgramFormProps) {
  const computedStatus = effectiveStatus({
    status: initial?.status ?? "RECRUITING",
    startDate: initial?.startDate,
    endDate: initial?.endDate,
    recruitDeadline: initial?.recruitDeadline,
  });

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="title">
          제목
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={field(initial?.title)}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="예: 4주 드로잉 챌린지"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium" htmlFor="description">
          설명
        </label>
        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={field(initial?.description)}
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="프로그램 소개를 입력하세요"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="priceKrw">
            가격 (원)
          </label>
          <input
            id="priceKrw"
            name="priceKrw"
            type="number"
            min={0}
            required
            defaultValue={initial ? String(initial.priceKrw) : ""}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="35000"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="category">
            카테고리
          </label>
          <input
            id="category"
            name="category"
            type="text"
            defaultValue={field(initial?.category)}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="예: 클래스"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="startDate">
            시작일
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            defaultValue={field(initial?.startDate)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="endDate">
            종료일
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            defaultValue={field(initial?.endDate)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="recruitDeadline">
            모집 마감일
          </label>
          <input
            id="recruitDeadline"
            name="recruitDeadline"
            type="date"
            defaultValue={field(initial?.recruitDeadline)}
            className="w-full rounded border px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium" htmlFor="maxParticipants">
            모집 인원
          </label>
          <input
            id="maxParticipants"
            name="maxParticipants"
            type="number"
            min={1}
            defaultValue={initial?.maxParticipants != null ? String(initial.maxParticipants) : ""}
            className="w-full rounded border px-3 py-2 text-sm"
            placeholder="20"
          />
        </div>
      </div>

      <div className="rounded-lg border border-border-default bg-neutral-50 px-3 py-2 text-sm">
        <p className="font-medium text-text-default">
          현재 상태: {PROGRAM_STATUS_LABELS[computedStatus]}
        </p>
        <p className="mt-1 text-xs text-text-muted">
          상태는 모집 마감일, 시작일, 종료일을 기준으로 자동 업데이트됩니다.
        </p>
      </div>

      <Button type="submit">{submitLabel ?? (mode === "edit" ? "수정 저장" : "프로그램 만들기")}</Button>
    </form>
  );
}
