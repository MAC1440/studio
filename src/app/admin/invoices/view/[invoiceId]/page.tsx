"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar as CalendarIcon,
  DollarSign,
  ArrowLeft,
} from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { getInvoice } from "@/lib/firebase/invoices";
import { getProjects } from "@/lib/firebase/projects";
import { getUsers } from "@/lib/firebase/users";
import {
  type Project,
  type User,
  type InvoiceItem,
  type Invoice,
} from "@/lib/types";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function EditInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const { userData } = useAuth();
  const invoiceId = params.invoiceId as string;

  // Component State
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [client, setClient] = useState<User | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [originalInvoice, setOriginalInvoice] = useState<Invoice | null>(null);

  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [projectId, setProjectId] = useState("");
  const [invoiceType, setInvoiceType] = useState<"lump-sum" | "itemized">(
    "itemized"
  );
  const [lumpSumAmount, setLumpSumAmount] = useState<number>(0);
  const [items, setItems] = useState<Omit<InvoiceItem, "id">[]>([
    { description: "", amount: 0 },
  ]);
  const [validUntil, setValidUntil] = useState<Date | undefined>();
  const [status, setStatus] = useState<Invoice["status"]>("draft");

  const totalAmount =
    invoiceType === "lump-sum"
      ? lumpSumAmount
      : items.reduce((sum, item) => sum + (item.amount || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  useEffect(() => {
    if (!invoiceId) {
      router.push("/admin/invoices");
      return;
    }
    if (!userData?.organizationId) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const invoiceData = await getInvoice(invoiceId);
        if (!invoiceData) throw new Error("Invoice not found");

        setOriginalInvoice(invoiceData);
        setTitle(invoiceData.title);
        setDescription(invoiceData.description || "");
        setProjectId(invoiceData.projectId);
        setInvoiceType(invoiceData.type);
        setLumpSumAmount(invoiceData.lumpSumAmount);
        setItems(
          invoiceData.items.length > 0
            ? invoiceData.items
            : [{ description: "", amount: 0 }]
        );
        setValidUntil(invoiceData.validUntil.toDate());
        setStatus(invoiceData.status);

        const [allUsers, allProjects] = await Promise.all([
          getUsers(userData.organizationId!),
          getProjects(userData.organizationId!),
        ]);
        const currentClient = allUsers.find(
          (u) => u.id === invoiceData.clientId
        );
        if (!currentClient) throw new Error("Client not found");

        setClient(currentClient);
        setProjects(
          allProjects.filter((p) => p.clientIds?.includes(invoiceData.clientId))
        );
      } catch (error: any) {
        toast({
          title: "Error fetching data",
          description: error.message,
          variant: "destructive",
        });
        router.push("/admin/invoices");
      } finally {
        setIsLoading(false);
      }
    };
    if (userData?.organizationId) {
      fetchData();
    }
  }, [invoiceId, router, toast, userData?.organizationId]);

  if (isLoading) {
    return <div>Loading...</div>; // TODO: Add Skeleton
  }

  if (!client) {
    return <div>Client not found. Redirecting...</div>;
  }

  return (
    <div className="max-h-full">
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" asChild>
          <Link href="/admin/invoices">
            <ArrowLeft />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">View Invoice</h1>
          <p className="text-muted-foreground">For client: {client.name}</p>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Invoice Details</CardTitle>
          <CardDescription>
            View the invoice for {client.name}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Invoice Title</Label>
              <Input
                id="title"
                value={title}
                disabled
                placeholder="e.g. Q3 Website Maintenance"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select disabled value={projectId}>
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              disabled
              placeholder="A brief summary of the invoice's purpose."
            />
          </div>

          <div className="space-y-3">
            <Label>Invoice Type</Label>
            <p className="px-1 text-primary font-bold">
            {invoiceType ==='itemized' && "Itemized"}
            {invoiceType ==='lump-sum' && "Lump Sum"}
            </p>
          </div>

          {invoiceType === "itemized" ? (
            <div className="space-y-4 rounded-md border p-4">
              <h3 className="font-medium">Itemized Breakdown</h3>
              <div className="max-h-60 overflow-y-auto pr-2 space-y-4">
                {items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col md:flex-row gap-2 items-start"
                  >
                    <div className="grid gap-2 flex-1 w-full">
                      <Label htmlFor={`item-desc-${index}`} className="sr-only">
                        Description
                      </Label>
                      <Input
                        id={`item-desc-${index}`}
                        value={item.description}
                        disabled
                        placeholder="Service description"
                      />
                    </div>
                    <div className="grid gap-2 w-full md:w-48">
                      <Label
                        htmlFor={`item-amount-${index}`}
                        className="sr-only"
                      >
                        Amount
                      </Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id={`item-amount-${index}`}
                          type="number"
                          value={item.amount}
                          disabled
                          placeholder="0.00"
                          className="pl-8"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="lump-sum">Lump Sum Amount</Label>
              <div className="relative w-full md:w-56">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="lump-sum"
                  type="number"
                  value={lumpSumAmount}
                  disabled
                  placeholder="0.00"
                  className="pl-8"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
            <div className="space-y-2">
              <Label>Due Date</Label>
              
                  <Button
                    variant={"outline"}
                    disabled
                    className={cn(
                      "w-full md:w-[280px] justify-start text-left font-normal",
                      !validUntil && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {validUntil ? (
                      format(validUntil, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Total Amount</p>
              <p className="text-3xl font-bold">
                {formatCurrency(totalAmount)}
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Back
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
