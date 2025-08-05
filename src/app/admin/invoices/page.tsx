
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { getInvoices } from '@/lib/firebase/invoices';
import { type Invoice } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, PlusCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const fetchedInvoices = await getInvoices();
      setInvoices(fetchedInvoices.sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis()));
    } catch (error) {
      console.error('Failed to fetch invoices:', error);
      toast({
        title: 'Error',
        description: 'Could not fetch invoices.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

 const getStatusBadgeVariant = (status: Invoice['status']) => {
    switch (status) {
      case 'paid':
        return 'default';
      case 'overdue':
      case 'expired':
        return 'destructive';
      case 'sent':
        return 'secondary';
      case 'draft':
      default:
        return 'outline';
    }
  }
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  return (
      <div className='max-w-[100vw] overflow-auto'>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl md:text-3xl font-bold">Invoices</h1>
          <Button size="sm" asChild>
            <Link href="/admin/invoices/create">
              <PlusCircle className="md:mr-2 h-4 w-4" />
              <span className="hidden md:inline">Create Invoice</span>
            </Link>
          </Button>
        </div>
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Project</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-medium">{invoice.clientName}</TableCell>
                    <TableCell>{invoice.projectName}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                       <Badge variant={getStatusBadgeVariant(invoice.status)} className="capitalize">{invoice.status.replace('-', ' ')}</Badge>
                    </TableCell>
                    <TableCell>{format(invoice.validUntil.toDate(), 'MMM d, yyyy')}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end items-center gap-2">
                        <Button variant="ghost" size="sm" asChild>
                            <Link href={`/admin/invoices/edit/${invoice.id}`}>
                                Edit
                            </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="h-48 text-center">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <DollarSign className="h-12 w-12" />
                      <h2 className="text-lg font-semibold">No Invoices Yet</h2>
                      <p>Click "Create Invoice" to get started.</p>
                       <Button size="sm" className="mt-2" asChild>
                            <Link href="/admin/invoices/create">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create Invoice
                            </Link>
                        </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
  );
}
