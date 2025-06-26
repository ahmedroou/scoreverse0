
"use client";

import React, { useEffect } from 'react';
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
import type { Tournament } from '@/types';

const formSchema = z.object({
  name: z.string().min(1, "Tournament name is required.").max(50, "Name is too long."),
  gameId: z.string().min(1, "Please select a game."),
  targetPoints: z.coerce.number().min(1, "Target points must be at least 1."),
});

interface EditTournamentFormProps {
  tournament: Tournament;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditTournamentForm({ tournament, isOpen, onOpenChange }: EditTournamentFormProps) {
  const { updateTournament, games } = useAppContext();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (tournament && isOpen) {
      form.reset({
        name: tournament.name,
        gameId: tournament.gameId,
        targetPoints: tournament.targetPoints,
      });
    }
  }, [tournament, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateTournament(tournament.id, values);
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">Edit Tournament</DialogTitle>
          <DialogDescription>
            Update the details for the "{tournament.name}" tournament.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div>
            <Label htmlFor="tour-name-edit">Tournament Name</Label>
            <Input id="tour-name-edit" {...form.register('name')} />
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="tour-game-edit">Game</Label>
            <Controller
              control={form.control}
              name="gameId"
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="tour-game-edit" disabled>
                    <SelectValue placeholder="Select a game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map(game => (
                      <SelectItem key={game.id} value={game.id}>{game.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
             <p className="text-xs text-muted-foreground mt-1">Game cannot be changed after creation.</p>
            {form.formState.errors.gameId && <p className="text-sm text-destructive mt-1">{form.formState.errors.gameId.message}</p>}
          </div>

          <div>
            <Label htmlFor="targetPoints-edit">Target Points to Win</Label>
            <Input id="targetPoints-edit" type="number" {...form.register('targetPoints')} />
            {form.formState.errors.targetPoints && <p className="text-sm text-destructive mt-1">{form.formState.errors.targetPoints.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
