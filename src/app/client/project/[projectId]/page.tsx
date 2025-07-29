
import AppHeader from '@/components/layout/header';
import KanbanBoard from '@/components/kanban/board';

export default function ClientProjectBoardPage({ params }: { params: { projectId: string } }) {
  // This will render the same board component, but the AuthGuard and data fetching logic
  // within the component can be adapted to provide a read-only view for clients.
  // For the MVP, we can reuse the board and later create a client-specific view if needed.
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* The AppHeader is part of the client layout already */}
      <main className="flex-1 overflow-hidden">
        <KanbanBoard projectId={params.projectId} />
      </main>
    </div>
  );
}
