
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Layers, PlusCircle, ShieldAlert, UserPlus, LogIn, KeySquare } from 'lucide-react';
import { AddSpaceForm } from './AddSpaceForm';
import { EditSpaceForm } from './EditSpaceForm';
import { SpaceCard } from './SpaceCard';
import type { Space } from '@/types';
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
import { JoinSpaceDialog } from './JoinSpaceDialog';

export default function ManageSpacesPage() {
  const { 
    spaces, 
    deleteSpace, 
    activeSpaceId, 
    setActiveSpaceId, 
    isClient, 
    currentUser,
    clearSpaceHistory,
    leaveSpace
  } = useAppContext();
  const { t } = useLanguage();

  const [isAddSpaceDialogOpen, setIsAddSpaceDialogOpen] = useState(false);
  const [isEditSpaceDialogOpen, setIsEditSpaceDialogOpen] = useState(false);
  const [isMembersDialogOpen, setIsMembersDialogOpen] = useState(false);
  const [isJoinSpaceDialogOpen, setIsJoinSpaceDialogOpen] = useState(false);
  
  const [activeDialogSpace, setActiveDialogSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [spaceToClear, setSpaceToClear] = useState<Space | null>(null);
  const [spaceToLeave, setSpaceToLeave] = useState<Space | null>(null);

  const handleEditClick = (space: Space) => {
    setActiveDialogSpace(space);
    setIsEditSpaceDialogOpen(true);
  };
  
  const handleManageMembersClick = (space: Space) => {
    setActiveDialogSpace(space);
    setIsMembersDialogOpen(true);
  };
  
  const handleLeaveClick = (space: Space) => {
    setSpaceToLeave(space);
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
  
  const confirmLeaveSpace = () => {
      if (spaceToLeave) {
        leaveSpace(spaceToLeave.id);
        setSpaceToLeave(null);
      }
  }
  
  const { ownedSpaces, joinedSpaces } = useMemo(() => {
      if (!currentUser) return { ownedSpaces: [], joinedSpaces: [] };
      const owned = spaces.filter(s => s.ownerId === currentUser.id);
      const joined = spaces.filter(s => s.ownerId !== currentUser.id);
      return { ownedSpaces: owned, joinedSpaces: joined };
  }, [spaces, currentUser]);


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
                        <Button className="mt-4 w-full"><LogIn className="me-2 h-4 w-4"/> {t('dashboard.goToLogin')}</Button>
                     </Link>
                </CardContent>
            </Card>
        </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
            <h1 className="text-4xl font-bold tracking-tight text-primary flex items-center gap-2">
                <Layers /> {t('spaces.pageTitle')}
            </h1>
            <p className="text-lg text-muted-foreground">
                {t('spaces.pageDescription')}
            </p>
            </div>
            <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsJoinSpaceDialogOpen(true)}>
                    <KeySquare className="me-2 h-4 w-4"/> {t('spaces.joinSpace')}
                </Button>
                 <Button onClick={() => setIsAddSpaceDialogOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground">
                    <PlusCircle className="h-5 w-5 me-2" />
                    {t('spaces.createSpace')}
                </Button>
            </div>
        </div>

        <div className="space-y-8">
            {/* Owned Spaces */}
            <div>
                <h2 className="text-2xl font-semibold border-b pb-2 mb-4">{t('spaces.ownedByYou')}</h2>
                {ownedSpaces.length === 0 ? (
                     <p className="text-muted-foreground text-center py-4">{t('spaces.noOwnedSpaces')}</p>
                ) : (
                    <div className="space-y-4">
                    {ownedSpaces.map((space) => (
                        <SpaceCard
                        key={space.id}
                        space={space}
                        isActive={space.id === activeSpaceId}
                        isOwned={true}
                        onSetActive={() => setActiveSpaceId(space.id)}
                        onEdit={() => handleEditClick(space)}
                        onDelete={() => handleDeleteClick(space)}
                        onManageMembers={() => handleManageMembersClick(space)}
                        onClearHistory={() => handleClearHistoryClick(space)}
                        />
                    ))}
                    </div>
                )}
            </div>
             {/* Joined Spaces */}
            <div>
                <h2 className="text-2xl font-semibold border-b pb-2 mb-4">{t('spaces.joinedSpaces')}</h2>
                {joinedSpaces.length === 0 ? (
                    <p className="text-muted-foreground text-center py-4">{t('spaces.noJoinedSpaces')}</p>
                ) : (
                    <div className="space-y-4">
                    {joinedSpaces.map((space) => (
                         <SpaceCard
                            key={space.id}
                            space={space}
                            isActive={space.id === activeSpaceId}
                            isOwned={false}
                            onSetActive={() => setActiveSpaceId(space.id)}
                            onLeave={() => handleLeaveClick(space)}
                        />
                    ))}
                    </div>
                )}
            </div>
        </div>


      <AddSpaceForm 
        isOpen={isAddSpaceDialogOpen}
        onOpenChange={setIsAddSpaceDialogOpen}
      />
      
      <JoinSpaceDialog 
        isOpen={isJoinSpaceDialogOpen}
        onOpenChange={setIsJoinSpaceDialogOpen}
      />

      {activeDialogSpace && (
        <>
            <EditSpaceForm
            space={activeDialogSpace}
            isOpen={isEditSpaceDialogOpen}
            onOpenChange={(open) => {
                setIsEditSpaceDialogOpen(open);
                if (!open) setActiveDialogSpace(null);
            }}
            />
             <ManageMembersDialog
                space={activeDialogSpace}
                isOpen={isMembersDialogOpen}
                onOpenChange={(open) => {
                    setIsMembersDialogOpen(open);
                    if (!open) setActiveDialogSpace(null);
                }}
            />
        </>
      )}

      {spaceToDelete && (
        <AlertDialog open={!!spaceToDelete} onOpenChange={(open) => !open && setSpaceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive h-6 w-6"/>{t('spaces.deleteDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('spaces.deleteDialog.description', {spaceName: spaceToDelete.name})}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSpaceToDelete(null)}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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

      {spaceToLeave && (
         <AlertDialog open={!!spaceToLeave} onOpenChange={(open) => !open && setSpaceToLeave(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive h-6 w-6"/>{t('spaces.leaveDialog.title')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('spaces.leaveDialog.description', {spaceName: spaceToLeave.name})}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSpaceToLeave(null)}>{t('common.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmLeaveSpace}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {t('spaces.leaveDialog.confirmButton')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    