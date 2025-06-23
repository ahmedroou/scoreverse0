
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

const formSchema = z.object({
  name: z.string().min(1, "Game name cannot be empty.").max(50, "Game name is too long (max 50 chars)."),
  pointsPerWin: z.coerce.number().min(0, "Points per win must be non-negative."),
  minPlayers: z.coerce.number().min(1, "Minimum players must be at least 1.").max(100, "Max value for min players is 100."),
  maxPlayers: z.coerce.number().min(0, "Max players cannot be negative.").max(100, "Max value for max players is 100.").optional().or(z.literal('')),
  description: z.string().max(200, "Description is too long (max 200 chars).").optional(),
}).refine(data => {
    if (data.maxPlayers && typeof data.maxPlayers === 'number' && data.maxPlayers !== 0) {
        return data.maxPlayers >= data.minPlayers;
    }
    return true;
}, {
    message: "Maximum players must be greater than or equal to minimum players (or 0 for no limit).",
    path: ["maxPlayers"],
});


interface AddGameFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddGameForm({ isOpen, onOpenChange }: AddGameFormProps) {
  const { addGame } = useAppContext();
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
          <DialogTitle className="text-primary">Add New Game</DialogTitle>
          <DialogDescription>
            Enter the details for the new game to add it to the library.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          
          <div>
            <Label htmlFor="game-name">Game Name</Label>
            <Input id="game-name" {...form.register('name')} placeholder="E.g., Chess, Mario Kart" />
            {form.formState.errors.name && <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>}
          </div>

          <div>
            <Label htmlFor="pointsPerWin">Points Per Win</Label>
            <Input id="pointsPerWin" type="number" {...form.register('pointsPerWin')} />
            {form.formState.errors.pointsPerWin && <p className="text-sm text-destructive mt-1">{form.formState.errors.pointsPerWin.message}</p>}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minPlayers">Min Players</Label>
              <Input id="minPlayers" type="number" {...form.register('minPlayers')} />
              {form.formState.errors.minPlayers && <p className="text-sm text-destructive mt-1">{form.formState.errors.minPlayers.message}</p>}
            </div>
            <div>
              <Label htmlFor="maxPlayers">Max Players (optional)</Label>
              <Input id="maxPlayers" type="number" {...form.register('maxPlayers')} placeholder="Leave blank or 0 for no limit" />
              {form.formState.errors.maxPlayers && <p className="text-sm text-destructive mt-1">{form.formState.errors.maxPlayers.message}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" {...form.register('description')} placeholder="Briefly describe the game" />
            {form.formState.errors.description && <p className="text-sm text-destructive mt-1">{form.formState.errors.description.message}</p>}
          </div>

          <DialogFooter className="pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Game</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
