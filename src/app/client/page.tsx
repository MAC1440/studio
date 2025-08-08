
'use client';

import { useState, useEffect } from 'react';
import AppHeader from '@/components/layout/header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getProjects } from '@/lib/firebase/projects';
import { type Project } from '@/lib/types';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function ClientDashboardPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const { user, userData } = useAuth();

  useEffect(() => {
    if (!user || !userData?.organizationId) return;

    const fetchProjects = async () => {
      setIsLoading(true);
      try {
        const allProjects = await getProjects(userData.organizationId!);
        // Filter projects to only show those the current client is assigned to
        const clientProjects = allProjects.filter(p => p.clientIds?.includes(user.uid));
        setProjects(clientProjects);
      } catch (error) {
        console.error("Failed to fetch projects:", error);
        toast({
          title: "Error",
          description: "Could not fetch your projects.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    fetchProjects();
  }, [user, userData?.organizationId, toast]);

  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Your Projects</h1>
      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-5/6" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Link href={`/client/project/${project.id}`} key={project.id} className="block hover:scale-[1.02] transition-transform duration-200">
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FolderKanban className="h-5 w-5 text-primary" />
                    {project.name}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {project.description || 'No description provided.'}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
         <div className="flex flex-col items-center justify-center h-[50vh] text-center border rounded-lg bg-card">
            <FolderKanban className="h-16 w-16 text-muted-foreground mb-4" />
            <h2 className="text-2xl font-semibold">No Projects Assigned</h2>
            <p className="text-muted-foreground mt-2">
                You have not been assigned to any projects yet.
            </p>
        </div>
      )}
    </div>
  );
}
