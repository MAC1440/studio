
import AuthGuard from "@/components/auth/AuthGuard";
import AppHeader from "@/components/layout/header";

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // This guard now allows ANY authenticated user to access the project view.
    // The component itself will handle showing the correct data.
    <AuthGuard>
      <div className="flex flex-col h-screen w-screen bg-background">
        <AppHeader />
        <main className="flex-1 overflow-hidden">
            {children}
        </main>
      </div>
    </AuthGuard>
  );
}
