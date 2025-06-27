
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
  name: z.string().min(1, t('spaces.addForm.validation.nameRequired')).max(50, t('spaces.addForm.validation.nameMaxLength')),
});

interface AddSpaceFormProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSpaceForm({ isOpen, onOpenChange }: AddSpaceFormProps) {
  const { addSpace } = useAppContext();
  const { t } = useLanguage();
  const formSchema = createFormSchema(t);

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
          <DialogTitle className="text-primary">{t('spaces.addForm.title')}</DialogTitle>
          <DialogDescription>
            {t('spaces.addForm.description')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="new-space-name">
              {t('spaces.addForm.nameLabel')}
            </Label>
            <Input
              id="new-space-name"
              {...form.register('name')}
              placeholder={t('spaces.addForm.namePlaceholder')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" onClick={() => form.reset()}>{t('common.cancel')}</Button>
            </DialogClose>
            <Button type="submit" className="bg-primary hover:bg-primary/90 text-primary-foreground">{t('spaces.createSpace')}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
