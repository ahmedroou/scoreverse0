
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Users, Trash2, ShieldAlert, ShieldCheck, Crown } from 'lucide-react';
import Link from 'next/link';
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
import type { UserAccount } from '@/types';
import { useLanguage } from '@/hooks/use-language';
import { Badge } from '@/components/ui/badge';

// Helper function from players page
const stringToHslColor = (str: string, s: number, l: number): string => {
  if (!str) return `hsl(0, ${s}%, ${l}%)`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = hash % 360;
  return `hsl(${h}, ${s}%, ${l}%)`;
};

export default function ManageUsersPage() {
  const { allUsers, deleteUserAccount, isClient, currentUser } = useAppContext();
  const { t } = useLanguage();
  const router = useRouter();
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  const sortedUsers = useMemo(() => {
    if (!allUsers) return [];
    return [...allUsers].sort((a, b) => a.username.localeCompare(b.username));
  }, [allUsers]);

  if (!isClient) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ms-2">{t('common.loading')}</span></div>;
  }
  
  if (!currentUser) {
    router.push('/auth');
    return null;
  }

  if (!currentUser.isAdmin) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">{t('draw.accessDenied')}</CardTitle>
                    <CardDescription>{t('users.toasts.permissionDeniedDesc')}</CardDescription>
                </CardHeader>
                <CardContent>
                     <Link href="/dashboard" passHref legacyBehavior>
                        <Button className="mt-4 w-full">{t('dashboard.goTo', {page: t('sidebar.dashboard')})}</Button>
                     </Link>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const confirmDelete = () => {
      if (userToDelete) {
          deleteUserAccount(userToDelete.id);
          setUserToDelete(null);
      }
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Users /> {t('users.pageTitle')}
          </CardTitle>
          <CardDescription>
            {t('users.pageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sortedUsers.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('users.noUsers')}</p>
          ) : (
            <ul className="space-y-3">
              {sortedUsers.map((user) => (
                <li
                  key={user.id}
                  className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-grow min-w-0">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" alt={user.username} />
                      <AvatarFallback style={{ backgroundColor: stringToHslColor(user.username, 50, 60) }}>
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="truncate">
                        <div className="font-medium text-lg text-card-foreground truncate flex items-center gap-2">
                            {user.username}
                            {user.isAdmin && <Badge variant="destructive" className="text-xs"><ShieldCheck className="h-3 w-3 me-1"/> Admin</Badge>}
                            {user.isPremium && <Badge variant="premium" className="text-xs"><Crown className="h-3 w-3 me-1"/> Pro</Badge>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">{user.email || user.id}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button 
                        variant="destructive" 
                        size="sm" 
                        onClick={() => setUserToDelete(user)}
                        disabled={user.id === currentUser.id}
                        className="bg-destructive/80 hover:bg-destructive text-destructive-foreground"
                    >
                      <Trash2 className="h-4 w-4 me-1 sm:me-2" />
                      <span className="hidden sm:inline">{t('common.delete')}</span>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      
      {userToDelete && (
        <AlertDialog open={!!userToDelete} onOpenChange={() => setUserToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="text-destructive h-6 w-6"/>
                {t('users.deleteConfirmTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('users.deleteConfirmDescription', {username: userToDelete.username})}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setUserToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {t('users.deleteButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
