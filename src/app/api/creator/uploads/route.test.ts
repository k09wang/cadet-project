import { beforeEach, describe, expect, it, vi } from "vitest";

const mockGetCurrentUser = vi.fn();
vi.mock("@/lib/auth", () => ({ getCurrentUser: (...a: unknown[]) => mockGetCurrentUser(...a) }));

const mockMkdir = vi.fn();
const mockWriteFile = vi.fn();
vi.mock("fs/promises", () => ({
  mkdir: (...a: unknown[]) => mockMkdir(...a),
  writeFile: (...a: unknown[]) => mockWriteFile(...a),
}));

vi.mock("crypto", () => ({
  randomUUID: () => "uuid-1",
}));

import { POST } from "@/app/api/creator/uploads/route";

const CREATOR = { id: "u-1", role: "CREATOR", creatorProfile: { id: "cp-1" } };
const FAN = { id: "fan-1", role: "FAN", creatorProfile: null };

function uploadReq(file?: File) {
  const formData = new FormData();
  if (file) {
    formData.set("file", file);
  }
  return new Request("http://localhost/api/creator/uploads", {
    method: "POST",
    body: formData,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetCurrentUser.mockReset();
  mockMkdir.mockReset();
  mockWriteFile.mockReset();
});

describe("POST /api/creator/uploads", () => {
  it("비로그인은 401을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(null);

    const res = await POST(uploadReq(new File(["image"], "art.png", { type: "image/png" })));

    expect(res.status).toBe(401);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("크리에이터가 아니면 403을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(FAN);

    const res = await POST(uploadReq(new File(["image"], "art.png", { type: "image/png" })));

    expect(res.status).toBe(403);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("이미지 파일을 저장하고 공개 URL을 반환한다", async () => {
    vi.spyOn(Date, "now").mockReturnValue(123456);
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await POST(uploadReq(new File(["image"], "art.png", { type: "image/png" })));

    expect(res.status).toBe(201);
    expect(mockMkdir).toHaveBeenCalledWith(
      expect.stringContaining("public/uploads/creator-assets"),
      { recursive: true },
    );
    expect(mockWriteFile).toHaveBeenCalledWith(
      expect.stringContaining("cp-1-123456-uuid-1.png"),
      expect.any(Buffer),
    );
    expect(await res.json()).toEqual({
      url: "/uploads/creator-assets/cp-1-123456-uuid-1.png",
      contentType: "image/png",
      size: 5,
    });
  });

  it("허용하지 않는 파일 형식은 400을 반환한다", async () => {
    mockGetCurrentUser.mockResolvedValue(CREATOR);

    const res = await POST(uploadReq(new File(["text"], "note.txt", { type: "text/plain" })));

    expect(res.status).toBe(400);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });
});
