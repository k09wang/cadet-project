import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { DesignSystemShowcase } from "@/components/design-system/DesignSystemShowcase";

export const metadata: Metadata = {
  title: "ArtBridge Design System",
  description: "ArtBridge 디자인 시스템 foundations와 컴포넌트 기준 페이지",
};

export default function DesignSystemPage() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-canvas">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <DesignSystemShowcase />
      </main>
      <Footer />
    </div>
  );
}
