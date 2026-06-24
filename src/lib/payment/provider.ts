/**
 * 결제 Provider 추상화 (SPEC-006 FR-006/FR-009/NFR-002/NFR-005 + SPEC-012).
 *
 * `PaymentProvider` 인터페이스는 Mock 외에 PG sandbox(PortOne/Toss) 구현을 허용한다.
 * - `resolvePaymentProvider()`: 환경 변수(`PAYMENT_PROVIDER` + PG 키) 유무로 분기.
 *   키가 모두 있으면 `SandboxPaymentProvider`, 하나라도 없으면 `MockPaymentProvider` 폴백.
 * - Mock 경로는 외부 네트워크 없이 항상 성공(데모/CI/오프라인 안정성, NFR-008).
 * - Sandbox 경로는 결제창 메타 산출 + PG 단건 조회 검증(서버 전용, NFR-002)을 담당.
 *
 * 실제 PG 네트워크 호출(PortOne REST)은 키가 있을 때만 발생하며, 키가 없으면
 * 절대 호출되지 않는다(가짜/우회 폴백 — 사용자 요청에 따른 안전 기본 동작).
 */

export interface ChargeInput {
  /** 계약 결제(SPEC-006) 컨텍스트. 단건 포스트 결제 시 생략. */
  contractId?: string;
  /** 단건 PAID 포스트 결제(SPEC-009 NFR-006) 컨텍스트. 계약 결제 시 생략. */
  postId?: string;
  /** 선착순 프로그램 신청 결제(SPEC-015) 컨텍스트. */
  programApplicationId?: string;
  /** 작품 주문 결제(SPEC-015) 컨텍스트. */
  artworkOrderId?: string;
  amount: number;
}

export interface PaymentResult {
  success: boolean;
  provider: string;
  /** Mock 거래 식별자 — 실제 PG txId 자리표시자. */
  providerTxId: string;
  amount: number;
}

/** 결제 요청(주문) 메타 — 클라이언트가 PG 결제창을 호출할 때 사용 (SPEC-012 FR-005). */
export interface PaymentRequestMeta {
  merchantUid: string;
  amount: number;
  productName: string;
  provider: string;
  /** 결제창 SDK 호출용 파라미터(sandbox). Mock 폴밭 시 빈 객체. */
  paymentParams: Record<string, string>;
}

/** PG 단건 조회 검증 결과 (SPEC-012 FR-011). */
export interface VerificationResult {
  /** PG가 보고한 주문번호 — 서버 저장값과 대조. */
  merchantUid: string;
  /** PG가 보고한 결제 금액 — Payment.amount와 정확 일치해야 한다. */
  amount: number;
  /** PG 결제 상태("paid" | "cancelled" | "ready" | "failed"). */
  status: string;
}

export interface PaymentProvider {
  readonly name: string;
  /** Mock 전용 즉시 결제(SPEC-006 호환). sandbox는 사용하지 않는다. */
  charge(input: ChargeInput): Promise<PaymentResult>;
  /** 결제 요청 메타 산출 (SPEC-012 FR-005). */
  createRequest(input: ChargeInput & { productName: string }): PaymentRequestMeta;
  /** PG 단건 조회 검증 (SPEC-012 FR-011). sandbox 전용. */
  verifyPayment(providerTxId: string): Promise<VerificationResult>;
}

/**
 * Mock 결제 Provider (SPEC-006 FR-006/NFR-002 + SPEC-012 FR-015 폴백).
 *
 * 외부 네트워크/파일 IO에 의존하지 않고 항상 성공을 반환한다 (데모 안정성).
 * 환경 변수 없이 동작한다 (NFR-004). merchantUid는 결정론적 nonce로 발급한다.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly name = "mock";
  private sequence = 0;

  async charge(input: ChargeInput): Promise<PaymentResult> {
    this.sequence += 1;
    return {
      success: true,
      provider: this.name,
      providerTxId: `mock_${input.contractId ?? input.postId ?? input.programApplicationId ?? input.artworkOrderId ?? "txn"}_${Date.now()}_${this.sequence}`,
      amount: input.amount,
    };
  }

  createRequest(input: ChargeInput & { productName: string }): PaymentRequestMeta {
    const merchantUid = issueMerchantUid(
      input.contractId ?? input.postId ?? input.programApplicationId ?? input.artworkOrderId ?? "order",
    );
    return {
      merchantUid,
      amount: input.amount,
      productName: input.productName,
      provider: this.name,
      paymentParams: {},
    };
  }

  /** Mock은 검증을 항상 즉시 성공 처리한다 (FR-015). 외부 PG 호출 없음. */
  async verifyPayment(_providerTxId: string): Promise<VerificationResult> {
    // Mock 콜백 페이로드는 merchantUid/amount를 전달할 수 없으므로,
    // 실제 검증은 서비스 계층에서 서버 보관값을 기준으로 수행한다(신뢰: 서버).
    // 여기서는 "paid" 상태만 반환한다.
    return {
      merchantUid: "",
      amount: 0,
      status: "paid",
    };
  }
}

/**
 * PortOne(구 아임포트) sandbox 결제 Provider (SPEC-012 FR-001).
 *
 * 키(`PORTONE_API_SECRET` 등)가 설정된 경우에만 활성화. 결제창 메타 산출과
 * 서버 측 단건 조회 검증(`/payments/{imp_uid}` REST)을 수행한다.
 *
 * @MX:WARN: 실제 PG 네트워크 호출 경계 — 키가 없으면 resolvePaymentProvider가 Mock을 반환하므로 본 경로는 미진입.
 * @MX:REASON: 외부 결제 API 호출이므로 자격 증명 누출/과금 방지를 위해 환경 변수 분기로만 활성화한다.
 */
export class SandboxPaymentProvider implements PaymentProvider {
  readonly name: string;
  private readonly storeId: string;
  private readonly channelKey: string;
  private readonly apiSecret: string;
  private readonly pgKind: "portone" | "toss";

  constructor(opts: {
    pgKind: "portone" | "toss";
    storeId: string;
    channelKey: string;
    apiSecret: string;
  }) {
    this.pgKind = opts.pgKind;
    this.name = opts.pgKind;
    this.storeId = opts.storeId;
    this.channelKey = opts.channelKey;
    this.apiSecret = opts.apiSecret;
  }

  charge(_input: ChargeInput): Promise<PaymentResult> {
    // sandbox 경로는 즉시 결제(charge)를 사용하지 않는다 — createRequest + verifyPayment 흐름.
    throw new Error("SandboxPaymentProvider does not support direct charge; use createRequest + verifyPayment");
  }

  createRequest(input: ChargeInput & { productName: string }): PaymentRequestMeta {
    const merchantUid = issueMerchantUid(
      input.contractId ?? input.postId ?? input.programApplicationId ?? input.artworkOrderId ?? "order",
    );
    return {
      merchantUid,
      amount: input.amount,
      productName: input.productName,
      provider: this.name,
      // 클라이언트 SDK(@portone/browser-sdk) 결제창 호출용 공개 식별자.
      // 서버 시크릿(apiSecret)은 여기에 절대 포함하지 않는다 (FR-017).
      paymentParams: {
        storeId: this.storeId,
        channelKey: this.channelKey,
        pg: this.pgKind === "toss" ? "tosspayments" : "",
      },
    };
  }

  /**
   * PG 단건 조회 검증 (SPEC-012 FR-011, NFR-002).
   *
   * PortOne REST API로 imp_uid(providerTxId) 단건 조회 후
   * { merchantUid, amount, status }를 반환한다. 서비스 계층이 서버 보관값과 대조한다.
   * 네트워크 실패 시 검증 실패로 처리한다(결제를 확정하지 않는다).
   */
  async verifyPayment(providerTxId: string): Promise<VerificationResult> {
    try {
      const res = await fetch("https://api.portone.io/payments/" + encodeURIComponent(providerTxId), {
        method: "GET",
        headers: {
          Authorization: `PortOne ${this.apiSecret}`,
        },
      });
      if (!res.ok) {
        return { merchantUid: "", amount: -1, status: "failed" };
      }
      const data = (await res.json()) as {
        merchantId?: string;
        storeId?: string;
        // PortOne v2 응답 스키마는 버전별 상이 — 안전한 접근을 위해 옵셔널로.
        amount?: { total?: number };
        status?: string;
        // 하위 호환(v1/아임포트 호환 필드)
        merchant_uid?: string;
        amount_value?: number;
      };
      const amount = data.amount?.total ?? data.amount_value ?? -1;
      const merchantUid = data.merchant_uid ?? "";
      const status = data.status ?? "failed";
      return { merchantUid, amount, status };
    } catch {
      // 네트워크/파싱 실패는 검증 실패로 취급(결제 확정 금지).
      return { merchantUid: "", amount: -1, status: "failed" };
    }
  }
}

/**
 * 앱 전역 주문번호(merchantUid) 발급 (SPEC-012 FR-005, NFR-004 멱등).
 * 형식: `order_{scope}_{timestamp}_{seq}` — 충분한 엔트로피로 충돌 회피.
 */
let merchantSeq = 0;
export function issueMerchantUid(scope: string): string {
  merchantSeq += 1;
  return `order_${scope}_${Date.now()}_${merchantSeq}`;
}

/** 현재 설정된 결제 Provider 이름(환경 변수 기반). 사용자가 "가짜/폴밭"을 원하면 "mock". */
let cachedProvider: PaymentProvider | null = null;

/**
 * 결제 Provider 해석 (SPEC-012 FR-002/FR-003/FR-004).
 *
 * - `PAYMENT_PROVIDER`가 "portone"|"toss"이고 해당 PG 키가 모두 있으면 SandboxPaymentProvider.
 * - 그 외(미설정/키 누락)는 MockPaymentProvider 폴밭.
 *
 * 캐싱: 프로세스 내에서 동일 인스턴스 재사용(시퀀스 안정).
 */
export function resolvePaymentProvider(): PaymentProvider {
  if (cachedProvider) return cachedProvider;

  const kind = process.env.PAYMENT_PROVIDER;
  if (kind === "portone") {
    const storeId = process.env.NEXT_PUBLIC_PORTONE_STORE_ID ?? "";
    const channelKey = process.env.NEXT_PUBLIC_PORTONE_CHANNEL_KEY ?? "";
    const apiSecret = process.env.PORTONE_API_SECRET ?? "";
    if (storeId && channelKey && apiSecret) {
      cachedProvider = new SandboxPaymentProvider({
        pgKind: "portone",
        storeId,
        channelKey,
        apiSecret,
      });
      return cachedProvider;
    }
  }
  if (kind === "toss") {
    const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY ?? "";
    const secretKey = process.env.TOSS_SECRET_KEY ?? "";
    if (clientKey && secretKey) {
      // Toss도 동일 sandbox 인터페이스로 추상화(단건 조회 엔드포인트는 verifyPayment에서 분기 가능).
      cachedProvider = new SandboxPaymentProvider({
        pgKind: "toss",
        storeId: clientKey,
        channelKey: clientKey,
        apiSecret: secretKey,
      });
      return cachedProvider;
    }
  }

  cachedProvider = new MockPaymentProvider();
  return cachedProvider;
}

/** 테스트/시드용: 캐시 초기화(환경 변수 변경 반영). */
export function __resetPaymentProviderCache(): void {
  cachedProvider = null;
}

/** 기본 결제 Provider 인스턴스 — SPEC-006/009 호환(직접 charge 호출부). */
export const mockPaymentProvider: PaymentProvider = new MockPaymentProvider();
