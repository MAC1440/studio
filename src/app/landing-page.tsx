
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { GanttChartSquare, FileText, DollarSign, MessageSquare, Users, AreaChart, PlayCircle, ShieldCheck, Lock, Flame, ChevronUp, Equal, CheckCircle, Zap } from 'lucide-react';
import Image from 'next/image';
import logo from '../../public/logos/logo.png';
import darkLogo from '../../public/logos/brand-dark.png';
import lightLogo from '../../public/logos/brand_light.png';
import placeholderLogo from '../../public/logos/placeholder-logo.svg';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';

const MockKanbanTicket = ({ title, priority, assignedTo, tag }: { title: string, priority: 'critical' | 'medium' | 'low', assignedTo: string, tag: string }) => {
    const priorityIcons = {
        critical: <Flame className="h-4 w-4 text-red-500" />,
        medium: <ChevronUp className="h-4 w-4 text-yellow-500" />,
        low: <Equal className="h-4 w-4 text-green-500" />,
    }

    return (
        <Card className="p-2 shadow-sm">
            <p className="text-xs font-semibold mb-2">{title}</p>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                    {priorityIcons[priority]}
                    <Badge variant="secondary" className="text-xs">{tag}</Badge>
                </div>
                <Avatar className="h-5 w-5">
                    <AvatarFallback>{assignedTo.charAt(0)}</AvatarFallback>
                </Avatar>
            </div>
        </Card>
    )
}

const features = [
  {
    icon: <GanttChartSquare className="h-8 w-8 text-primary" />,
    title: 'Visualize Your Workflow',
    description: 'Track deadlines effortlessly with our intuitive Kanban boards. Drag, drop, and see your project progress in real-time.',
    component: (
        <div className="w-full bg-muted/50 p-4 rounded-lg border overflow-hidden pointer-events-none">
            <div className="flex gap-4">
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-bold">To Do</p>
                    <MockKanbanTicket title="Design landing page mockups" priority="critical" assignedTo="S" tag="Design" />
                    <MockKanbanTicket title="Develop user auth flow" priority="medium" assignedTo="J" tag="Dev" />
                </div>
                <div className="flex-1 space-y-2">
                    <p className="text-sm font-bold">In Progress</p>
                    <MockKanbanTicket title="Create database schema" priority="medium" assignedTo="M" tag="Backend" />
                </div>
            </div>
        </div>
    )
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'Seamless Client Portal',
    description: 'Give clients a dedicated space to track progress, review proposals, and pay invoices. No more endless email chains.',
    component: (
        <div className="w-full bg-muted/50 p-4 rounded-lg border overflow-hidden pointer-events-none">
            <Card>
                <CardHeader className="pb-2">
                    <CardTitle className="text-base">Project Phoenix</CardTitle>
                    <CardDescription className="text-xs">Client View</CardDescription>
                </CardHeader>
                <CardContent>
                    <Label className="text-xs">Progress</Label>
                    <Progress value={75} className="h-2 my-1"/>
                    <p className="text-xs text-muted-foreground">3 of 4 tasks complete.</p>
                     <Button size="sm" variant="outline" className="w-full mt-4 text-xs">View Details</Button>
                </CardContent>
            </Card>
        </div>
    )
  },
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    title: 'Effortless Invoicing',
    description: 'Generate professional invoices from your project data in seconds. Get paid faster and keep your finances organized.',
    component: (
        <div className="w-full bg-muted/50 p-4 rounded-lg border overflow-hidden pointer-events-none">
            <Card className="shadow-md">
                <CardHeader>
                     <CardTitle className="text-base">Invoice #INV-007</CardTitle>
                     <p className="text-xs text-muted-foreground">Due: Dec 31, 2024</p>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-between items-center">
                        <p className="text-sm">Q4 Services</p>
                        <p className="font-bold text-sm">$4,200.00</p>
                    </div>
                     <Badge className="mt-4" variant="default">Paid</Badge>
                </CardContent>
            </Card>
        </div>
    )
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Real-Time Chat',
    description: 'Keep all project communication in one place. Chat directly with clients and team members on a per-project basis.',
    component: (
        <div className="w-full bg-muted/50 p-4 rounded-lg border overflow-hidden pointer-events-none">
            <div className="space-y-3">
                <div className="flex items-start gap-2">
                     <Avatar className="h-6 w-6"><AvatarFallback>M</AvatarFallback></Avatar>
                     <div className="bg-background p-2 rounded-lg text-xs">Great work on the latest mockups!</div>
                </div>
                 <div className="flex items-start gap-2 flex-row-reverse">
                     <Avatar className="h-6 w-6"><AvatarFallback>C</AvatarFallback></Avatar>
                     <div className="bg-primary text-primary-foreground p-2 rounded-lg text-xs">Thanks! Glad you like them. Any feedback?</div>
                </div>
            </div>
        </div>
    )
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Proposal Builder',
    description: 'Create, send, and manage beautiful proposals. Get client feedback and approval directly within the app.',
    component: (
         <div className="w-full bg-muted/50 p-4 rounded-lg border overflow-hidden pointer-events-none">
             <Card>
                 <CardHeader>
                    <CardTitle className="text-base">Website Redesign Proposal</CardTitle>
                    <div className="flex items-center gap-2 pt-1">
                        <Badge variant="destructive">Changes Requested</Badge>
                        <span className="text-xs text-muted-foreground">v2</span>
                    </div>
                 </CardHeader>
                 <CardContent>
                      <Button size="sm" className="w-full text-xs">Review & Edit</Button>
                 </CardContent>
             </Card>
        </div>
    )
  },
  {
    icon: <AreaChart className="h-8 w-8 text-primary" />,
    title: 'Reports & Analytics',
    description: 'Gain insights into your project performance and team productivity with easy-to-understand reports.',
    component: (
        <div className="w-full bg-muted/50 p-4 rounded-lg border overflow-hidden pointer-events-none">
            <h3 className="text-sm font-bold mb-2">Monthly Earnings</h3>
            <div className="flex items-end gap-2 h-24">
                <div className="w-1/4 h-[50%] bg-primary/20 rounded-t-sm"></div>
                <div className="w-1/4 h-[70%] bg-primary/40 rounded-t-sm"></div>
                <div className="w-1/4 h-[60%] bg-primary/60 rounded-t-sm"></div>
                <div className="w-1/4 h-[90%] bg-primary/80 rounded-t-sm"></div>
            </div>
        </div>
    )
  },
];

const testimonials = [
  {
    quote: "BoardR has been a game-changer for my freelance business. I can finally manage everything from one place and my clients love the portal.",
    name: "Sarah K.",
    role: "Freelance Designer"
  },
  {
    quote: "Our agency switched from a clunky, expensive tool to BoardR and we haven't looked back. It's simple, powerful, and our team actually enjoys using it.",
    name: "Michael R.",
    role: "Agency Owner"
  },
  {
    quote: "Juggling multiple projects and clients used to be a nightmare. BoardR brought order to the chaos. The invoicing feature alone saves me hours every month.",
    name: "David L.",
    role: "Project Manager"
  }
];

const companyLogos = [
  { name: 'Innovate Co', src: placeholderLogo },
  { name: 'Creative Studio', src: placeholderLogo },
  { name: 'Apex Solutions', src: placeholderLogo },
  { name: 'Digital Ascent', src: placeholderLogo },
  { name: 'Momentum Works', src: placeholderLogo },
];

export default function LandingPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground items-center">
      <header className="w-full px-4 lg:px-6 h-16 flex items-center border-b sticky top-0 bg-background/95 backdrop-blur-sm z-50">
        <Link href="/" className="flex items-center justify-center">
          <Image src={logo.src} alt="BoardR Logo" width={32} height={32} />
          <span className="ml-2 text-xl font-bold">BoardR</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Features
          </Link>
          <Link
            href="#pricing"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Pricing
          </Link>
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-20 md:py-32 lg:py-40">
          <div className="container px-4 md:px-6 text-center">
            <div className="max-w-4xl mx-auto">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl/none">
                Manage Clients, Projects, and Payments — All in One Place.
              </h1>
              <p className="mt-4 text-muted-foreground md:text-xl">
                BoardR replaces your scattered tools with one simple, powerful workspace.
              </p>
              <div className="mt-6 flex flex-col gap-4 min-[400px]:flex-row justify-center">
                <Button asChild size="lg">
                  <Link href="/login">Get Started Free</Link>
                </Button>
              </div>
            </div>
            <div className="mt-12 lg:mt-16 w-full max-w-6xl mx-auto">
              <div className="relative rounded-lg shadow-2xl overflow-hidden border pointer-events-none">
                 <div className="w-full bg-muted/30 p-4 rounded-lg border overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        <Card className="lg:col-span-1">
                            <CardHeader>
                                <CardTitle className="text-base">Project Health</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <Label className="text-xs">Alpha Site Launch</Label>
                                    <Progress value={80} className="h-2 my-1" />
                                </div>
                                <div>
                                    <Label className="text-xs">Mobile App Beta</Label>
                                    <Progress value={45} className="h-2 my-1" />
                                </div>
                            </CardContent>
                        </Card>
                        <div className="lg:col-span-2 space-y-2">
                             <div className="flex gap-4">
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-bold">To Do</p>
                                    <MockKanbanTicket title="Design landing page mockups" priority="critical" assignedTo="S" tag="Design" />
                                    <MockKanbanTicket title="Develop user auth flow" priority="medium" assignedTo="J" tag="Dev" />
                                </div>
                                <div className="flex-1 space-y-2">
                                    <p className="text-sm font-bold">In Progress</p>
                                    <MockKanbanTicket title="Create database schema" priority="medium" assignedTo="M" tag="Backend" />
                                    <MockKanbanTicket title="API endpoint for tickets" priority="medium" assignedTo="M" tag="Backend" />
                                </div>
                                 <div className="flex-1 space-y-2">
                                    <p className="text-sm font-bold">Done</p>
                                    <MockKanbanTicket title="Setup project repository" priority="low" assignedTo="J" tag="DevOps" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Problem & Solution Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
            <div className="container px-4 md:px-6">
                 <div className="grid md:grid-cols-2 gap-12 items-center">
                     <div className="space-y-6">
                        <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">The Struggle is Real</div>
                        <h2 className="text-3xl font-bold tracking-tighter">Tired of Tool Overload?</h2>
                        <p className="text-muted-foreground text-lg">
                            If you're juggling spreadsheets, email, chat apps, and invoicing software, you're losing time and creating friction for your clients.
                        </p>
                        <ul className="grid gap-4">
                            <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Client Miscommunication</h3>
                                    <p className="text-muted-foreground">Scattered conversations lead to missed details and unmet expectations.</p>
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Disorganized Projects</h3>
                                    <p className="text-muted-foreground">Without a central source of truth, deadlines get missed and tasks fall through the cracks.</p>
                                </div>
                            </li>
                             <li className="flex items-start gap-3">
                                <CheckCircle className="mt-1 h-5 w-5 text-primary" />
                                <div>
                                    <h3 className="font-semibold">Wasted Admin Time</h3>
                                    <p className="text-muted-foreground">Manually creating proposals and invoices steals hours you could be billing.</p>
                                </div>
                            </li>
                        </ul>
                     </div>
                     <div className="relative pointer-events-none">
                         <div className="w-full bg-background p-4 rounded-xl shadow-lg border overflow-hidden">
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <Avatar className="h-6 w-6"><AvatarFallback>M</AvatarFallback></Avatar>
                                    <div className="bg-muted p-2 rounded-lg text-xs">Great work on the latest mockups!</div>
                                </div>
                                <div className="flex items-start gap-2 flex-row-reverse">
                                    <Avatar className="h-6 w-6"><AvatarFallback>C</AvatarFallback></Avatar>
                                    <div className="bg-primary text-primary-foreground p-2 rounded-lg text-xs">Thanks! Glad you like them. Any feedback?</div>
                                </div>
                                <Card>
                                    <CardContent className="pt-4 text-xs flex items-center justify-between">
                                        <p>Invoice #INV-008</p>
                                        <Badge variant="secondary">Sent</Badge>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                     </div>
                 </div>
            </div>
        </section>

        {/* Key Features Section */}
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                Key Features
              </div>
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl mt-2">
                Everything You Need. Nothing You Don't.
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
                BoardR is designed to be powerful yet simple, giving you the tools to manage complex projects without the clutter.
              </p>
            </div>
            <div className="mx-auto grid max-w-7xl gap-8 sm:grid-cols-2 lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className="flex flex-col gap-4 h-full">
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            {feature.icon}
                            <CardTitle className="text-xl">{feature.title}</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="flex flex-col flex-1 gap-4">
                      <p className="text-muted-foreground">{feature.description}</p>
                       <div className="overflow-hidden rounded-lg border shadow-inner flex-1 flex items-center justify-center">
                         {feature.component}
                       </div>
                    </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
             <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                Choose the Plan That's Right for You
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed mt-4">
                Start for free, and scale up as you grow. No hidden fees.
              </p>
              <div className="mt-8 flex items-center justify-center gap-4">
                  <Label htmlFor="pricing-toggle">Monthly</Label>
                  <Switch id="pricing-toggle" checked={isAnnual} onCheckedChange={setIsAnnual} />
                  <Label htmlFor="pricing-toggle">Annually (Save 20%)</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 max-w-5xl mx-auto">
                {/* Free Plan */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Free</CardTitle>
                        <CardDescription>Perfect for getting started and managing your first few projects.</CardDescription>
                        <p className="text-4xl font-bold pt-4">$0</p>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <ul className="space-y-2 text-muted-foreground flex-1">
                            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary"/> Up to 3 Projects</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary"/> Up to 3 Clients</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary"/> Basic Kanban Board</li>
                        </ul>
                        <Button className="w-full mt-auto" variant="outline" asChild><Link href="/login">Get Started</Link></Button>
                    </CardContent>
                </Card>

                {/* Startup Plan */}
                 <Card className="border-primary ring-2 ring-primary relative h-full flex flex-col">
                    <div className="absolute top-0 -translate-y-1/2 w-full flex justify-center">
                        <Badge>Most Popular</Badge>
                    </div>
                    <CardHeader>
                        <CardTitle>Startup</CardTitle>
                        <CardDescription>For growing freelancers and small teams who need more power.</CardDescription>
                         <p className="text-4xl font-bold pt-4">{isAnnual ? '$23' : '$29'}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <ul className="space-y-2 text-muted-foreground flex-1">
                            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary"/> Up to 10 Projects</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary"/> Up to 10 Clients</li>
                             <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/> Invoicing & Proposals</li>
                             <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/> Client Reports</li>
                             <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/> Priority Support</li>
                        </ul>
                        <Button className="w-full mt-auto" asChild><Link href="/login">Choose Startup</Link></Button>
                    </CardContent>
                </Card>

                {/* Pro Plan */}
                <Card className="h-full flex flex-col">
                    <CardHeader>
                        <CardTitle>Pro</CardTitle>
                        <CardDescription>Advanced features for agencies and teams that need to scale.</CardDescription>
                        <p className="text-4xl font-bold pt-4">{isAnnual ? '$47' : '$59'}<span className="text-lg text-muted-foreground font-normal">/mo</span></p>
                    </CardHeader>
                    <CardContent className="space-y-4 flex-1 flex flex-col">
                        <ul className="space-y-2 text-muted-foreground flex-1">
                             <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary"/> Unlimited Projects & Clients</li>
                            <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary"/> All Startup Features</li>
                            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/> Advanced Reports</li>
                            <li className="flex items-center gap-2"><Zap className="h-4 w-4 text-primary"/> Team Management Roles</li>
                        </ul>
                        <Button className="w-full mt-auto" variant="outline" asChild><Link href="/login">Contact Sales</Link></Button>
                    </CardContent>
                </Card>
            </div>
          </div>
        </section>
        
        {/* How it works */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
            <div className="container px-4 md:px-6">
                <div className="text-center max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get Started in 3 Simple Steps</h2>
                    <p className="mt-4 text-muted-foreground md:text-xl">
                        Go from signup to streamlined workflow in minutes.
                    </p>
                </div>
                <div className="grid md:grid-cols-3 gap-8 md:gap-12 mt-12 items-start">
                    <div className="flex flex-col items-center justify-between text-center gap-4 h-full">
                        <div className="bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold border border-primary shadow-lg">1</div>
                        <h3 className="text-xl font-bold">Create Projects</h3>
                        <p className="text-muted-foreground">Set up your projects, define tasks, and assign team members.</p>
                        <div className="rounded-lg shadow-md border w-full p-4 pointer-events-none">
                            <Label className="text-xs">Project Name</Label>
                            <Input value="New Mobile App" disabled/>
                             <Button size="sm" className="w-full mt-2 text-xs">Create Project</Button>
                        </div>
                    </div>
                     <div className="flex flex-col items-center  justify-between text-center gap-4 h-full">
                        <div className="bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold border border-primary shadow-lg">2</div>
                        <h3 className="text-xl font-bold">Collaborate with Clients</h3>
                        <p className="text-muted-foreground">Invite clients to their dedicated portal to review progress and communicate.</p>
                        <div className="rounded-lg shadow-md border w-full p-4 pointer-events-none">
                            <Label className="text-xs">Client Email</Label>
                            <Input value="client@example.com" disabled />
                            <Button size="sm" className="w-full mt-2 text-xs">Invite Client</Button>
                        </div>
                    </div>
                     <div className="flex flex-col items-center justify-between text-center gap-4 h-full">
                        <div className="bg-primary/10 text-primary rounded-full h-16 w-16 flex items-center justify-center text-2xl font-bold border border-primary shadow-lg">3</div>
                        <h3 className="text-xl font-bold">Get Paid</h3>
                        <p className="text-muted-foreground">Send invoices directly from the app and keep track of payments.</p>
                        <div className="rounded-lg shadow-md border w-full p-4 pointer-events-none">
                            <Label className="text-xs">Invoice Total</Label>
                            <Input value="$1,500.00" disabled />
                            <Button size="sm" className="w-full mt-2 text-xs">Send Invoice</Button>
                        </div>
                    </div>
                </div>
            </div>
        </section>

        {/* Final CTA */}
        <section className="w-full py-20 md:py-32">
            <div className="container px-4 md:px-6 text-center">
                 <div className="max-w-3xl mx-auto">
                    <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                       Stop Juggling. Start Building.
                    </h2>
                     <p className="mt-4 text-muted-foreground md:text-xl">
                        Join 500+ freelancers and agencies streamlining their work with BoardR today.
                    </p>
                    <div className="mt-6">
                        <Button asChild size="lg">
                            <Link href="/login">Start Free and Upgrade Anytime</Link>
                        </Button>
                    </div>
                 </div>
            </div>
        </section>
      </main>

      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} BoardR. All rights reserved.
        </p>
         <div className="flex gap-4 sm:ml-auto items-center">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4" /> SSL Secure
            </div>
             <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-4 w-4" /> Privacy Compliant
            </div>
        </div>
        <nav className="sm:ml-4 flex gap-4 sm:gap-6">
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Terms of Service
          </Link>
          <Link href="#" className="text-xs hover:underline underline-offset-4">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  );
}
