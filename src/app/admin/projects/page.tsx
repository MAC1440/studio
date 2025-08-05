
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type Project, type User, type ProjectStatus } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createProject, getProjects, updateProject, deleteProject } from '@/lib/firebase/projects';
import { getUsers } from '@/lib/firebase/users';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, Trash2, Edit, Check, ChevronsUpDown, PlusCircle, Calendar as CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';


function MultiSelectClients({ allClients, selectedClientIds, onSelectionChange }: { allClients: User[], selectedClientIds: string[], onSelectionChange: (ids: string[]) => void }) {
  const [open, setOpen] = useState(false);

  const selectedClients = allClients.filter(c => selectedClientIds.includes(c.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          <span className="truncate">
            {selectedClients.length > 0 ? selectedClients.map(c => c.name).join(', ') : "Select clients..."}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput placeholder="Search clients..." />
          <CommandList>
            <CommandEmpty>No clients found.</CommandEmpty>
            <CommandGroup>
              {allClients.map((client) => (
                <CommandItem
                  key={client.id}
                  value={client.email}
                  onSelect={() => {
                    const newSelection = selectedClientIds.includes(client.id)
                      ? selectedClientIds.filter(id => id !== client.id)
                      : [...selectedClientIds, client.id];
                    onSelectionChange(newSelection);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedClientIds.includes(client.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {client.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}


export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  
  // Form state
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [status, setStatus] = useState<ProjectStatus>('on-track');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  // Filtering state
  const [searchQuery, setSearchQuery] = useState('');
  const [clientFilter, setClientFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | 'all'>('all');


  const { toast } = useToast();

  const fetchData = async () => {
    try {
      const [fetchedProjects, fetchedUsers] = await Promise.all([
        getProjects(),
        getUsers()
      ]);
      setProjects(fetchedProjects.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
      setClients(fetchedUsers.filter(u => u.role === 'client'));
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast({
        title: "Error Fetching Data",
        description: "Could not load project or client data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchData();
  }, []);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    
    const projectData = {
      name,
      description,
      clientIds: selectedClientIds,
      deadline,
      status: projectToEdit ? status : 'on-track' // Default to on-track for new projects
    };

    if (name) {
      try {
        if (projectToEdit) {
          await updateProject(projectToEdit.id, projectData);
          toast({
            title: "Project Updated",
            description: `Project "${name}" has been updated.`,
          });
        } else {
          await createProject(projectData);
          toast({
            title: "Project Created",
            description: `Project "${name}" has been created.`,
          });
        }
        await fetchData();
        closeDialog();
      } catch (error: any) {
        console.error("Failed to save project:", error);
        toast({
          title: "Error Saving Project",
          description: `Could not save project. Error: ${error.message}`,
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    } else {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setIsSubmitting(true);
    try {
      await deleteProject(projectToDelete.id);
      toast({
        title: "Project Deleted",
        description: `Project "${projectToDelete.name}" has been successfully deleted.`,
      });
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
    } catch (error: any) {
      console.error("Failed to delete project:", error);
      toast({
        title: "Deletion Failed",
        description: `Could not delete project. ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setProjectToDelete(null);
    }
  };
  
  const resetFormState = () => {
    setProjectToEdit(null);
    setSelectedClientIds([]);
    setDeadline(undefined);
    setStatus('on-track');
    setName('');
    setDescription('');
  };

  const openEditDialog = (project: Project) => {
    resetFormState();
    setProjectToEdit(project);
    setName(project.name);
    setDescription(project.description);
    setSelectedClientIds(project.clientIds || []);
    setDeadline(project.deadline?.toDate());
    setStatus(project.status || 'on-track');
    setIsDialogOpen(true);
  };

  const openCreateDialog = () => {
    resetFormState();
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    // Let the animation finish before resetting state
    setTimeout(resetFormState, 200);
  }

  const getStatusBadgeVariant = (status?: ProjectStatus) => {
    switch (status) {
      case 'completed': return 'default';
      case 'off-track': return 'destructive';
      case 'at-risk': return 'secondary';
      case 'on-track': return 'secondary';
      default: return 'outline';
    }
  }

  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
        const searchLower = searchQuery.toLowerCase();
        const matchesSearch = searchLower 
            ? project.name.toLowerCase().includes(searchLower) || (project.description || '').toLowerCase().includes(searchLower)
            : true;

        const matchesClient = clientFilter !== 'all' 
            ? (project.clientIds || []).includes(clientFilter) 
            : true;

        const matchesStatus = statusFilter !== 'all' 
            ? project.status === statusFilter 
            : true;

        return matchesSearch && matchesClient && matchesStatus;
    });
  }, [projects, searchQuery, clientFilter, statusFilter]);

  return (
    <AlertDialog>
      <div className='max-w-[100vw] overflow-auto'>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Project Management</h1>
          <Button onClick={openCreateDialog} size="sm">
            <PlusCircle className="md:mr-2" />
            <span className="hidden md:inline">Create Project</span>
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-4">
            <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                    placeholder="Search projects..." 
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Filter by client" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Clients</SelectItem>
                    {clients.map(client => (
                        <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="w-full max-w-xs">
                    <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="on-track">On Track</SelectItem>
                    <SelectItem value="at-risk">At Risk</SelectItem>
                    <SelectItem value="off-track">Off Track</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
            </Select>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={(isOpen) => { if (!isSubmitting) setIsDialogOpen(isOpen) }}>
          <DialogContent onInteractOutside={e => { if (isSubmitting) e.preventDefault(); }}>
            <DialogHeader>
              <DialogTitle>{projectToEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" name="name" required disabled={isSubmitting} value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" disabled={isSubmitting} value={description} onChange={e => setDescription(e.target.value)} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label>Deadline</Label>
                     <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !deadline && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {deadline ? format(deadline, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={deadline}
                            onSelect={setDeadline}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                 </div>
                 {projectToEdit && (
                    <div className="space-y-2">
                        <Label>Status</Label>
                        <Select onValueChange={(v: ProjectStatus) => setStatus(v)} value={status} disabled={isSubmitting}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="on-track">On Track</SelectItem>
                                <SelectItem value="at-risk">At Risk</SelectItem>
                                <SelectItem value="off-track">Off Track</SelectItem>
                                <SelectItem value="on-hold">On Hold</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                 )}
              </div>
              <div className="space-y-2">
                <Label>Assign Clients</Label>
                <MultiSelectClients
                  allClients={clients}
                  selectedClientIds={selectedClientIds}
                  onSelectionChange={setSelectedClientIds}
                />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Project'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>


        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Assigned Clients</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-20" />
                        <Skeleton className="h-8 w-20" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : filteredProjects.length > 0 ? (
                filteredProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell>
                      <p className="font-medium">{project.name}</p>
                      <p className="text-sm text-muted-foreground truncate max-w-sm">{project.description}</p>
                    </TableCell>
                    <TableCell>
                        <Badge variant={getStatusBadgeVariant(project.status)} className="capitalize">{project.status?.replace('-', ' ') || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      {project.deadline ? format(project.deadline.toDate(), 'MMM d, yyyy') : 'N/A'}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {(project.clientIds || []).length > 0 ?
                          project.clientIds?.map(id => {
                            const client = clients.find(c => c.id === id);
                            return client ? <Badge key={id} variant="secondary">{client.name}</Badge> : null;
                          })
                          : <span className="text-xs text-muted-foreground">None</span>
                        }
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDialog(project)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => setProjectToDelete(project)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <FolderKanban className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No projects match your filters.</p>
                      <Button size="sm" variant="outline" onClick={() => { setSearchQuery(''); setClientFilter('all'); setStatusFilter('all'); }}>Clear Filters</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project
              <span className="font-bold"> "{projectToDelete?.name}"</span> and all of its associated tickets.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} disabled={isSubmitting}>
              {isSubmitting ? 'Deleting...' : 'Continue'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>

      </div>
    </AlertDialog>
  );
}
