
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { type Project } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { FolderKanban } from 'lucide-react';

export default function AdminChatPage() {
    const { projects, activeProjectIds, loading } = useAuth();
    
    const activeProjects = useMemo(() => {
        return projects.filter(p => activeProjectIds.includes(p.id));
    }, [projects, activeProjectIds]);


    return (
        <div>
            <h1 className="text-2xl md:text-3xl font-bold mb-6">Client & Team Chats</h1>
             {loading ? (
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
            ) : activeProjects.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeProjects.map((project) => (
                    <Link href={`/admin/chat/${project.id}`} key={project.id} className="block hover:scale-[1.02] transition-transform duration-200">
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
                    <h2 className="text-2xl font-semibold">No Active Projects Found</h2>
                    <p className="text-muted-foreground mt-2">
                        Create a project to start a chat with clients and team members.
                    </p>
                </div>
            )}
        </div>
    )
}
