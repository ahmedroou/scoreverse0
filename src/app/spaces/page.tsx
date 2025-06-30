
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Layers, PlusCircle, ShieldAlert } from 'lucide-react';
import { AddSpaceForm } from './AddSpaceForm';
import { EditSpaceForm } from './EditSpaceForm';
import { SpaceCard } from './SpaceCard';
import type { Space, SpaceRole } from '@/types';
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
import { useLanguage } from '@/hooks/use-language';
import { ManageMembersDialog } from './ManageMembersDialog';

export default function ManageSpacesPage() {
  const { 
    spaces, 
    deleteSpace, 
    activeSpaceId, 
    setActiveSpaceId, 
    isClient, 
    currentUser,
    getUserById,
    clearSpaceHistory,
  } = useAppContext();
  const { t } = useLanguage();

  const [isAddSpaceDialogOpen, setIsAddSpaceDialogOpen] = useState(false);
  const [isEditSpaceDialogOpen, setIsEditSpaceDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [managingSpace, setManagingSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [spaceToClear, setSpaceToClear] = useState<Space | null>(null);

  const handleEditClick = (space: Space) => {
    setEditingSpace(space);
    setIsEditSpaceDialogOpen(true);
  };
  
  const handleManageMembersClick = (space: Space) => {
    setManagingSpace(space);
    setIsMembersDialogOpen(true);
  };

  const handleDeleteClick = (space: Space) => {
    setSpaceToDelete(space);
  };
  
  const handleClearHistoryClick = (space: Space) => {
    setSpaceToClear(space);
  };

  const confirmDelete = () => {
    if (spaceToDelete) {
      deleteSpace(spaceToDelete.id);
      setSpaceToDelete(null); 
    }
  };
  
  const confirmClearHistory = () => {
    if (spaceToClear) {
      clearSpaceHistory(spaceToClear.id);
      setSpaceToClear(null);
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
        <span className="ms-2">{t('common.loading')}</span>
      </div>
    );
  }

  if (!currentUser) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">{t('draw.accessDenied')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('dashboard.loginPrompt')}</p>
                     <Link href="/auth" passHref legacyBehavior>
                        <Button className="mt-4 w-full">{t('dashboard.goToLogin')}</Button>
                     </Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-2xl mx-auto shadow-xl bg-card">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary flex items-center gap-2">
            <Layers /> {t('spaces.pageTitle')}
          </CardTitle>
          <CardDescription>
            {t('spaces.pageDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={() => setIsAddSpaceDialogOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 me-2" />
            {t('spaces.createSpace')}
          </Button>

          {spaces.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">{t('spaces.noSpaces')}</p>
          ) : (
            <div className="space-y-4">
              {spaces.map((space) => {
                 if (!currentUser) return null;

                 const owner = getUserById(space.ownerId);
                 
                 let role: SpaceRole | undefined;
                 // Safely check for the members property first.
                 if (space.members) {
                   role = space.members[currentUser.id];
                 }
                 // Fallback for older space data: if user is owner, role is 'owner'.
                 if (!role && space.ownerId === currentUser.id) {
                   role = 'owner';
                 }
                 
                 // If a role cannot be determined, don't render the card.
                 if (!role) return null;

                 const isOwner = role === 'owner';

                 return (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      isActive={space.id === activeSpaceId}
                      onSetActive={() => setActiveSpaceId(space.id)}
                      onEdit={() => isOwner && handleEditClick(space)}
                      onDelete={() => isOwner && handleDeleteClick(space)}
                      onClearHistory={isOwner ? () => handleClearHistoryClick(space) : undefined}
                      onManageMembers={() => isOwner && handleManageMembersClick(space)}
                      ownerUsername={owner?.username}
                      role={role}
                    />
                 )
              })}
            </div>
          )}
        </CardContent>
         <CardFooter className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground w-full">
                {activeSpaceId ? t('spaces.footerActive', {spaceName: spaces.find(s => s.id === activeSpaceId)?.name || ''}) : t('spaces.footerInactive')}
            </p>
        </CardFooter>
      </Card>

      <AddSpaceForm 
        isOpen={isAddSpaceDialogOpen}
        onOpenChange={setIsAddSpaceDialogOpen}
      />

      {editingSpace && (
        <EditSpaceForm
          space={editingSpace}
          isOpen={isEditSpaceDialogOpen}
          onOpenChange={(open) => {
            setIsEditSpaceDialogOpen(open);
            if (!open) setEditingSpace(null);
          }}
        />
      )}

      {managingSpace && (
        <ManageMembersDialog
          space={managingSpace}
          isOpen={isMembersDialogOpen}
          onOpenChange={(open) => {
            setIsMembersDialogOpen(open);
            if (!open) setManagingSpace(null);
          }}
        />
      )}

      {spaceToDelete && (
        <AlertDialog open={!!spaceToDelete} onOpenChange={(open) => !open && setSpaceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive h-6 w-6"/>{t('spaces.deleteDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('spaces.deleteDialog.description', {spaceName: spaceToDelete.name})}
                {!currentUser.isAdmin && spaces.filter(s => s.ownerId === currentUser.id).length <= 1 && " " + t('spaces.deleteDialog.mustHaveOne')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSpaceToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={!currentUser.isAdmin && spaces.filter(s => s.ownerId === currentUser.id).length <= 1 && spaces.find(s => s.id === spaceToDelete.id) !== undefined}
              >
                {t('common.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {spaceToClear && (
        <AlertDialog open={!!spaceToClear} onOpenChange={(open) => !open && setSpaceToClear(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive h-6 w-6"/>{t('spaces.toasts.clearHistoryConfirmTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                 {t('spaces.toasts.clearHistoryConfirmDescription', {spaceName: spaceToClear.name})}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSpaceToClear(null)}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmClearHistory}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {t('common.reset')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
