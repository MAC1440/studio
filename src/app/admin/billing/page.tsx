
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type Organization, type User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
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
} from "@/components/ui/alert-dialog";
import { createSupportTicket } from '@/lib/firebase/support';


type Plan = {
    name: 'Free' | 'Startup' | 'Pro';
    price: string;
    features: string[];
    icon: React.ElementType;
    id: 'free' | 'startup' | 'pro';
    projectLimit: number | string;
};

const plans: Plan[] = [
    {
        name: 'Free',
        price: '$0',
        features: ['3 Projects', '3 Clients', 'Basic Kanban Board', 'Community Support'],
        icon: Briefcase,
        id: 'free' as const,
        projectLimit: 3
    },
    {
        name: 'Startup',
        price: '$20',
        features: ['10 Projects', '10 Clients', 'Invoicing & Proposals', 'Client Reports', 'Priority Email Support'],
        icon: Star,
        id: 'startup' as const,
        projectLimit: 10
    },
    {
        name: 'Pro',
        price: '$50',
        features: ['Unlimited Projects', 'Unlimited Clients', 'All Startup Features', 'Advanced Reporting', 'API Access (soon)'],
        icon: CheckCircle,
        id: 'pro' as const,
        projectLimit: 'Unlimited'
    }
];


export default function BillingPage() {
    const { user, userData } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        if (userData?.organizationId) {
            const fetchOrganization = async () => {
                setIsLoading(true);
                const orgRef = doc(db, 'organizations', userData.organizationId);
                const orgSnap = await getDoc(orgRef);
                if (orgSnap.exists()) {
                    setOrganization(orgSnap.data() as Organization);
                }
                setIsLoading(false);
            };
            fetchOrganization();
        }
    }, [userData?.organizationId]);

    const handlePlanChangeRequest = async () => {
        if (!user || !organization || !selectedPlan) return;

        setIsSubmitting(true);
        
        try {
            // Fetch the organization owner's data to ensure the correct user is referenced
            const ownerRef = doc(db, 'users', organization.ownerId);
            const ownerSnap = await getDoc(ownerRef);

            if (!ownerSnap.exists()) {
                throw new Error("Could not find the organization owner's account.");
            }
            const ownerData = ownerSnap.data() as User;

             await createSupportTicket({
                requester: {
                    id: ownerData.id,
                    name: ownerData.name,
                    email: ownerData.email || 'N/A',
                },
                organization: {
                    id: organization.id,
                    name: organization.name
                },
                requestDetails: {
                    currentPlan: organization.subscriptionPlan,
                    requestedPlan: selectedPlan.name,
                    price: selectedPlan.price
                }
            });

            toast({
                title: "Request Submitted",
                description: "Your plan change request has been sent to support. We will process it shortly.",
                duration: 7000,
            });

        } catch (error: any) {
             toast({
                title: "Request Failed",
                description: error.message || "Could not submit your plan change request. Please try again later.",
                variant: "destructive",
                duration: 9000,
            });
        } finally {
            setIsSubmitting(false);
            setSelectedPlan(null);
        }
    }
    
    const isDowngrade = (newPlan: Plan) => {
        const currentPlanId = organization?.subscriptionPlan || 'free';
        if (newPlan.id === 'free' && (currentPlanId === 'startup' || currentPlanId === 'pro')) return true;
        if (newPlan.id === 'startup' && currentPlanId === 'pro') return true;
        return false;
    }

    const currentPlan = organization?.subscriptionPlan || 'free';

    if (isLoading) {
        return (
            <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-6">Billing & Subscriptions</h1>
                <div className="grid md:grid-cols-3 gap-6">
                    <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
                    <Card><CardHeader><Skeleton className="h-6 w-32" /></CardHeader><CardContent><Skeleton className="h-20 w-full" /></CardContent><CardFooter><Skeleton className="h-10 w-full" /></CardFooter></Card>
                </div>
            </div>
        )
    }

    return (
        <AlertDialog open={!!selectedPlan} onOpenChange={(isOpen) => !isOpen && setSelectedPlan(null)}>
            <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Billing & Subscriptions</h1>
                <p className="text-muted-foreground mb-6">Manage your plan and payment details.</p>

                <div className="grid lg:grid-cols-3 gap-8">
                    {plans.map((plan) => (
                        <Card key={plan.id} className={cn("flex flex-col", currentPlan === plan.id && "border-primary ring-2 ring-primary")}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                                    <plan.icon className={cn("h-6 w-6", currentPlan === plan.id ? "text-primary" : "text-muted-foreground")} />
                                </div>
                                <CardDescription>
                                    <span className="text-3xl font-bold">{plan.price}</span>
                                    {plan.id !== 'free' && <span className="text-muted-foreground">/month</span>}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="flex-1">
                                <ul className="space-y-3">
                                    {plan.features.map(feature => (
                                        <li key={feature} className="flex items-center gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500" />
                                            <span className="text-sm">{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                            </CardContent>
                            <CardFooter>
                                {currentPlan === plan.id ? (
                                    <Button className="w-full" disabled>Current Plan</Button>
                                ) : (
                                    <AlertDialogTrigger asChild>
                                        <Button 
                                            className="w-full" 
                                            variant={plan.id !== 'free' ? 'default' : 'outline'}
                                            onClick={() => setSelectedPlan(plan)}
                                            disabled={plan.id === 'free' && currentPlan === 'free'}
                                        >
                                            {isDowngrade(plan) ? 'Downgrade' : 'Upgrade'}
                                        </Button>
                                    </AlertDialogTrigger>
                                )}
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
             {selectedPlan && (
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Plan Change Request</AlertDialogTitle>
                        <AlertDialogDescription>
                           You are requesting to {isDowngrade(selectedPlan) ? 'downgrade' : 'upgrade'} to the <strong>{selectedPlan.name}</strong> plan at <strong>{selectedPlan.price}/month</strong>. 
                           Clicking confirm will send a request to support for manual processing.
                        </AlertDialogDescription>
                         {isDowngrade(selectedPlan) && (
                                <div className="mt-2 p-3 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200 text-sm">
                                    <strong>Important:</strong> Downgrading will limit your account to {selectedPlan.projectLimit} projects. While your existing data will not be deleted, you will only be able to access the {selectedPlan.projectLimit} most recent projects.
                                </div>
                           )}
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setSelectedPlan(null)} disabled={isSubmitting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handlePlanChangeRequest} disabled={isSubmitting}>
                            {isSubmitting ? 'Submitting...' : 'Confirm Request'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
             )}
        </AlertDialog>
    );
}
