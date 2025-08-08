
'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { getClientReports, updateClientReport } from '@/lib/firebase/client-reports';
import { type ClientReport } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
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
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ClipboardCheck, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ClientReportsPage() {
    const [reports, setReports] = useState<ClientReport[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<ClientReport | null>(null);
    const { userData } = useAuth();
    const { toast } = useToast();

    const fetchReports = async () => {
        if (!userData?.organizationId) return;
        setIsLoading(true);
        try {
            const fetchedReports = await getClientReports({ organizationId: userData.organizationId });
            setReports(fetchedReports);
        } catch (error) {
            console.error("Failed to fetch client reports:", error);
            toast({
                title: "Error",
                description: "Could not fetch client reports.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (userData?.organizationId) {
            fetchReports();
        }
    }, [userData?.organizationId]);

    const handleViewReport = async (report: ClientReport) => {
        setSelectedReport(report);
        if (report.status === 'new') {
            try {
                await updateClientReport(report.id, { status: 'viewed' });
                // Optimistically update UI
                setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'viewed' } : r));
            } catch (error) {
                console.error("Failed to mark report as viewed:", error);
                // Don't toast here as it's not a critical failure for the user
            }
        }
    };

    const getStatusBadgeVariant = (status: ClientReport['status']) => {
        switch (status) {
            case 'new': return 'default';
            case 'viewed': return 'secondary';
            case 'archived': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className='max-w-[100vw] overflow-auto'>
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl md:text-3xl font-bold">Client Reports</h1>
            </div>
            <div className="border rounded-lg overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Client</TableHead>
                            <TableHead>Project</TableHead>
                            <TableHead>Report Title</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Submitted</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-64" /></TableCell>
                                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                                </TableRow>
                            ))
                        ) : reports.length > 0 ? (
                            reports.map((report) => (
                                <TableRow key={report.id}>
                                    <TableCell className="font-medium">{report.clientName}</TableCell>
                                    <TableCell>{report.projectName}</TableCell>
                                    <TableCell>{report.title}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(report.status)} className="capitalize">
                                            {report.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{format(report.createdAt.toDate(), 'MMM d, yyyy')}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="sm" onClick={() => handleViewReport(report)}>
                                            <Eye className="mr-2 h-4 w-4" /> View
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={6} className="h-48 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <ClipboardCheck className="h-12 w-12" />
                                        <h2 className="text-lg font-semibold">No Client Reports</h2>
                                        <p>Reports submitted by clients will appear here.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
             <Dialog open={!!selectedReport} onOpenChange={(isOpen) => !isOpen && setSelectedReport(null)}>
                {selectedReport && (
                    <DialogContent className="max-w-3xl h-[80vh] flex flex-col">
                        <DialogHeader>
                            <DialogTitle>{selectedReport.title}</DialogTitle>
                            <div className="text-sm text-muted-foreground pt-1">
                                Submitted by {selectedReport.clientName} for project {selectedReport.projectName}
                            </div>
                        </DialogHeader>
                        <ScrollArea className="flex-1 my-4 -mx-6 px-6">
                           <div
                                className="prose prose-sm dark:prose-invert max-w-none"
                                dangerouslySetInnerHTML={{ __html: selectedReport.description }}
                            />
                        </ScrollArea>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedReport(null)}>Close</Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
