import { describe, expect, it } from "vitest";
import {
  artworkCreateSchema,
  artworkUpdateSchema,
  creatorWorkCreateSchema,
  creatorWorkUpdateSchema,
} from "./artwork";

describe("artwork validation", () => {
  it("판매 작품 생성은 내부 업로드 이미지 경로를 허용한다", () => {
    const parsed = artworkCreateSchema.parse({
      title: "원화",
      priceKrw: 120000,
      imageUrl: "/uploads/creator-assets/cp-1-art.png",
    });

    expect(parsed.imageUrl).toBe("/uploads/creator-assets/cp-1-art.png");
  });

  it("판매 작품 수정은 내부 업로드 이미지 경로와 제거 값을 허용한다", () => {
    expect(
      artworkUpdateSchema.parse({ imageUrl: "/uploads/creator-assets/cp-1-art.webp" }).imageUrl,
    ).toBe("/uploads/creator-assets/cp-1-art.webp");
    expect(artworkUpdateSchema.parse({ imageUrl: "" }).imageUrl).toBeNull();
  });

  it("작업물 생성/수정도 내부 업로드 이미지 경로를 허용한다", () => {
    expect(
      creatorWorkCreateSchema.parse({
        title: "개인전",
        imageUrl: "/uploads/creator-assets/cp-1-work.jpg",
      }).imageUrl,
    ).toBe("/uploads/creator-assets/cp-1-work.jpg");
    expect(
      creatorWorkUpdateSchema.parse({ imageUrl: "/uploads/creator-assets/cp-1-work.gif" }).imageUrl,
    ).toBe("/uploads/creator-assets/cp-1-work.gif");
  });

  it("임의의 상대 경로는 이미지 URL로 허용하지 않는다", () => {
    expect(() =>
      artworkCreateSchema.parse({
        title: "원화",
        priceKrw: 120000,
        imageUrl: "/private/file.png",
      }),
    ).toThrow();
  });
});
