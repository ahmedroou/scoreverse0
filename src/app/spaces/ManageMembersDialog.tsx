
"use client"

import React, { useState, useEffect, useMemo } from 'react';
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
import { Loader2, Trash2, UserPlus, ShieldAlert, Copy, Check, RefreshCw } from 'lucide-react';
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
import { useToast } from '@/hooks/use-toast';

const stringToHslColor = (str: string, s: number, l: number): string => {
  if (!str) return `hsl(0, ${s}%, ${l}%)`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};


interface ManageMembersDialogProps {
  space: Space;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ManageMembersDialog({ space, isOpen, onOpenChange }: ManageMembersDialogProps) {
    const { t } = useLanguage();
    const { toast } = useToast();
    const { removeMemberFromSpace, updateMemberRole, getUserById, generateInviteCode } = useAppContext();
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
    const [isCopied, setIsCopied] = useState(false);

    useEffect(() => {
        if (!isOpen) {
            setIsSubmitting(false);
        }
    }, [isOpen]);

    const handleRoleChange = (memberId: string, role: SpaceRole) => {
        updateMemberRole(space.id, memberId, role);
    };

    const confirmRemoveMember = () => {
        if (memberToRemove) {
            removeMemberFromSpace(space.id, memberToRemove);
            setMemberToRemove(null);
        }
    };
    
    const members = useMemo(() => {
        if (!space.members) return [];
        return Object.entries(space.members)
            .map(([userId, role]) => ({
                user: getUserById(userId),
                role
            }))
            .filter(m => !!m.user && m.role !== 'deleted')
            .sort((a, b) => {
                if (a.role === 'owner') return -1;
                if (b.role === 'owner') return 1;
                return a.user!.username.localeCompare(b.user!.username);
            });
    }, [space.members, getUserById]);
    
     const handleCopyToClipboard = () => {
        if (!space.inviteCode) return;
        navigator.clipboard.writeText(space.inviteCode).then(() => {
            setIsCopied(true);
            toast({ title: t('spaces.shareDialog.toasts.copied'), description: t('spaces.shareDialog.toasts.copySuccess') });
            setTimeout(() => setIsCopied(false), 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            toast({ title: t('common.error'), description: t('spaces.shareDialog.toasts.copyError'), variant: "destructive" });
        });
    };
    
    const handleRegenerateCode = async () => {
        setIsSubmitting(true);
        await generateInviteCode(space.id);
        setIsSubmitting(false);
    }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg bg-card max-h-[90vh] flex flex-col">
            <DialogHeader>
            <DialogTitle className="text-primary flex items-center gap-2"><UserPlus />{t('spaces.membersDialog.title', {spaceName: space.name})}</DialogTitle>
            <DialogDescription>{t('spaces.membersDialog.description')}</DialogDescription>
            </DialogHeader>

            <div className="flex-grow overflow-y-auto pr-2 space-y-6">
                 <div className="p-4 border rounded-lg space-y-2 bg-muted/30">
                    <Label htmlFor="invite-code-display">{t('spaces.membersDialog.inviteCodeLabel')}</Label>
                    <div className="flex items-center space-x-2">
                        <Input id="invite-code-display" value={space.inviteCode || t('spaces.membersDialog.noCode')} readOnly />
                        <Button type="button" size="icon" variant="outline" onClick={handleCopyToClipboard} disabled={!space.inviteCode}>
                            {isCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                        </Button>
                         <Button type="button" size="icon" variant="outline" onClick={handleRegenerateCode} disabled={isSubmitting}>
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        </Button>
                    </div>
                 </div>

                <div className="space-y-2">
                     <h3 className="font-semibold">{t('spaces.membersDialog.listTitle')}</h3>
                     <div className="space-y-2">
                        {members.map(({ user, role }) => (
                            <div key={user!.id} className="flex items-center justify-between p-2 rounded-md bg-muted/50">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src="" alt={user!.username} />
                                        <AvatarFallback style={{backgroundColor: stringToHslColor(user!.username, 50, 70)}}>
                                            {user!.username.substring(0,1).toUpperCase()}
                                        </AvatarFallback>
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
