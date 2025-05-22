
"use client";

import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'; // Added CardDescription
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, BarChart3, History, Users, Swords, Layers, LayoutDashboard, UserCircle, Settings } from 'lucide-react';
import Image from 'next/image';

export default function DashboardPage() {
  const { currentUser, isClient, getActiveSpace } = useAppContext();
  const activeSpace = getActiveSpace();

  if (!isClient || isLoadingAuth) { // Added isLoadingAuth check
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading user data...</p>
      </div>
    );
  }
  
  // Added this block
  if (!currentUser && !isLoadingAuth) {
     return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Please log in to view the dashboard.</p>
         <Link href="/auth" passHref legacyBehavior>
            <Button className="mt-4">Go to Login</Button>
         </Link>
      </div>
    );
  }
  
  // Make sure currentUser is not null before trying to access its properties
  if (!currentUser) return null; 


  const quickAccessItems = [
    { title: "Record New Match", href: "/add-result", icon: PlusCircle, description: "Log a recently played game." },
    { title: "View Leaderboards", href: "/leaderboards", icon: BarChart3, description: "See who is on top." },
    { title: "Match History", href: "/match-history", icon: History, description: "Review past games." },
    { title: "Manage Players", href: "/players", icon: Users, description: "Add or edit player profiles." },
    { title: "Game Library", href: "/games", icon: Swords, description: "Browse available games." },
    { title: "Manage Spaces", href: "/spaces", icon: Layers, description: "Organize by groups or contexts." },
  ];

  return (
    <div className="container mx-auto py-8">
      <header className="mb-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary mb-2">
                  Welcome back, {currentUser.username}!
                </h1>
                <p className="text-lg text-muted-foreground">
                  You are currently in {activeSpace ? `the "${activeSpace.name}" space` : "your Global context (no space selected)"}.
                </p>
            </div>
             {activeSpace && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 border border-border rounded-lg bg-card shadow-sm whitespace-nowrap">
                    <Layers className="h-5 w-5 text-accent"/>
                    <span>Active Space: <strong className="text-accent">{activeSpace.name}</strong></span>
                </div>
            )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickAccessItems.map((item) => (
          <Card key={item.title} className="hover:shadow-xl transition-shadow duration-200 ease-in-out bg-card border-border hover:border-primary/70 flex flex-col">
            <CardHeader className="flex flex-row items-center space-x-4 pb-3">
              <item.icon className="w-8 h-8 text-primary" />
              <CardTitle className="text-xl font-semibold text-card-foreground">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-muted-foreground mb-4">{item.description}</p>
            </CardContent>
            <CardContent className="pt-0">
               <Link href={item.disabled ? "#" : item.href} passHref legacyBehavior>
                <Button 
                    variant="default" 
                    className={`w-full ${item.disabled ? 'bg-muted hover:bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary hover:bg-primary/90 text-primary-foreground'}`}
                    disabled={item.disabled}
                    aria-disabled={item.disabled}
                >
                  {item.disabled ? "Coming Soon" : `Go to ${item.title}`}
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div className="mt-12 p-6 bg-card border border-border rounded-lg shadow-md flex flex-col md:flex-row items-center gap-6">
        <div className="w-full md:w-1/3 flex justify-center">
            <Image 
                src="https://placehold.co/300x250.png" 
                alt="Fun gaming dashboard illustration" 
                width={300} 
                height={250} 
                className="object-contain rounded-md"
                data-ai-hint="gaming community"
            />
        </div>
        <div className="w-full md:w-2/3">
            <h2 className="text-2xl font-semibold text-primary mb-3">What's Next?</h2>
            <p className="text-muted-foreground mb-4">
                Explore your spaces, record new matches, or dive into the leaderboards. Use the "Manage Spaces" card to create new contexts for your games or switch between existing ones.
            </p>
            <Link href="/spaces" passHref legacyBehavior>
                <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                    <Layers className="mr-2 h-4 w-4" /> Manage Your Spaces
                </Button>
            </Link>
        </div>
      </div>

    </div>
  );
}

// Added isLoadingAuth to prevent premature rendering
const isLoadingAuth = useAppContext().isLoadingAuth;
