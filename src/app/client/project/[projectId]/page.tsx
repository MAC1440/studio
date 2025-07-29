
import ClientProjectView from '@/components/client/ClientProjectView';

// This is a Server Component. It can directly access params.
export default function ClientProjectBoardPage({ params }: { params: { projectId: string } }) {
  return (
    <div className="flex flex-col h-full bg-background">
      <main className="flex-1 overflow-hidden">
        {/* We pass the projectId to the ClientProjectView component, which is a Client Component */}
        <ClientProjectView projectId={params.projectId} />
      </main>
    </div>
  );
}
