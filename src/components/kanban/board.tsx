'use client';

import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
  DragOverlay,
  DropAnimation,
  defaultDropAnimation,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { type Column, type ColumnId, type Ticket } from '@/lib/types';
import KanbanColumn from './column';
import KanbanTicket from './ticket';
import TicketDetails from './ticket-details';
import { Dialog } from '@/components/ui/dialog';

const mockTickets: Ticket[] = [
  { id: 'TICKET-1', title: 'Implement user authentication', description: 'Full description for user auth.', tags: [{id: 'tag-1', label: 'Feature', color: 'bg-blue-500'}], comments: [], assignedTo: {id: 'user-1', name: 'Jane Doe', email: 'jane@example.com', role: 'user'} },
  { id: 'TICKET-2', title: 'Design the Kanban board UI', description: 'Detailed UI design specifications.', tags: [{id: 'tag-2', label: 'Design', color: 'bg-pink-500'}], comments: [] },
  { id: 'TICKET-3', title: 'Setup CI/CD pipeline', description: 'Setup continuous integration and deployment.', tags: [{id: 'tag-3', label: 'DevOps', color: 'bg-yellow-500'}], comments: [] },
  { id: 'TICKET-4', title: 'Fix login page bug', description: 'Users are unable to login with correct credentials.', tags: [{id: 'tag-4', label: 'Bug', color: 'bg-red-500'}], comments: [] },
  { id: 'TICKET-5', title: 'Write API documentation', description: 'Document all available API endpoints.', tags: [{id: 'tag-5', label: 'Docs', color: 'bg-green-500'}], comments: [] },
  { id: 'TICKET-6', title: 'Refactor database schema', description: 'Optimize database schema for performance.', tags: [{id: 'tag-1', label: 'Feature', color: 'bg-blue-500'}], comments: [] },
  { id: 'TICKET-7', title: 'User profile page design', description: 'Design mockups for the user profile page.', tags: [{id: 'tag-2', label: 'Design', color: 'bg-pink-500'}], comments: [] },
  { id: 'TICKET-8', title: 'Test payment gateway integration', description: 'End-to-end testing for payment processing.', tags: [{id: 'tag-6', label: 'QA', color: 'bg-purple-500'}], comments: [] },
];

const initialColumns: Column[] = [
  { id: 'backlog', title: 'Backlog', tickets: [mockTickets[0], mockTickets[1]] },
  { id: 'todo', title: 'To Do', tickets: [mockTickets[2], mockTickets[3]] },
  { id: 'in-progress', title: 'In Progress', tickets: [mockTickets[4]] },
  { id: 'review', title: 'Review', tickets: [mockTickets[5]] },
  { id: 'done', title: 'Done', tickets: [mockTickets[6], mockTickets[7]] },
];

export default function KanbanBoard() {
  const [columns, setColumns] = useState<Column[]>(initialColumns);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [isTicketDetailOpen, setIsTicketDetailOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const findColumn = (id: ColumnId | string): Column | undefined => {
    return columns.find((col) => col.id === id || col.tickets.some((t) => t.id === id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const activeId = active.id.toString();
    const overId = over.id.toString();
    
    const activeColumn = findColumn(activeId);
    const overColumn = findColumn(overId);

    if (!activeColumn || !overColumn) {
      return;
    }

    setColumns((prev) => {
      const activeItems = activeColumn.tickets;
      const overItems = overColumn.tickets;
      const activeIndex = activeItems.findIndex((t) => t.id === activeId);
      const overIndex = overItems.findIndex((t) => t.id === overId);

      let newColumns = [...prev];

      if (activeColumn.id === overColumn.id) {
        // Same column
        const newTickets = arrayMove(activeItems, activeIndex, overIndex);
        const activeColIndex = newColumns.findIndex(c => c.id === activeColumn.id);
        newColumns[activeColIndex] = { ...activeColumn, tickets: newTickets };
      } else {
        // Different columns
        const [movedItem] = activeItems.splice(activeIndex, 1);

        // Is the user dropping on a ticket or on the column?
        const isDroppingOnTicket = overItems.some(t => t.id === overId);
        
        if (isDroppingOnTicket) {
             overItems.splice(overIndex, 0, movedItem);
        } else {
             overItems.push(movedItem);
        }
        
        const activeColIndex = newColumns.findIndex(c => c.id === activeColumn.id);
        const overColIndex = newColumns.findIndex(c => c.id === overColumn.id);

        newColumns[activeColIndex] = { ...activeColumn, tickets: [...activeItems] };
        newColumns[overColIndex] = { ...overColumn, tickets: [...overItems] };
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
      </DndContext>
      {selectedTicket && <TicketDetails ticket={selectedTicket} />}
    </Dialog>
  );
}
