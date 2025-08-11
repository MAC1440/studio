
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getProjects } from '@/lib/firebase/projects';
import { type Project } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';

export default function AdminChatPage() {
    const [projects, setProjects] = useState<Project[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const { userData } = useAuth();
    const { toast } = useToast();

    useEffect(() => {
        if (!userData?.organizationId) return;
        const fetchProjects = async () => {
            setIsLoading(true);
            try {
                const fetchedProjects = await getProjects(userData.organizationId);
                // For now, let's just show projects with clients.
                // In a future step, we can build a more complex chat hub.
                setProjects(fetchedProjects.filter(p => p.clientIds && p.clientIds.length > 0));
            } catch (error) {
                console.error("Failed to fetch projects for chat:", error);
                toast({
                    title: "Error",
                    description: "Could not load projects.",
                    variant: "destructive",
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchProjects();
    }, [userData?.organizationId, toast]);

    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Client Chats</h1>
             {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
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
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {projects.map((project) => (
                    // This now correctly links to the client project view with the chat open
                    <Link href={`/client/project/${project.id}?open_chat=true`} key={project.id} className="block hover:scale-[1.02] transition-transform duration-200">
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
                    <h2 className="text-2xl font-semibold">No Active Client Projects</h2>
                    <p className="text-muted-foreground mt-2">
                        Assign a client to a project to start a chat.
                    </p>
                </div>
            )}
        </div>
    )
}
