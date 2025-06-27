
"use client";

import React, { useEffect } from 'react';
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
import type { Player } from '@/types';
import { useLanguage } from '@/hooks/use-language';


const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('players.addPlayerForm.validation.nameRequired')).max(50, t('players.addPlayerForm.validation.nameMaxLength')),
  avatarUrl: z.string().url(t('players.addPlayerForm.validation.avatarUrl')).optional().or(z.literal('')),
});

interface EditPlayerFormProps {
  player: Player;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlayerForm({ player, isOpen, onOpenChange }: EditPlayerFormProps) {
  const { updatePlayer } = useAppContext();
  const { t } = useLanguage();
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: player.name,
      avatarUrl: player.avatarUrl || '',
    },
  });

  useEffect(() => {
    form.reset({
      name: player.name,
      avatarUrl: player.avatarUrl || '',
    });
  }, [player, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updatePlayer(player.id, {
      name: values.name,
      avatarUrl: values.avatarUrl || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">{t('players.editPlayerForm.title')}</DialogTitle>
          <DialogDescription>
            {t('players.editPlayerForm.description', {playerName: player.name})}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('players.addPlayerForm.nameLabel')}
            </Label>
            <Input
              id="name"
              {...form.register('name')}
              className="col-span-3"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarUrl">
              {t('players.addPlayerForm.avatarLabel')}
            </Label>
            <Input
              id="avatarUrl"
              {...form.register('avatarUrl')}
              className="col-span-3"
              placeholder={t('players.addPlayerForm.avatarPlaceholder')}
            />
            {form.formState.errors.avatarUrl && (
              <p className="text-sm text-destructive">{form.formState.errors.avatarUrl.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('common.save')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
