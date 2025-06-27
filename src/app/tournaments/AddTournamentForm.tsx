
"use client";

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  name: z.string().min(1, t('tournaments.addForm.validation.nameRequired')).max(50, t('tournaments.addForm.validation.nameMaxLength')),
  gameId: z.string().min(1, t('tournaments.addForm.validation.gameRequired')),
  targetPoints: z.coerce.number().min(1, t('tournaments.addForm.validation.targetPointsMin')),
});

interface AddTournamentFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddTournamentForm({ isOpen, onOpenChange }: AddTournamentFormProps) {
  const { addTournament, games } = useAppContext();
  const { t } = useLanguage();
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      gameId: "",
      targetPoints: 100,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addTournament(values);
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
          <DialogTitle className="text-primary">{t('tournaments.addForm.title')}</DialogTitle>
          <DialogDescription>
            {t('tournaments.addForm.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="tour-name">{t('tournaments.addForm.nameLabel')}</Label>
            <Input id="tour-name" {...form.register('name')} placeholder={t('tournaments.addForm.namePlaceholder')} />
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="tour-game">{t('tournaments.addForm.gameLabel')}</Label>
            <Controller
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="tour-game">
                    <SelectValue placeholder={t('tournaments.addForm.gamePlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map(game => (
                      <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {form.formState.errors.gameId && <p className="text-sm text-destructive mt-1">{form.formState.errors.gameId.message}</p>}
          </div>

          <div>
            <Label htmlFor="targetPoints">{t('tournaments.addForm.targetPointsLabel')}</Label>
            <Input id="targetPoints" type="number" {...form.register('targetPoints')} />
            {form.formState.errors.targetPoints && <p className="text-sm text-destructive mt-1">{form.formState.errors.targetPoints.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit">{t('tournaments.createButton')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
