
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

const initialColumns: Column[] = [
  { id: 'backlog', title: 'Backlog', tickets: [] },
  { id: 'todo', title: 'To Do', tickets: [] },
  { id: 'in-progress', title: 'In Progress', tickets: [] },
  { id: 'review', title: 'Review', tickets: [] },
  { id: 'done', title: 'Done', tickets: [] },
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);
  const { toast } = useToast();
  const { ticketReloadKey } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      setIsLoading(true);
      try {
        const tickets = await getTickets();
        const newColumns = [...initialColumns].map(c => ({...c, tickets: []})); // Reset tickets
        tickets.forEach(ticket => {
          const columnIndex = newColumns.findIndex(col => col.id === ticket.status);
          if (columnIndex !== -1) {
            newColumns[columnIndex].tickets.push(ticket);
          } else {
             // If status is invalid, put it in the backlog
            newColumns[0].tickets.push(ticket);
          }
        });
        setColumns(newColumns);
      } catch (error) {
        console.error("Failed to fetch tickets:", error);
        toast({
          title: "Error",
          description: "Could not fetch tickets from the database.",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchTickets();
  }, [toast, ticketReloadKey]);

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

        // Persist change to Firebase
        updateTicketStatus(activeId, overColumn.id).catch(err => {
            console.error("Failed to update ticket status:", err);
            toast({
                title: "Update Failed",
                description: "Could not update ticket status. Please try again.",
                variant: "destructive"
            });
            // Consider reverting UI change on failure (more complex state management)
        });
      }

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

  return (
    <Dialog open={isTicketDetailOpen} onOpenChange={handleTicketDetailClose}>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="flex h-full w-full gap-6 p-4 md:p-6 overflow-x-auto">
          {isLoading ? (
            Array.from({length: 5}).map((_, i) => (
                <div key={i} className="flex flex-col w-72 md:w-80 shrink-0">
                    <div className="flex items-center justify-between p-2 mb-2">
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-6 w-8 rounded-md" />
                    </div>
                    <div className="flex-1 rounded-md bg-secondary/50 p-2 space-y-3">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </div>
                </div>
            ))
          ) : (
            <SortableContext items={columns.map(c => c.id)} strategy={horizontalListSortingStrategy}>
              {columns.map((column) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  onTicketClick={handleTicketClick}
                />
              ))}
            </SortableContext>
          )}
        </div>
      </DndContext>
      {selectedTicket && <TicketDetails ticket={selectedTicket} />}
    </Dialog>
  );
}
