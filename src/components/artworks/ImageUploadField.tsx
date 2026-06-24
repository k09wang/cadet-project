"use client";

import { useRef, useState } from "react";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";

type UploadState = "idle" | "uploading" | "error";

export function ImageUploadField({
  name,
  defaultValue,
  label,
}: {
  name: string;
  defaultValue?: string | null;
  label: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(defaultValue ?? "");
  const [previewUrl, setPreviewUrl] = useState(defaultValue ?? "");
  const [state, setState] = useState<UploadState>("idle");

  async function uploadFile(file: File) {
    setState("uploading");
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    const formData = new FormData();
    formData.set("file", file);
    const res = await fetch("/api/creator/uploads", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      URL.revokeObjectURL(objectUrl);
      setPreviewUrl(imageUrl);
      setState("error");
      return;
    }

    const body = (await res.json()) as { url: string };
    URL.revokeObjectURL(objectUrl);
    setImageUrl(body.url);
    setPreviewUrl(body.url);
    setState("idle");
  }

  function clearImage() {
    setImageUrl("");
    setPreviewUrl("");
    setState("idle");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="grid gap-2">
      <input type="hidden" name={name} value={imageUrl} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-text-default">{label}</p>
        {imageUrl ? (
          <Button type="button" size="xs" variant="ghost" onClick={clearImage}>
            <X className="size-4" />
            제거
          </Button>
        ) : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
        <div
          className="flex aspect-square items-center justify-center rounded-[var(--radius-card)] border border-border-default bg-surface-subtle bg-cover bg-center text-xs text-text-muted"
          style={previewUrl ? { backgroundImage: `url("${previewUrl}")` } : undefined}
          aria-label={`${label} 미리보기`}
        >
          {previewUrl ? null : "미리보기"}
        </div>
        <div className="flex min-w-0 flex-col justify-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            className="sr-only"
            onChange={(event) => {
              const file = event.currentTarget.files?.[0];
              if (file) void uploadFile(file);
            }}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={state === "uploading"}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" />
            {state === "uploading" ? "업로드 중" : "이미지 선택"}
          </Button>
          <p className="text-xs text-text-muted">JPG, PNG, WebP, GIF · 최대 5MB</p>
          {state === "error" ? <p className="text-xs text-danger">이미지 업로드에 실패했습니다.</p> : null}
        </div>
      </div>
    </div>
  );
}
