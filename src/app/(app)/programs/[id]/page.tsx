import { notFound } from "next/navigation";
import { getProgramDetail } from "@/lib/queries/programs";
import { ProgramDetail } from "@/components/programs/ProgramDetail";

/**
 * 공개 프로그램 상세 (SPEC-004 FR-004, FR-011, AC-003, AC-006, AC-007).
 * 존재하지 않거나 soft-delete면 404.
 */
export default async function ProgramDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const program = await getProgramDetail(id);
  if (!program) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-2xl">
      <ProgramDetail program={program} />
    </div>
  );
}
