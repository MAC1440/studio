import AppHeader from '@/components/layout/header';
import KanbanBoard from '@/components/kanban/board';

export default function ProjectBoardPage({ params }: { params: { projectId: string } }) {
  return (
    <div className="flex flex-col h-screen bg-background">
      <AppHeader />
      <main className="flex-1 overflow-hidden">
        <KanbanBoard projectId={params.projectId} />
      </main>
    </div>
  );
}
