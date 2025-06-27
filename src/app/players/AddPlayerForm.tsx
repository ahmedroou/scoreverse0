
"use client";

import React from 'react';
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

const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('players.addPlayerForm.validation.nameRequired')).max(50, t('players.addPlayerForm.validation.nameMaxLength')),
  avatarUrl: z.string().url(t('players.addPlayerForm.validation.avatarUrl')).optional().or(z.literal('')),
});

interface AddPlayerFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlayerForm({ isOpen, onOpenChange }: AddPlayerFormProps) {
  const { addPlayer } = useAppContext();
  const { t } = useLanguage();
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      avatarUrl: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addPlayer(values.name, values.avatarUrl || undefined);
    form.reset();
    onOpenChange(false);
  };

  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">{t('players.addPlayerForm.title')}</DialogTitle>
          <DialogDescription>
            {t('players.addPlayerForm.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-player-name">
              {t('players.addPlayerForm.nameLabel')}
            </Label>
            <Input
              id="new-player-name"
              {...form.register('name')}
              placeholder={t('players.addPlayerForm.namePlaceholder')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-player-avatar">
              {t('players.addPlayerForm.avatarLabel')}
            </Label>
            <Input
              id="new-player-avatar"
              {...form.register('avatarUrl')}
              placeholder={t('players.addPlayerForm.avatarPlaceholder')}
            />
            {form.formState.errors.avatarUrl && (
              <p className="text-sm text-destructive">{form.formState.errors.avatarUrl.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => form.reset()}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('common.add')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
