
"use client"

import React, { useState, useEffect, useMemo } from 'react';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useLanguage } from '@/hooks/use-language';
import type { Space, SpaceRole } from '@/types';
import { Loader2, Trash2, UserPlus, ShieldAlert } from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";


const createInviteSchema = (t: (key: string) => string) => z.object({
  email: z.string().email(t('auth.invalidEmail')),
  role: z.enum(['editor', 'viewer']),
});

interface ManageMembersDialogProps {
  space: Space;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageMembersDialog({ space, isOpen, onOpenChange }: ManageMembersDialogProps) {
    const { t } = useLanguage();
    const { inviteUserToSpace, removeUserFromSpace, updateUserRoleInSpace, getUserById, currentUser } = useAppContext();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);

    const form = useForm<z.infer<typeof createInviteSchema>>({
        resolver: zodResolver(createInviteSchema(t)),
        defaultValues: { email: '', role: 'viewer' },
    });
    
    useEffect(() => {
        if (!isOpen) {
            form.reset();
            setIsSubmitting(false);
        }
    }, [isOpen, form]);

    const handleInvite = async (values: z.infer<typeof createInviteSchema>) => {
        setIsSubmitting(true);
        await inviteUserToSpace(space.id, values.email, values.role as SpaceRole);
        setIsSubmitting(false);
        form.reset();
    };
    
    const handleRoleChange = (memberId: string, role: SpaceRole) => {
        updateUserRoleInSpace(space.id, memberId, role);
    };

    const confirmRemoveMember = () => {
        if (memberToRemove) {
            removeUserFromSpace(space.id, memberToRemove);
            setMemberToRemove(null);
        }
    };
    
    const members = useMemo(() => {
        return Object.entries(space.members)
            .map(([userId, role]) => ({
                user: getUserById(userId),
                role
            }))
            .filter(m => m.user)
            .sort((a, b) => {
                if (a.role === 'owner') return -1;
                if (b.role === 'owner') return 1;
                return a.user!.username.localeCompare(b.user!.username);
            });
    }, [space.members, getUserById]);

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] flex flex-col">
            <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2"><UserPlus />{t('spaces.membersDialog.title', {spaceName: space.name})}</DialogTitle>
            <DialogDescription>{t('spaces.membersDialog.description')}</DialogDescription>
            </DialogHeader>

            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                {/* Invite Form */}
                <form onSubmit={form.handleSubmit(handleInvite)} className="p-4 border rounded-lg space-y-4">
                    <h3 className="font-semibold">{t('spaces.membersDialog.inviteTitle')}</h3>
                    <div className="space-y-2">
                         <Label htmlFor="email-invite">{t('auth.emailLabel')}</Label>
                         <Input id="email-invite" {...form.register('email')} placeholder={t('auth.emailPlaceholder')} disabled={isSubmitting}/>
                         {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                    </div>
                    <div className="flex gap-4 items-end">
                        <div className="flex-grow">
                            <Label>{t('spaces.membersDialog.roleLabel')}</Label>
                            <Controller
                                control={form.control}
                                name="role"
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="viewer">{t('spaces.membersDialog.roles.viewer')}</SelectItem>
                                        <SelectItem value="editor">{t('spaces.membersDialog.roles.editor')}</SelectItem>
                                    </SelectContent>
                                </Select>
                                )}
                            />
                        </div>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="animate-spin" /> : t('spaces.membersDialog.inviteButton')}
                        </Button>
                    </div>
                </form>

                {/* Members List */}
                <div className="space-y-2">
                     <h3 className="font-semibold">{t('spaces.membersDialog.listTitle')}</h3>
                     <div className="space-y-2">
                        {members.map(({ user, role }) => (
                            <div key={user!.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="" alt={user!.username} />
                                        <AvatarFallback>{user!.username.substring(0,1)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-medium">{user!.username}</p>
                                        <p className="text-xs text-muted-foreground">{user!.email}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                     {role === 'owner' ? (
                                        <span className="text-sm font-semibold text-primary px-3">{t('spaces.membersDialog.roles.owner')}</span>
                                     ) : (
                                        <>
                                        <Select value={role} onValueChange={(newRole) => handleRoleChange(user!.id, newRole as SpaceRole)}>
                                            <SelectTrigger className="w-[110px] h-8 text-xs">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="viewer">{t('spaces.membersDialog.roles.viewer')}</SelectItem>
                                                <SelectItem value="editor">{t('spaces.membersDialog.roles.editor')}</SelectItem>
                                            </SelectContent>
                                        </Select>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => setMemberToRemove(user!.id)}>
                                            <Trash2 className="h-4 w-4"/>
                                        </Button>
                                        </>
                                     )}
                                </div>
                            </div>
                        ))}
                     </div>
                </div>
            </div>

            <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline">{t('common.close')}</Button></DialogClose>
            </DialogFooter>
        </DialogContent>
    </Dialog>
    {memberToRemove && (
         <AlertDialog open={!!memberToRemove} onOpenChange={() => setMemberToRemove(null)}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                    <ShieldAlert className="text-destructive h-6 w-6"/>
                    {t('spaces.membersDialog.removeConfirmTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                    {t('spaces.membersDialog.removeConfirmDesc', { memberName: getUserById(memberToRemove)?.username || '', spaceName: space.name })}
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setMemberToRemove(null)}>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                    onClick={confirmRemoveMember}
                    className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                    {t('common.delete')}
                </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    )}
    </>
  );
}
