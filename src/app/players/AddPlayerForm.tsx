
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

const formSchema = z.object({
  name: z.string().min(1, "Player name cannot be empty.").max(50, "Player name is too long (max 50 characters)."),
});

interface AddPlayerFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPlayerForm({ isOpen, onOpenChange }: AddPlayerFormProps) {
  const { addPlayer } = useAppContext();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addPlayer(values.name);
    form.reset(); // Reset form fields
    onOpenChange(false); // Close dialog on submit
  };

  // Reset form when dialog opens/closes to clear previous input
  React.useEffect(() => {
    if (!isOpen) {
      form.reset();
    }
  }, [isOpen, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">Add New Player</DialogTitle>
          <DialogDescription>
            Enter the name for the new player. Click add when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-player-name" className="text-right">
              Player Name
            </Label>
            <Input
              id="new-player-name"
              {...form.register('name')}
              className="col-span-3"
              placeholder="E.g., 'Shadow Striker'"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Add Player</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
