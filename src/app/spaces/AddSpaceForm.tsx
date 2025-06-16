
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
  name: z.string().min(1, "Space name cannot be empty.").max(50, "Space name is too long (max 50 characters)."),
});

interface AddSpaceFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSpaceForm({ isOpen, onOpenChange }: AddSpaceFormProps) {
  const { addSpace } = useAppContext();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    addSpace(values.name);
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
          <DialogTitle className="text-primary">Create New Space</DialogTitle>
          <DialogDescription>
            Enter a name for your new space. This helps organize your games and leaderboards.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-space-name">
              Space Name
            </Label>
            <Input
              id="new-space-name"
              {...form.register('name')}
              placeholder="E.g., 'Weekend Warriors' or 'Family Game Night'"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => form.reset()}>Cancel</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">Create Space</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
