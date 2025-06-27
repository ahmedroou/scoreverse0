
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
import { Sparkles, LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useLanguage } from '@/hooks/use-language';

const createFormSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('auth.invalidEmail')),
  password: z.string().min(6, t('auth.passwordLength')),
});

export function AuthForm() {
  const { login, signup, isLoadingAuth, firebaseConfigured } = useAppContext();
  const { t } = useLanguage();
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const formSchema = createFormSchema(t);
  type AuthFormValues = z.infer<typeof formSchema>;
  
  const form = useForm<AuthFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: AuthFormValues) => {
    setError(null);
    try {
      const result = isLoginMode 
        ? await login(values.email, values.password)
        : await signup(values.email, values.password);

      if (!result.success && result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred during submission.");
    }
  };

  const isSubmitting = form.formState.isSubmitting || isLoadingAuth;

  return (
    <Card className="w-full max-w-md shadow-xl bg-card border-border">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <Sparkles className="h-12 w-12 text-primary" />
        </div>
        <CardTitle className="text-3xl font-bold text-primary">
          {isLoginMode ? t('auth.welcomeBack') : t('auth.joinScoreVerse')}
        </CardTitle>
        <CardDescription>
          {isLoginMode ? t('auth.loginPrompt') : t('auth.signupPrompt')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
            <Alert variant="destructive">
              <AlertTitle>{t('auth.authError')}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="email">{t('auth.emailLabel')}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t('auth.emailPlaceholder')}
              {...form.register('email')}
              className="mt-1"
              disabled={isSubmitting || !firebaseConfigured}
            />
            {form.formState.errors.email && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
            <div className="relative mt-1">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder={t('auth.passwordPlaceholder')}
                {...form.register('password')}
                disabled={isSubmitting || !firebaseConfigured}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute end-1 top-1/2 -translate-y-1/2 h-7 px-2"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                disabled={isSubmitting || !firebaseConfigured}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            {form.formState.errors.password && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground text-lg py-3" disabled={isSubmitting || !firebaseConfigured}>
            {isSubmitting ? t('auth.processing') : (isLoginMode ? <><LogIn className="me-2 h-5 w-5" /> {t('auth.loginButton')}</> : <><UserPlus className="me-2 h-5 w-5" /> {t('auth.signupButton')}</>)}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col items-center gap-4">
        <Button variant="link" onClick={() => { if (!isSubmitting) {setIsLoginMode(!isLoginMode); setError(null); form.reset();} }} className="text-sm text-accent" disabled={isSubmitting}>
          {isLoginMode ? t('auth.noAccount') : t('auth.hasAccount')}
        </Button>
      </CardFooter>
    </Card>
  );
}
