
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Calendar as CalendarIcon, DollarSign, PlusCircle, Trash2, ArrowLeft, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { getInvoice, updateInvoice } from '@/lib/firebase/invoices';
import { getProjects } from '@/lib/firebase/projects';
import { getUsers } from '@/lib/firebase/users';
import { type Project, type User, type InvoiceItem, type Invoice } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

function EditInvoiceSkeleton() {
    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <Skeleton className="h-10 w-10" />
                <div>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64 mt-1" />
                </div>
            </div>
            <Card>
                <CardHeader>
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-4 w-72 mt-1" />
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-32 w-full" />
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-48" />
                </CardFooter>
            </Card>
        </div>
    )
}

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userData, organization } = useAuth();
  const invoiceId = params.invoiceId as string;
  const isPaidPlan =
    organization?.subscriptionPlan === "startup" ||
    organization?.subscriptionPlan === "pro";

  // Component State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [client, setClient] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);
  
  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [invoiceType, setInvoiceType] = useState<'lump-sum' | 'itemized'>('itemized');
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(0);
  const [items, setItems] = useState<Omit<InvoiceItem, 'id'>[]>([{ description: '', amount: 0 }]);
  const [validUntil, setValidUntil] = useState<Date | undefined>();
  const [status, setStatus] = useState<Invoice['status']>('draft');

  const totalAmount = invoiceType === 'lump-sum' ? lumpSumAmount : items.reduce((sum, item) => sum + (item.amount || 0), 0);
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  }

  useEffect(() => {
    if (organization && !isPaidPlan) {
      toast({
        title: "Upgrade Required",
        description: "Editing invoices requires a paid plan.",
        variant: "destructive",
        action: (
          <Button asChild>
            <Link href="/admin/billing">Upgrade</Link>
          </Button>
        ),
      });
      router.push("/admin/invoices");
    }
  }, [organization, isPaidPlan, router, toast]);

  useEffect(() => {
    if (!invoiceId) {
      router.push('/admin/invoices');
      return;
    }
    if (!userData?.organizationId || !isPaidPlan) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const invoiceData = await getInvoice(invoiceId);
        if (!invoiceData) throw new Error("Invoice not found");

        setOriginalInvoice(invoiceData);
        setTitle(invoiceData.title);
        setDescription(invoiceData.description || '');
        setProjectId(invoiceData.projectId);
        setInvoiceType(invoiceData.type);
        setLumpSumAmount(invoiceData.lumpSumAmount);
        setItems(invoiceData.items.length > 0 ? invoiceData.items : [{ description: '', amount: 0 }]);
        setValidUntil(invoiceData.validUntil.toDate());
        setStatus(invoiceData.status);

        const [allUsers, allProjects] = await Promise.all([getUsers(userData.organizationId!), getProjects(userData.organizationId!)]);
        const currentClient = allUsers.find(u => u.id === invoiceData.clientId);
        if (!currentClient) throw new Error("Client not found");

        setClient(currentClient);
        setProjects(allProjects.filter(p => p.clientIds?.includes(invoiceData.clientId)));

      } catch (error: any) {
        toast({ title: "Error fetching data", description: error.message, variant: "destructive" });
        router.push('/admin/invoices');
      } finally {
        setIsLoading(false);
      }
    };
    if (userData?.organizationId) {
        fetchData();
    }
  }, [invoiceId, router, toast, userData?.organizationId, isPaidPlan]);

  const handleAddItem = () => {
    setItems([...items, { description: '', amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'description' | 'amount', value: string | number) => {
    const newItems = [...items];
    if (field === 'amount') {
        newItems[index][field] = Number(value) || 0;
    } else {
        newItems[index][field] = String(value);
    }
    setItems(newItems);
  };
  
  const handleSubmit = async (newStatus?: Invoice['status']) => {
    if (!client || !projectId || !validUntil || !title || !originalInvoice) {
        toast({ title: "Missing Information", description: "Please fill out all required fields.", variant: "destructive" });
        return;
    }
    
    setIsSubmitting(true);
    const selectedProject = projects.find(p => p.id === projectId);
    if (!selectedProject) {
        toast({ title: "Project not found", variant: "destructive"});
        setIsSubmitting(false);
        return;
    }
    
    const finalStatus = newStatus || status;

    try {
        await updateInvoice(invoiceId, {
            title,
            description,
            projectId: selectedProject.id,
            projectName: selectedProject.name,
            type: invoiceType,
            lumpSumAmount: invoiceType === 'lump-sum' ? lumpSumAmount : 0,
            items: invoiceType === 'itemized' ? items.map((item, idx) => ({ ...item, id: `item-${idx}`})) : [],
            totalAmount,
            status: finalStatus,
            validUntil: validUntil,
        });
        
        let toastMessage = "Invoice Updated";
        if (newStatus === 'sent' && originalInvoice.status === 'draft') {
            toastMessage = "Invoice has been sent to the client.";
        }
        
        toast({ title: toastMessage });
        router.push('/admin/invoices');

    } catch (error: any) {
        toast({ title: "Failed to Update Invoice", description: error.message, variant: "destructive" });
    } finally {
        setIsSubmitting(false);
    }
  }

  if (isLoading || !isPaidPlan) {
    return <EditInvoiceSkeleton />;
  }

  if (!client) {
    return <div>Client not found. Redirecting...</div>;
  }
  
  return (
    <div className='max-h-full'>
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/invoices"><ArrowLeft /></Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Edit Invoice</h1>
          <p className="text-muted-foreground">For client: {client.name}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>Update the form below to modify the invoice.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="title">Invoice Title</Label>
                    <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Q3 Website Maintenance" required/>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="project">Project</Label>
                    <Select onValueChange={setProjectId} value={projectId} required>
                        <SelectTrigger id="project">
                            <SelectValue placeholder="Select a project" />
                        </SelectTrigger>
                        <SelectContent>
                        {projects.map(project => (
                            <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
                        ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
             <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="A brief summary of the invoice's purpose."/>
            </div>
            
             <div className="space-y-3">
                <Label>Invoice Type</Label>
                <RadioGroup value={invoiceType} onValueChange={(v: any) => setInvoiceType(v)} className="flex items-center gap-6">
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="itemized" id="r_itemized" />
                        <Label htmlFor="r_itemized" className="font-normal cursor-pointer">Itemized Breakdown</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                        <RadioGroupItem value="lump-sum" id="r_lump" />
                        <Label htmlFor="r_lump" className="font-normal cursor-pointer">Lump Sum</Label>
                    </div>
                </RadioGroup>
            </div>

            {invoiceType === 'itemized' ? (
                <div className="space-y-4 rounded-md border p-4">
                    <h3 className="font-medium">Itemized Breakdown</h3>
                     <div className="max-h-60 overflow-y-auto pr-2 space-y-4">
                        {items.map((item, index) => (
                            <div key={index} className="flex flex-col md:flex-row gap-2 items-start">
                                <div className="grid gap-2 flex-1 w-full">
                                    <Label htmlFor={`item-desc-${index}`} className="sr-only">Description</Label>
                                    <Input id={`item-desc-${index}`} value={item.description} onChange={e => handleItemChange(index, 'description', e.target.value)} placeholder="Service description"/>
                                </div>
                                 <div className="grid gap-2 w-full md:w-48">
                                    <Label htmlFor={`item-amount-${index}`} className="sr-only">Amount</Label>
                                     <div className="relative">
                                         <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input id={`item-amount-${index}`} type="number" value={item.amount} onChange={e => handleItemChange(index, 'amount', e.target.value)} placeholder="0.00" className="pl-8"/>
                                     </div>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)} className="shrink-0 text-destructive hover:text-destructive-foreground hover:bg-destructive">
                                    <Trash2 className="h-4 w-4"/>
                                </Button>
                            </div>
                        ))}
                    </div>
                    <Button variant="outline" size="sm" onClick={handleAddItem}><PlusCircle className="mr-2"/> Add Item</Button>
                </div>
            ) : (
                <div className="space-y-2">
                    <Label htmlFor="lump-sum">Lump Sum Amount</Label>
                    <div className="relative w-full md:w-56">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="lump-sum" type="number" value={lumpSumAmount} onChange={e => setLumpSumAmount(Number(e.target.value))} placeholder="0.00" className="pl-8"/>
                    </div>
                </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                <div className="space-y-2">
                    <Label>Due Date</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full md:w-[280px] justify-start text-left font-normal",
                            !validUntil && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {validUntil ? format(validUntil, "PPP") : <span>Pick a date</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={validUntil}
                            onSelect={setValidUntil}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                </div>
                <div className="text-right">
                    <p className="text-muted-foreground">Total Amount</p>
                    <p className="text-3xl font-bold">{formatCurrency(totalAmount)}</p>
                </div>
            </div>

        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => handleSubmit()} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
          {originalInvoice?.status === 'draft' && (
            <Button onClick={() => handleSubmit('sent')} disabled={isSubmitting}>
                {isSubmitting ? 'Sending...' : 'Save and Send Invoice'}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}

    
