
"use client";

import { useAppContext } from '@/context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { PlusCircle, BarChart3, History, Users, Swords, Layers, LayoutDashboard, UserCircle } from 'lucide-react'; // Added Layers for Spaces
import Image from 'next/image';

export default function DashboardPage() {
  const { currentUser, isClient } = useAppContext();

  if (!isClient || !currentUser) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(spacing.16))]">
        <UserCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

  const quickAccessItems = [
    { title: "Record New Match", href: "/add-result", icon: PlusCircle, description: "Log a recently played game." },
    { title: "View Leaderboards", href: "/leaderboards", icon: BarChart3, description: "See who is on top." },
    { title: "Match History", href: "/match-history", icon: History, description: "Review past games." },
    { title: "Manage Players", href: "/players", icon: Users, description: "Add or edit player profiles." },
    { title: "Game Library", href: "/games", icon: Swords, description: "Browse available games." },
    { title: "Manage Spaces", href: "/spaces", icon: Layers, description: "Organize by groups (Coming Soon).", disabled: true },
  ];

  return (
    <div className="container mx-auto py-8">
      <header className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-primary mb-3">
          Welcome back, {currentUser.username}!
        </h1>
        <p className="text-lg text-muted-foreground">
          Ready to track some scores or check out the competition?
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {quickAccessItems.map((item) => (
          <Card key={item.title} className="hover:shadow-lg transition-shadow duration-200 ease-in-out bg-card border-border hover:border-primary/70 flex flex-col">
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
            <h2 className="text-2xl font-semibold text-primary mb-3">Ready for More?</h2>
            <p className="text-muted-foreground mb-4">
                ScoreVerse is constantly evolving. Soon you'll be able to create 'Spaces' to manage different groups or leagues, customize game rules further, and much more. Stay tuned!
            </p>
            <Button variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                Provide Feedback (Not Implemented)
            </Button>
        </div>
      </div>

    </div>
  );
}
