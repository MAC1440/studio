
'use client';

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { type Column, type ColumnId, type Ticket } from '@/lib/types';
import KanbanColumn from './column';
import TicketDetails from './ticket-details';
import { Dialog } from '@/components/ui/dialog';
import { getTickets, updateTicketStatus } from '@/lib/firebase/tickets';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { getProject } from '@/lib/firebase/projects';
import Link from 'next/link';
import { Button } from '../ui/button';
import { ArrowLeft, User as UserIcon, Inbox } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';


const initialColumns: Column[] = [
  { id: 'backlog', title: 'Sprint Backlog', tickets: [] },
  { id: 'todo', title: 'To Do', tickets: [] },
  { id: 'in-progress', title: 'In Progress', tickets: [] },
  { id: 'review', title: 'Review', tickets: [] },
  { id: 'done', title: 'Done', tickets: [] },
];

export default function KanbanBoard({ projectId }: { projectId: string }) {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const { toast } = useToast();
  const { user, userData, users, ticketReloadKey } = useAuth();
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  
  useEffect(() => {
    if(user) {
        // Default to showing all users tickets, not just the logged in user
        setAssigneeFilter('all');
    }
  }, [user]);

  const fetchBoardData = async () => {
      if (!userData?.organizationId) return;
      setIsLoading(true);
      try {
        const [tickets, projectData] = await Promise.all([
          getTickets({ projectId, organizationId: userData.organizationId }),
          getProject(projectId)
        ]);
        
        setAllTickets(tickets);

        if(!projectData) {
            toast({
              title: "Project not found",
              description: "The project you are looking for does not exist.",
              variant: "destructive"
            });
            // Consider redirecting here
            setProjectName("Project Not Found");
        } else {
            setProjectName(projectData.name);
        }

      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        toast({
          title: "Error",
          description: "Could not fetch board data from the database.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

  useEffect(() => {
    if (userData?.organizationId) {
        fetchBoardData();
    }
  }, [projectId, toast, ticketReloadKey, userData?.organizationId]);
  
  useEffect(() => {
    const filteredTickets = assigneeFilter === 'all'
        ? allTickets
        : allTickets.filter(ticket => ticket.assignedTo?.id === assigneeFilter);

    const newColumns = initialColumns.map(c => ({...c, tickets: [] as Ticket[]}));
    
    filteredTickets.forEach(ticket => {
        const columnIndex = newColumns.findIndex(col => col.id === ticket.status);
        if (columnIndex !== -1) {
        newColumns[columnIndex].tickets.push(ticket);
        } else {
            // If status is invalid, put it in the backlog
        newColumns[0].tickets.push(ticket);
        }
    });

    setColumns(newColumns);
  }, [allTickets, assigneeFilter]);


  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumn = (id: ColumnId | string): Column | undefined => {
    if (columns.find(c => c.id === id)) {
        return columns.find(c => c.id === id);
    }
    return columns.find((col) => col.tickets.some((t) => t.id === id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    const activeColumn = findColumn(activeId);
    let overColumn = findColumn(overId);

    if (!activeColumn) return;

    // If dropping on a column directly
    if (columns.some(c => c.id === overId)) {
        overColumn = columns.find(c => c.id === overId);
    }

    if (!overColumn) return;

    // We need to update allTickets, as it's the source of truth
    const newAllTickets = allTickets.map(t => 
        t.id === activeId ? { ...t, status: overColumn!.id as ColumnId } : t
    );
    setAllTickets(newAllTickets);


    setColumns((prev) => {
      const activeItems = activeColumn.tickets;
      const overItems = overColumn.tickets;
      const activeIndex = activeItems.findIndex((t) => t.id === activeId);
      let newColumns = [...prev];

      if (activeColumn.id === overColumn.id) {
        // Same column
        const overIndex = overItems.findIndex(t => t.id === overId);
        if (activeIndex === -1 || overIndex === -1) return prev;
        
        const newTickets = arrayMove(activeItems, activeIndex, overIndex);
        const activeColIndex = newColumns.findIndex(c => c.id === activeColumn.id);
        newColumns[activeColIndex] = { ...activeColumn, tickets: newTickets };
      } else {
        // Different columns
        const [movedItem] = activeItems.splice(activeIndex, 1);
        if (!movedItem) {
          // Item not found, something went wrong. Revert state to be safe.
          return prev;
        }
        movedItem.status = overColumn.id;

        const isDroppingOnTicket = overItems.some(t => t.id === overId);
        
        if (isDroppingOnTicket) {
             const overIndex = overItems.findIndex(t => t.id === overId);
             overItems.splice(overIndex, 0, movedItem);
        } else {
             overItems.push(movedItem);
        }
        
        const activeColIndex = newColumns.findIndex(c => c.id === activeColumn.id);
        const overColIndex = newColumns.findIndex(c => c.id === overColumn.id);

        newColumns[activeColIndex] = { ...activeColumn, tickets: [...activeItems] };
        newColumns[overColIndex] = { ...overColumn, tickets: [...overItems] };
      }
      
      // Persist change to Firebase after local state updates
      updateTicketStatus(activeId, overColumn.id).catch(err => {
            console.error("Failed to update ticket status:", err);
            toast({
                title: "Update Failed",
                description: "Could not update ticket status. Please try again.",
                variant: "destructive"
            });
            // Revert on failure
            setAllTickets(allTickets); 
        });

      return newColumns;
    });
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setIsTicketDetailOpen(true);
  };
  
  const handleTicketDetailClose = () => {
    setIsTicketDetailOpen(false);
    setSelectedTicket(null);
  }

  const onTicketUpdate = async (isDeleted = false) => {
    await fetchBoardData();
    if(isDeleted) {
        handleTicketDetailClose();
    } else if (selectedTicket && userData?.organizationId) {
      // Find the updated ticket in the refreshed list
      const refreshedTickets = await getTickets({ projectId, organizationId: userData.organizationId });
      const freshTicket = refreshedTickets.find(t => t.id === selectedTicket?.id);
      if(freshTicket) {
        setSelectedTicket(freshTicket);
      } else {
        // Ticket was likely deleted
        handleTicketDetailClose();
      }
    }
  }

  const backLinkHref = userData?.role === 'client' ? '/client' : '/board';
  const hasTicketsOnBoard = columns.some(c => c.tickets.length > 0);

  return (
    <>
    <Dialog open={isTicketDetailOpen} onOpenChange={handleTicketDetailClose}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex flex-col h-full w-full">
            <div className="flex items-center gap-4 px-4 md:px-6 pt-4">
                <Button variant="outline" size="sm" asChild>
                    <Link href={backLinkHref}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        All Projects
                    </Link>
                </Button>
                <h1 className="text-xl font-semibold text-foreground truncate">{projectName}</h1>
                 <div className="ml-auto w-full max-w-xs">
                    <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by assignee..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                            <div className="flex items-center gap-2">
                                <UserIcon className="h-5 w-5 p-0.5 text-muted-foreground" />
                                <span>All Users</span>
                            </div>
                        </SelectItem>
                        {users.filter(u => u.role !== 'client').map(u => (
                          <SelectItem key={u.id} value={u.id}>
                            <div className="flex items-center gap-2">
                                <Avatar className="h-6 w-6">
                                    <AvatarImage src={u.avatarUrl} alt={u.name} />
                                    <AvatarFallback>{u.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <span>{u.name}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
            </div>
            <div className="flex flex-col flex-1 h-full w-full gap-6 p-4 md:p-6 pt-2 overflow-x-auto">
            {isLoading ? (
                <div className='flex gap-6 h-full'>
                    {Array.from({length: 5}).map((_, i) => (
                        <div key={i} className="flex flex-col w-72 md:w-80 shrink-0">
                            <div className="flex items-center justify-between p-2 mb-2">
                                <Skeleton className="h-6 w-32" />
                                <Skeleton className="h-6 w-8 rounded-md" />
                            </div>
                            <div className="flex-1 rounded-md bg-muted p-2 space-y-3">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : hasTicketsOnBoard ? (
                <div className='flex gap-6'>
                    <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
                    {columns.map((column) => (
                        <KanbanColumn
                        key={column.id}
                        column={column}
                        onTicketClick={handleTicketClick}
                        />
                    ))}
                    </SortableContext>
                </div>
            ) : (
                <div className='flex-1 flex flex-col items-center justify-center text-center text-muted-foreground bg-muted/50 rounded-lg'>
                    <Inbox className='h-16 w-16 mb-4'/>
                    <h2 className='text-xl font-semibold'>Board is Empty</h2>
                    <p>No tickets match the current filter.</p>
                </div>
            )}
            </div>
        </div>
      </DndContext>
      {selectedTicket && <TicketDetails ticket={selectedTicket} onUpdate={onTicketUpdate} />}
    </Dialog>
    </>
  );
}
