import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatKrw } from "@/components/studio/MembershipPlanCardList";

/**
 * 프로그램 카드 목록 (SPEC-002).
 */
export interface ProgramCardListProps {
  programs: Array<{
    id: string;
    title: string;
    description?: string | null;
    category?: string | null;
    priceKrw: number;
  }>;
}

export function ProgramCardList({ programs }: ProgramCardListProps) {
  if (programs.length === 0) {
    return <p className="text-sm text-text-muted">아직 프로그램이 없습니다.</p>;
  }
  return (
    <ul className="grid gap-3">
      {programs.map((program) => (
        <li key={program.id}>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="line-clamp-2">{program.title}</CardTitle>
                {program.category ? (
                  <Badge variant="program">
                    {program.category}
                  </Badge>
                ) : null}
              </div>
            </CardHeader>
            {program.description ? (
              <CardContent>
                <p className="line-clamp-3 text-sm leading-5 text-text-muted">
                  {program.description}
                </p>
              </CardContent>
            ) : null}
            <CardContent>
              <p className="text-sm font-bold text-text-default">{formatKrw(program.priceKrw)}</p>
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}
