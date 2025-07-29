
'use client';

import { useState, useEffect } from 'react';
import { getProject } from '@/lib/firebase/projects';
import { getTickets } from '@/lib/firebase/tickets';
import { type Project, type Ticket } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, BarChart, FileText, GanttChartSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ClientProjectView({ projectId }: { projectId: string }) {
  const [project, setProject] = useState<Project | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeView, setActiveView] = useState('progress');

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [projectData, ticketData] = await Promise.all([
          getProject(projectId),
          getTickets({ projectId }),
        ]);
        setProject(projectData);
        setTickets(ticketData);
      } catch (error) {
        console.error("Failed to fetch project data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [projectId]);

  if (isLoading) {
    return (
      <div className="p-4 md:p-6">
        <Skeleton className="h-8 w-64 mb-4" />
        <div className="flex gap-6">
          <div className="w-1/4">
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="w-3/4">
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return <div>Project not found.</div>;
  }
  
  const inProgressTickets = tickets.filter(t => t.status === 'in-progress' || t.status === 'review');
  const doneTickets = tickets.filter(t => t.status === 'done');


  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-4 p-4 md:px-6 border-b">
         <Button variant="outline" size="sm" asChild>
            <Link href="/client">
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Projects
            </Link>
        </Button>
        <h1 className="text-xl font-semibold text-foreground truncate">{project.name}</h1>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <nav className="w-64 border-r p-4">
          <ul className="space-y-2">
            <li>
              <Button
                variant={activeView === 'progress' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('progress')}
              >
                <GanttChartSquare className="mr-2 h-4 w-4"/>
                Progress
              </Button>
            </li>
            <li>
              <Button
                 variant={activeView === 'invoices' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('invoices')}
              >
                <FileText className="mr-2 h-4 w-4"/>
                Invoices
              </Button>
            </li>
            <li>
              <Button
                variant={activeView === 'proposals' ? 'secondary' : 'ghost'}
                className="w-full justify-start"
                onClick={() => setActiveView('proposals')}
              >
                 <BarChart className="mr-2 h-4 w-4"/>
                Proposals
              </Button>
            </li>
          </ul>
        </nav>
        <main className="flex-1 overflow-auto p-6">
          {activeView === 'progress' && (
            <div>
              <h2 className="text-2xl font-bold mb-4">In Progress</h2>
              <div className="border rounded-lg mb-8">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {inProgressTickets.length > 0 ? inProgressTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell>{ticket.title}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{ticket.status.replace('-', ' ')}</Badge></TableCell>
                                <TableCell><Badge variant={ticket.priority === 'high' || ticket.priority === 'critical' ? 'destructive' : 'secondary'} className="capitalize">{ticket.priority}</Badge></TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No tasks in progress.</TableCell></TableRow>}
                    </TableBody>
                </Table>
              </div>

              <h2 className="text-2xl font-bold mb-4">Completed</h2>
               <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Task</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Priority</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {doneTickets.length > 0 ? doneTickets.map(ticket => (
                            <TableRow key={ticket.id}>
                                <TableCell>{ticket.title}</TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{ticket.status.replace('-', ' ')}</Badge></TableCell>
                                <TableCell><Badge variant="secondary" className="capitalize">{ticket.priority}</Badge></TableCell>
                            </TableRow>
                        )) : <TableRow><TableCell colSpan={3} className="text-center h-24">No tasks completed yet.</TableCell></TableRow>}
                    </TableBody>
                </Table>
              </div>
            </div>
          )}
           {activeView === 'invoices' && (
             <div className="text-center text-muted-foreground p-8">
                 <FileText className="mx-auto h-12 w-12 mb-4" />
                 <h3 className="text-xl font-semibold">Invoicing Coming Soon</h3>
                 <p>This section will show all invoices related to this project.</p>
             </div>
           )}
           {activeView === 'proposals' && (
              <div className="text-center text-muted-foreground p-8">
                <BarChart className="mx-auto h-12 w-12 mb-4" />
                <h3 className="text-xl font-semibold">Proposals Coming Soon</h3>
                <p>This section will display project proposals and contracts.</p>
            </div>
           )}
        </main>
      </div>
    </div>
  );
}
