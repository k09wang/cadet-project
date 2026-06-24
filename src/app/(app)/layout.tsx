import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

/**
 * Layout for authenticated app routes (dashboard, creators, notifications, …).
 * Renders the global header with the current user, role badge, and logout
 * (SPEC-001 FR-006, FR-007). Protection from unauthenticated access is handled
 * by middleware (FR-005), so this layout assumes a session exists.
 */
export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</div>
      <Footer />
    </div>
  );
}
