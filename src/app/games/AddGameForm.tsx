
"use client";

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import type { Game } from '@/types';
import { useLanguage } from '@/hooks/use-language';

const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('games.addGameForm.validation.nameRequired')).max(50, t('games.addGameForm.validation.nameMaxLength')),
  pointsPerWin: z.coerce.number().min(0, t('games.addGameForm.validation.pointsNonNegative')),
  minPlayers: z.coerce.number().min(1, t('games.addGameForm.validation.minPlayersMin')).max(100, t('games.addGameForm.validation.minPlayersMax')),
  maxPlayers: z.coerce.number().min(0, t('games.addGameForm.validation.maxPlayersNonNegative')).max(100, t('games.addGameForm.validation.maxPlayersMax')).optional().or(z.literal('')),
  description: z.string().max(200, t('games.addGameForm.validation.descriptionMaxLength')).optional(),
}).refine(data => {
    if (data.maxPlayers && typeof data.maxPlayers === 'number' && data.maxPlayers !== 0) {
        return data.maxPlayers >= data.minPlayers;
    }
    return true;
}, {
    message: t('games.addGameForm.validation.maxPlayersGTE'),
    path: ["maxPlayers"],
});


interface AddGameFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGameForm({ isOpen, onOpenChange }: AddGameFormProps) {
  const { addGame } = useAppContext();
  const { t } = useLanguage();
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      pointsPerWin: 1,
      minPlayers: 2,
      maxPlayers: undefined,
      description: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const gameData: Omit<Game, 'id' | 'icon' | 'ownerId'> = {
        name: values.name,
        pointsPerWin: values.pointsPerWin,
        minPlayers: values.minPlayers,
        maxPlayers: values.maxPlayers === '' || values.maxPlayers === undefined || values.maxPlayers === 0 ? undefined : Number(values.maxPlayers),
        description: values.description || undefined,
    };
    addGame(gameData);
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
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">{t('games.addGameForm.title')}</DialogTitle>
          <DialogDescription>
            {t('games.addGameForm.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div>
            <Label htmlFor="game-name">{t('games.addGameForm.nameLabel')}</Label>
            <Input id="game-name" {...form.register('name')} placeholder={t('games.addGameForm.namePlaceholder')} />
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="pointsPerWin">{t('games.addGameForm.pointsLabel')}</Label>
            <Input id="pointsPerWin" type="number" {...form.register('pointsPerWin')} />
            {form.formState.errors.pointsPerWin && <p className="text-sm text-destructive mt-1">{form.formState.errors.pointsPerWin.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minPlayers">{t('games.addGameForm.minPlayersLabel')}</Label>
              <Input id="minPlayers" type="number" {...form.register('minPlayers')} />
              {form.formState.errors.minPlayers && <p className="text-sm text-destructive mt-1">{form.formState.errors.minPlayers.message}</p>}
            </div>
            <div>
              <Label htmlFor="maxPlayers">{t('games.addGameForm.maxPlayersLabel')}</Label>
              <Input id="maxPlayers" type="number" {...form.register('maxPlayers')} placeholder={t('games.addGameForm.maxPlayersPlaceholder')} />
              {form.formState.errors.maxPlayers && <p className="text-sm text-destructive mt-1">{form.formState.errors.maxPlayers.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">{t('games.addGameForm.descriptionLabel')}</Label>
            <Textarea id="description" {...form.register('description')} placeholder={t('games.addGameForm.descriptionPlaceholder')} />
            {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => form.reset()}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('games.addGameButton')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
