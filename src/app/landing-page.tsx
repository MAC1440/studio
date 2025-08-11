
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutGrid, GanttChartSquare, FileText, DollarSign, MessageSquare, Users } from 'lucide-react';
import Image from 'next/image';
import logo from '../../public/logos/logo.png'
import darkLogo from '../../public/logos/brand-dark.png'
import lightLogo from '../../public/logos/brand_light.png'

const features = [
  {
    icon: <GanttChartSquare className="h-8 w-8 text-primary" />,
    title: 'Project Management',
    description: 'Visualize your workflow with our intuitive Kanban boards. Drag, drop, and track tasks from start to finish.',
  },
  {
    icon: <FileText className="h-8 w-8 text-primary" />,
    title: 'Client Proposals',
    description: 'Create, send, and manage beautiful proposals. Get client feedback and approval directly within the app.',
  },
  {
    icon: <DollarSign className="h-8 w-8 text-primary" />,
    title: 'Effortless Invoicing',
    description: 'Generate and send professional invoices based on project work. Keep your finances organized and get paid faster.',
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-primary" />,
    title: 'Real-Time Chat',
    description: 'Communicate directly with clients on a per-project basis. Keep all your conversations organized and accessible.',
  },
  {
    icon: <Users className="h-8 w-8 text-primary" />,
    title: 'User & Client Portals',
    description: 'Manage your internal team and provide a dedicated portal for clients to track progress and communicate.',
  },
   {
    icon: <LayoutGrid className="h-8 w-8 text-primary" />,
    title: 'Customizable Workflow',
    description: 'Tailor the platform to your needs, from custom ticket statuses to project-specific settings and reports.',
  },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-16 flex items-center border-b">
        <Link href="/" className="flex items-center justify-center">
        <Image src={logo.src} alt="BoardR Logo" width={40} height={40} />
          {/* <LayoutGrid className="h-6 w-6 text-primary" /> */}
          <span className="ml-2 text-lg font-bold">BoardR</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link
            href="#features"
            className="text-sm font-medium hover:underline underline-offset-4"
          >
            Features
          </Link>
          <Button asChild>
            <Link href="/login">Get Started</Link>
          </Button>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-muted/20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    The All-In-One Platform for Agency & Client Collaboration
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    From proposals to payments, BoardR streamlines every step of your project lifecycle. Manage tasks, communicate with clients, and keep everything organized in one place.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/login">
                      Start for Free
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto flex items-center justify-center lg:order-last ">
                <Image
                  alt="BoardR Light Logo"
                  className="block dark:hidden rounded-xl shadow-lg"
                  height="200"
                  src={lightLogo.src}
                  width="550"
                  priority
                />
                 <Image
                  alt="BoardR Dark Logo"
                  className="hidden dark:block rounded-xl shadow-lg"
                  height="200"
                  src={darkLogo.src}
                  width="550"
                  priority
                />
              </div>
            </div>
          </div>
        </section>
        <section id="features" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Key Features
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Everything You Need. Nothing You Don't.
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  BoardR is designed to be powerful yet simple, giving you the tools to manage complex projects without the clutter.
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-start gap-8 sm:grid-cols-2 md:gap-12 lg:max-w-none lg:grid-cols-3 mt-12">
              {features.map((feature, index) => (
                <Card key={index} className='h-full'>
                  <CardHeader className="flex flex-col items-start gap-4">
                    {feature.icon}
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} BoardR. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
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
