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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';


const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const createFormSchema = (t: (key: string) => string) => z.object({
  name: z.string().min(1, t('players.addPlayerForm.validation.nameRequired')).max(50, t('players.addPlayerForm.validation.nameMaxLength')),
  avatarFile: z
    .any()
    .refine((files) => !files || files?.length === 0 || files?.[0]?.size <= MAX_FILE_SIZE, t('players.addPlayerForm.validation.fileSize'))
    .refine(
      (files) => !files || files?.length === 0 || ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      t('players.addPlayerForm.validation.fileType')
    ),
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
    },
  });

  useEffect(() => {
    form.reset({
      name: player.name,
    });
  }, [player, isOpen, form]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    const avatarFile = values.avatarFile?.[0];
    updatePlayer(player.id, {
      name: values.name,
      avatarFile,
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
        <div className="flex justify-center py-4">
             <Avatar className="h-24 w-24 border-4 border-primary">
                <AvatarImage src={player.avatarUrl} alt={player.name} />
                <AvatarFallback className="text-3xl">
                    {player.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
            </Avatar>
        </div>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              {t('players.addPlayerForm.nameLabel')}
            </Label>
            <Input
              id="name"
              {...form.register('name')}
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="avatarFile">
              {t('players.editPlayerForm.uploadLabel')}
            </Label>
            <Input
              id="avatarFile"
              type="file"
              accept="image/*"
              className="file:text-primary-foreground"
              {...form.register('avatarFile')}
            />
            {form.formState.errors.avatarFile && (
              <p className="text-sm text-destructive mt-1">{(form.formState.errors.avatarFile.message as string)}</p>
            )}
          </div>
          <DialogFooter className="pt-4">
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
