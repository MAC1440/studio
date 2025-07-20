
'use client';

import { useState, useEffect } from 'react';
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
import { type Project } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { createProject, getProjects, updateProject, deleteProject } from '@/lib/firebase/projects';
import { Skeleton } from '@/components/ui/skeleton';
import { FolderKanban, Trash2, Edit } from 'lucide-react';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [projectToEdit, setProjectToEdit] = useState<Project | null>(null);
  const { toast } = useToast();

  const fetchProjects = async () => {
    try {
      const fetchedProjects = await getProjects();
      setProjects(fetchedProjects.sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0)));
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      toast({
          title: "Error Fetching Projects",
          description: "Could not load project data.",
          variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    fetchProjects();
  }, []);

  const handleFormSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    const form = event.currentTarget;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (name) {
        try {
            if(projectToEdit) {
                await updateProject(projectToEdit.id, { name, description });
                 toast({
                    title: "Project Updated",
                    description: `Project "${name}" has been updated.`,
                });
            } else {
                 await createProject({ name, description });
                toast({
                    title: "Project Created",
                    description: `Project "${name}" has been created.`,
                });
            }
            await fetchProjects();
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

  const openEditDialog = (project: Project) => {
    setProjectToEdit(project);
    setIsDialogOpen(true);
  };
  
  const openCreateDialog = () => {
    setProjectToEdit(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setProjectToEdit(null);
  }


  return (
    <AlertDialog>
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Project Management</h1>
        <Button onClick={openCreateDialog}>Create Project</Button>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{projectToEdit ? 'Edit Project' : 'Create New Project'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input id="name" name="name" required disabled={isSubmitting} defaultValue={projectToEdit?.name}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" disabled={isSubmitting} defaultValue={projectToEdit?.description}/>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                  <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>Cancel</Button>
              </DialogClose>
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Saving...' : 'Save Project'}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project Name</TableHead>
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
                      <Skeleton className="h-8 w-20" />
                       <Skeleton className="h-8 w-20" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : projects.length > 0 ? (
              projects.map((project) => (
                <TableRow key={project.id}>
                  <TableCell>
                    <p className="font-medium">{project.name}</p>
                    <p className="text-sm text-muted-foreground truncate max-w-md">{project.description}</p>
                  </TableCell>
                   <TableCell>
                    {project.createdAt ? format(project.createdAt.toDate(), 'MMM d, yyyy') : 'N/A'}
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
                    <TableCell colSpan={3} className="h-24 text-center">
                        <div className="flex flex-col items-center gap-2">
                            <FolderKanban className="h-8 w-8 text-muted-foreground" />
                            <p className="text-muted-foreground">No projects found.</p>
                            <Button size="sm" onClick={openCreateDialog}>Create Project</Button>
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
