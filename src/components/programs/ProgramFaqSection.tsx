import { formatDate, formatProgramPeriod } from "@/lib/format";
import { formatKrw } from "@/components/studio/MembershipPlanCardList";

export interface ProgramFaqSectionProps {
  priceKrw: number;
  startDate?: Date | string | null;
  endDate?: Date | string | null;
  recruitDeadline?: Date | string | null;
  maxParticipants?: number | null;
}

export function ProgramFaqSection({
  priceKrw,
  startDate,
  endDate,
  recruitDeadline,
  maxParticipants,
}: ProgramFaqSectionProps) {
  const period = formatProgramPeriod(startDate, endDate) ?? "크리에이터 안내에 따라 확정됩니다.";
  const deadline = formatDate(recruitDeadline) ?? "모집 마감 전까지 신청할 수 있습니다.";

  const items = [
    {
      question: "참여 확정은 어떻게 되나요?",
      answer:
        priceKrw > 0
          ? "정원 안에서 신청과 결제가 완료되면 바로 참여가 확정됩니다."
          : "정원 안에서 신청이 완료되면 별도 결제 없이 바로 참여가 확정됩니다.",
    },
    {
      question: "일정과 정원은 어떻게 확인하나요?",
      answer: `${period} 정원은 ${maxParticipants ? `${maxParticipants}명` : "제한 없음"}입니다.`,
    },
    {
      question: "취소와 환불은 어디서 하나요?",
      answer:
        "팬은 내 활동에서 신청을 취소할 수 있고, 유료 결제건은 상태에 따라 환불 또는 정산 보류로 연결됩니다.",
    },
    {
      question: "신청 전에 무엇을 확인해야 하나요?",
      answer: `모집 마감은 ${deadline}이며, 준비물과 세부 운영 방식은 프로그램 설명을 기준으로 확인해 주세요.`,
    },
  ];

  return (
    <section className="rounded-[var(--radius-card)] border border-border-default bg-white p-5">
      <div className="space-y-1">
        <h2 className="font-heading text-lg font-semibold text-text-default">
          참여 전 FAQ
        </h2>
        <p className="text-sm text-text-muted">
          신청 전에 일정, 정원, 취소 기준을 확인하세요.
        </p>
      </div>
      <dl className="mt-4 divide-y divide-border-default">
        {items.map((item) => (
          <div key={item.question} className="grid gap-1 py-3 first:pt-0 last:pb-0">
            <dt className="text-sm font-semibold text-text-default">{item.question}</dt>
            <dd className="text-sm leading-6 text-text-muted">{item.answer}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-4 rounded-lg bg-brand-subtle px-3 py-2 text-xs font-medium text-brand-primary">
        결제 금액: {formatKrw(priceKrw)}
      </p>
    </section>
  );
}
