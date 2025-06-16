
"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Sparkles, LogIn, UserPlus, Info, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const formSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters.").max(20, "Username must be 20 characters or less."),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

type AuthFormValues = z.infer<typeof formSchema>;

export function AuthForm() {
  const { login, signup, isLoadingAuth } = useAppContext();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setError(null);
    let success = false;
    if (isLoginMode) {
      success = login(values.username, values.password);
      if (!success) setError("Login failed. User not found or incorrect credentials.");
    } else {
      success = signup(values.username, values.password);
      if (!success) setError("Signup failed. Username might be taken.");
    }
    // Redirect is handled by AppLayoutClient's useEffect
    if (success) {
      form.reset();
    }
  };

  return (
    <Card className="w-full max-w-md shadow-xl bg-card border-border">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">
          {isLoginMode ? 'Welcome Back!' : 'Join ScoreVerse!'}
        </CardTitle>
        <CardDescription>
          {isLoginMode ? 'Log in to continue your ScoreVerse journey.' : 'Create an account to start tracking scores.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="mx-auto w-full max-w-[300px] aspect-[3/2] rounded-md overflow-hidden my-4">
            <Image 
                src="https://placehold.co/300x200.png" 
                alt="Fun gaming illustration" 
                width={300} 
                height={200} 
                className="object-cover"
                data-ai-hint="cartoon fun"
            />
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="Enter your username"
              {...form.register('username')}
              className="mt-1"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                {...form.register('password')}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 px-2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Alert variant="default" className="border-accent bg-accent/10">
            <Info className="h-5 w-5 text-accent" />
            <AlertTitle className="text-accent">Prototype Hint</AlertTitle>
            <AlertDescription className="text-xs">
              For this demo, use any username and a password (min. 6 characters) to sign up.
              To log in, use the same credentials.
              <strong>Important:</strong> Passwords are stored in plain text in your browser's local storage for this prototype and are not secure. Do not use real passwords.
            </AlertDescription>
          </Alert>

          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isLoadingAuth || form.formState.isSubmitting}>
            {isLoadingAuth || form.formState.isSubmitting ? 'Processing...' : (isLoginMode ? <><LogIn className="mr-2 h-5 w-5" /> Log In</> : <><UserPlus className="mr-2 h-5 w-5" /> Sign Up</>)}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center">
        <Button variant="link" onClick={() => {setIsLoginMode(!isLoginMode); setError(null); form.reset();}} className="text-sm text-accent">
          {isLoginMode ? "Don't have an account? Sign Up" : "Already have an account? Log In"}
        </Button>
      </CardFooter>
    </Card>
  );
}
