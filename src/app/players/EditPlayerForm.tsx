
"use client";

import React, { useState, useEffect } from 'react';
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

const formSchema = z.object({
  name: z.string().min(1, "Player name cannot be empty.").max(50, "Player name is too long."),
});

interface EditPlayerFormProps {
  player: Player;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPlayerForm({ player, isOpen, onOpenChange }: EditPlayerFormProps) {
  const { updatePlayer } = useAppContext();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: player.name,
    },
  });

  useEffect(() => {
    // Reset form if player changes or dialog reopens
    form.reset({ name: player.name });
  }, [player, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updatePlayer(player.id, values.name);
    onOpenChange(false); // Close dialog on submit
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">Edit Player</DialogTitle>
          <DialogDescription>
            Change the name for {player.name}. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-right">
              Player Name
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
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Save Changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
