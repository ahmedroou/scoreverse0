
"use client"

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useLanguage } from '@/hooks/use-language';
import { KeySquare, Loader2 } from 'lucide-react';

const createFormSchema = (t: (key: string) => string) => z.object({
  inviteCode: z.string().min(1, t('spaces.joinDialog.validation.codeRequired')),
});

interface JoinSpaceDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function JoinSpaceDialog({ isOpen, onOpenChange }: JoinSpaceDialogProps) {
  const { joinSpaceWithCode } = useAppContext();
  const { t } = useLanguage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { inviteCode: "" },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    const success = await joinSpaceWithCode(values.inviteCode);
    setIsSubmitting(false);
    if (success) {
      form.reset();
      onOpenChange(false);
    }
  };

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
      setIsSubmitting(false);
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary flex items-center gap-2"><KeySquare /> {t('spaces.joinDialog.title')}</DialogTitle>
          <DialogDescription>
            {t('spaces.joinDialog.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="invite-code">
              {t('spaces.joinDialog.codeLabel')}
            </Label>
            <Input
              id="invite-code"
              {...form.register('inviteCode')}
              placeholder={t('spaces.joinDialog.codePlaceholder')}
              disabled={isSubmitting}
            />
            {form.formState.errors.inviteCode && (
              <p className="text-sm text-destructive">{form.formState.errors.inviteCode.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin me-2"/>}
              {t('spaces.joinSpace')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
