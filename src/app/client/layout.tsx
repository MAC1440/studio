
import AuthGuard from "@/components/auth/AuthGuard";
import AppHeader from "@/components/layout/header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard role="client">
      <div className="flex flex-col h-screen w-screen">
        <AppHeader />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="container mx-auto">
            {children}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
