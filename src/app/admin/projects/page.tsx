
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
  DialogTrigger,
  DialogFooter,
  DialogClose,
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
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { type Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import {
  createProject,
  getProjects,
  updateProject,
  deleteProject,
} from '@/lib/firebase/projects';
import { Skeleton } from '@/components/ui/skeleton';
import { Briefcase, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchProjects = async () => {
    try {
      const fetchedProjects = await getProjects();
      setProjects(
        fetchedProjects.sort(
          (a, b) =>
            (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)
        )
      );
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      toast({
        title: 'Error Fetching Projects',
        description: 'Could not load project data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchProjects();
  }, [toast]);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in.',
        variant: 'destructive',
      });
      return;
    }

    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    try {
      if (projectToEdit) {
        // Update existing project
        await updateProject(projectToEdit.id, { name, description });
        toast({
          title: 'Project Updated',
          description: `Project "${name}" has been successfully updated.`,
        });
      } else {
        // Create new project
        await createProject({ name, description, ownerId: user.uid });
        toast({
          title: 'Project Created',
          description: `Project "${name}" has been successfully created.`,
        });
      }
      await fetchProjects();
      handleCloseDialog();
    } catch (error: any) {
      console.error('Failed to save project:', error);
      toast({
        title: 'Error Saving Project',
        description: `Could not save project. ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(projectToDelete.id);
      toast({
        title: 'Project Deleted',
        description: `Project ${projectToDelete.name} has been successfully deleted.`,
      });
      setProjectToDelete(null);
      setProjects(projects.filter(p => p.id !== projectToDelete.id));
    } catch (error: any) {
      console.error('Failed to delete project:', error);
      toast({
        title: 'Deletion Failed',
        description: `Could not delete project. ${error.message}`,
        variant: 'destructive',
      });
      setProjectToDelete(null);
    }
  };
  
  const handleOpenEditDialog = (project: Project) => {
    setProjectToEdit(project);
    setIsDialogOpen(true);
  };
  
  const handleOpenCreateDialog = () => {
    setProjectToEdit(null);
    setIsDialogOpen(true);
  }
  
  const handleCloseDialog = () => {
      setIsDialogOpen(false);
      setProjectToEdit(null);
  }

  const dialogTitle = useMemo(() => projectToEdit ? "Edit Project" : "Create New Project", [projectToEdit]);

  return (
    <AlertDialog>
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Project Management</h1>
          <Button onClick={handleOpenCreateDialog}>Create Project</Button>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{dialogTitle}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" name="name" required defaultValue={projectToEdit?.name || ''} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" required defaultValue={projectToEdit?.description || ''} />
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancel
                  </Button>
                </DialogClose>
                <Button type="submit">Save Project</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <Skeleton className="h-4 w-48" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-32" />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-8 w-8" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : projects.length > 0 ? (
                projects.map(project => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.name}</TableCell>
                    <TableCell>
                      {project.createdAt?.toDate ? format(project.createdAt.toDate(), 'PPP') : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => handleOpenEditDialog(project)}>
                           <Edit className="h-4 w-4" />
                        </Button>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => setProjectToDelete(project)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Briefcase className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No projects found.</p>
                      <Button size="sm" onClick={handleOpenCreateDialog}>
                        Create a Project
                      </Button>
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
              This action cannot be undone. This will permanently delete the
              project{' '}
              <span className="font-bold">{projectToDelete?.name}</span>.
              Associated tickets will not be deleted but will be orphaned.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setProjectToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </div>
    </AlertDialog>
  );
}
