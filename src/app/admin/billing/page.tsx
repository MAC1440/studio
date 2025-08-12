
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { type Organization } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Star, Briefcase } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { updateOrganizationPlan } from '@/lib/firebase/organizations';
import { useToast } from '@/hooks/use-toast';

export default function BillingPage() {
    const { userData } = useAuth();
    const [organization, setOrganization] = useState<Organization | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
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

    const handlePlanChange = async (newPlanId: 'free' | 'pro' | 'enterprise') => {
        if (!userData?.organizationId || newPlanId === organization?.subscriptionPlan) return;
        
        if (newPlanId === 'enterprise') {
            // In a real app, this would open a contact form or a different flow.
            toast({ title: "Contact Sales", description: "Please get in touch with us to discuss Enterprise options."});
            return;
        }

        setIsSubmitting(true);
        try {
            await updateOrganizationPlan(userData.organizationId, newPlanId);
            setOrganization(prev => prev ? { ...prev, subscriptionPlan: newPlanId } : null);
            toast({
                title: "Plan Updated",
                description: `You have successfully switched to the ${newPlanId.charAt(0).toUpperCase() + newPlanId.slice(1)} plan.`
            })
        } catch (error) {
            console.error("Failed to update plan:", error);
            toast({ title: "Error", description: "Could not update your subscription plan.", variant: "destructive"});
        } finally {
            setIsSubmitting(false);
        }
    }

    const currentPlan = organization?.subscriptionPlan || 'free';

    const plans = [
        {
            name: 'Free',
            price: '$0',
            features: ['3 Projects', '25 Tickets', 'Basic Reporting', 'Community Support'],
            icon: Briefcase,
            id: 'free' as const,
        },
        {
            name: 'Pro',
            price: '$25',
            features: ['Unlimited Projects', 'Unlimited Tickets', 'Advanced Reporting', 'Priority Email Support', 'Client Portal'],
            icon: Star,
            id: 'pro' as const,
        },
        {
            name: 'Enterprise',
            price: 'Custom',
            features: ['All Pro Features', 'Dedicated Account Manager', 'On-premise Options', 'Custom Integrations', '24/7 Support'],
            icon: CheckCircle,
            id: 'enterprise' as const,
        }
    ];

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
                                {plan.id !== 'enterprise' && <span className="text-muted-foreground">/month</span>}
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
                                <Button 
                                    className="w-full" 
                                    variant={plan.id === 'pro' ? 'default' : 'outline'}
                                    onClick={() => handlePlanChange(plan.id)}
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && 'Updating...'}
                                    {!isSubmitting && (plan.id === 'pro' ? 'Upgrade' : 'Downgrade')}
                                    {plan.id === 'enterprise' && !isSubmitting && 'Contact Sales'}
                                </Button>
                            )}
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
