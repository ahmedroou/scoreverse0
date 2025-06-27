
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
import type { Space } from '@/types';
import { useLanguage } from '@/hooks/use-language';

const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('spaces.addForm.validation.nameRequired')).max(50, t('spaces.addForm.validation.nameMaxLength')),
});

interface EditSpaceFormProps {
  space: Space;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSpaceForm({ space, isOpen, onOpenChange }: EditSpaceFormProps) {
  const { updateSpace } = useAppContext();
  const { t } = useLanguage();
  const formSchema = createFormSchema(t);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: space.name,
    },
  });

  useEffect(() => {
    form.reset({ name: space.name });
  }, [space, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    updateSpace(space.id, values.name);
    onOpenChange(false); 
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-card">
        <DialogHeader>
          <DialogTitle className="text-primary">{t('spaces.editForm.title')}</DialogTitle>
          <DialogDescription>
            {t('spaces.editForm.description', {spaceName: space.name})}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-space-name">
              {t('spaces.editForm.nameLabel')}
            </Label>
            <Input
              id="edit-space-name"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
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
