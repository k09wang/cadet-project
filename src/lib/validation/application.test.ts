import { describe, expect, it } from "vitest";
import {
  applySchema,
  processSchema,
  type ApplyInput,
  type ProcessInput,
} from "./application";

describe("validation/application (SPEC-005)", () => {
  describe("applySchema", () => {
    it("빈 메시지는 유효 (optional)", () => {
      const result = applySchema.safeParse({ message: "" });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.message).toBe("");
      }
    });

    it("message 없어도 유효 (optional)", () => {
      const result = applySchema.safeParse({});
      expect(result.success).toBe(true);
    });

    it("1000자 이내 메시지는 유효", () => {
      const result = applySchema.safeParse({ message: "a".repeat(1000) });
      expect(result.success).toBe(true);
    });

    it("1000자 초과 시 유효성 실패", () => {
      const result = applySchema.safeParse({ message: "a".repeat(1001) });
      expect(result.success).toBe(false);
    });

    it("string 타입 검증", () => {
      const result = applySchema.safeParse({ message: 123 });
      expect(result.success).toBe(false);
    });
  });

  describe("processSchema", () => {
    it("cancel 액션은 유효", () => {
      const result = processSchema.safeParse({ action: "cancel" });
      expect(result.success).toBe(true);
    });

    it("remove 액션은 유효", () => {
      const result = processSchema.safeParse({ action: "remove" });
      expect(result.success).toBe(true);
    });

    it("removedReason은 optional", () => {
      const result = processSchema.safeParse({
        action: "remove",
        removedReason: "운영 사유",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.removedReason).toBe("운영 사유");
      }
    });

    it("잘못된 액션은 실패", () => {
      const result = processSchema.safeParse({ action: "approve" });
      expect(result.success).toBe(false);
    });

    it("action 필수", () => {
      const result = processSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("레거시 accept/reject 액션은 실패", () => {
      expect(processSchema.safeParse({ action: "accept" }).success).toBe(false);
      expect(processSchema.safeParse({ action: "reject" }).success).toBe(false);
    });
  });

  describe("타입 export", () => {
    it("ApplyInput 타입이 존재", () => {
      const input: ApplyInput = { message: "test" };
      expect(input).toBeDefined();
    });

    it("ProcessInput 타입이 존재", () => {
      const input: ProcessInput = { action: "cancel" };
      expect(input).toBeDefined();
    });
  });
});
