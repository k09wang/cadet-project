import { listPublicPrograms } from "@/lib/queries/programs";
import { ProgramCard } from "@/components/programs/ProgramCard";

/**
 * 공개 프로그램 탐색 목록 (SPEC-004 FR-003, AC-002, 7장 /programs).
 */
export default async function ProgramsPage() {
  const programs = await listPublicPrograms();

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-heading text-2xl font-bold tracking-tight">프로그램 탐색</h1>
        <p className="text-sm text-muted-foreground">크리에이터가 여는 클럽·챌린지·클래스를 만나보세요.</p>
      </header>

      {programs.length === 0 ? (
        <p className="text-sm text-muted-foreground">아직 공개된 프로그램이 없습니다.</p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <li key={program.id}>
              <ProgramCard program={program} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
