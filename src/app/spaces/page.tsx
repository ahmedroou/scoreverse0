
"use client";

import React, { useState, useMemo } from 'react';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Layers, PlusCircle, ShieldAlert } from 'lucide-react';
import { AddSpaceForm } from './AddSpaceForm';
import { EditSpaceForm } from './EditSpaceForm';
import { ShareSpaceDialog } from './ShareSpaceDialog';
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

export default function ManageSpacesPage() {
  const { 
    spaces, 
    deleteSpace, 
    activeSpaceId, 
    setActiveSpaceId, 
    isClient, 
    currentUser,
    getSpacesForCurrentUser,
    shareSpace,
    unshareSpace,
    getUserById,
  } = useAppContext();

  const [isAddSpaceDialogOpen, setIsAddSpaceDialogOpen] = useState(false);
  const [isEditSpaceDialogOpen, setIsEditSpaceDialogOpen] = useState(false);
  const [isShareSpaceDialogOpen, setIsShareSpaceDialogOpen] = useState(false);
  
  const [editingSpace, setEditingSpace] = useState<Space | null>(null);
  const [spaceToDelete, setSpaceToDelete] = useState<Space | null>(null);
  const [spaceToShare, setSpaceToShare] = useState<Space | null>(null);

  const userSpaces = useMemo(() => getSpacesForCurrentUser(), [getSpacesForCurrentUser]);

  const handleEditClick = (space: Space) => {
    setEditingSpace(space);
    setIsEditSpaceDialogOpen(true);
  };

  const handleDeleteClick = (space: Space) => {
    setSpaceToDelete(space);
  };

  const handleShareClick = (space: Space) => {
    setSpaceToShare(space);
    setIsShareSpaceDialogOpen(true);
  };

  const confirmDelete = () => {
    if (spaceToDelete) {
      deleteSpace(spaceToDelete.id);
      setSpaceToDelete(null); 
    }
  };

  if (!isClient) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" /> 
        <span className="ml-2">Loading spaces...</span>
      </div>
    );
  }

  if (!currentUser) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">Access Denied</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please log in to manage your spaces.</p>
                     <Link href="/auth" passHref legacyBehavior>
                        <Button className="mt-4 w-full">Go to Login</Button>
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
            <Layers /> Manage Your Spaces
          </CardTitle>
          <CardDescription>
            {currentUser.isAdmin ? "Viewing all spaces across the platform." : "Create, edit, and organize your game tracking into different spaces. The active space determines which matches and leaderboards are shown."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button onClick={() => setIsAddSpaceDialogOpen(true)} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
            <PlusCircle className="h-5 w-5 mr-2" />
            Create New Space
          </Button>

          {userSpaces.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">No spaces found. Create your first space to get started!</p>
          ) : (
            <div className="space-y-4">
              {userSpaces.map((space) => {
                 const owner = currentUser.isAdmin ? getUserById(space.ownerId) : null;
                 const canEdit = currentUser.isAdmin || currentUser.id === space.ownerId;
                 return (
                    <SpaceCard
                      key={space.id}
                      space={space}
                      isActive={space.id === activeSpaceId}
                      onSetActive={() => setActiveSpaceId(space.id)}
                      onEdit={() => canEdit && handleEditClick(space)}
                      onDelete={() => canEdit && handleDeleteClick(space)}
                      onShare={() => handleShareClick(space)}
                      ownerUsername={owner?.username}
                      canEdit={canEdit}
                    />
                 )
              })}
            </div>
          )}
        </CardContent>
         <CardFooter className="border-t border-border pt-4 text-center">
            <p className="text-xs text-muted-foreground w-full">
                {activeSpaceId ? `Current active space: "${userSpaces.find(s => s.id === activeSpaceId)?.name || 'Unknown'}"` : "No space is currently active (showing global data)."}
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
      
      {spaceToShare && (
        <ShareSpaceDialog
            space={spaceToShare}
            isOpen={isShareSpaceDialogOpen}
            onOpenChange={(open) => {
                setIsShareSpaceDialogOpen(open);
                if (!open) setSpaceToShare(null);
            }}
            onShareSpace={shareSpace}
            onUnshareSpace={unshareSpace}
        />
      )}

      {spaceToDelete && (
        <AlertDialog open={!!spaceToDelete} onOpenChange={(open) => !open && setSpaceToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2"><ShieldAlert className="text-destructive h-6 w-6"/>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete the space "{spaceToDelete.name}" and all matches associated with it. This action cannot be undone.
                {!currentUser.isAdmin && userSpaces.length <= 1 && " You must always have at least one space."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setSpaceToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                disabled={!currentUser.isAdmin && userSpaces.length <= 1 && userSpaces.find(s => s.id === spaceToDelete.id) !== undefined}
              >
                Delete Space
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}
