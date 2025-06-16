
"use client";
import { useAppContext } from '@/context/AppContext';
import { GameCard } from '@/components/GameCard';
import { Input } from "@/components/ui/input";
import { Button } from '@/components/ui/button';
import { useState, useMemo } from 'react';
import { PlusCircle, Edit3, Trash2, ShieldAlert, Loader2, Swords } from 'lucide-react';
import { AddGameForm } from './AddGameForm';
import { EditGameForm } from './EditGameForm';
import type { Game } from '@/types';
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
import { Card, CardHeader, CardTitle, CardDescription, CardFooter, CardContent } from '@/components/ui/card';
import Link from 'next/link';


export default function GameLibraryPage() {
  const { games: contextGames, isClient, currentUser, deleteGame, matches } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddGameOpen, setIsAddGameOpen] = useState(false);
  const [isEditGameOpen, setIsEditGameOpen] = useState(false);
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [gameToDelete, setGameToDelete] = useState<Game | null>(null);

  const filteredGames = useMemo(() => {
    if (!searchTerm) return contextGames;
    return contextGames.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      game.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [contextGames, searchTerm]);

  const handleEditClick = (game: Game) => {
    setEditingGame(game);
    setIsEditGameOpen(true);
  };
  
  const handleDeleteClick = (game: Game) => {
    setGameToDelete(game);
  };

  const confirmDeleteGame = () => {
    if (gameToDelete) {
      const isUsed = matches.some(match => match.gameId === gameToDelete.id);
      if (isUsed) {
        // Toast is handled by context, but good to have a direct feedback mechanism if needed
      } else {
        deleteGame(gameToDelete.id);
      }
      setGameToDelete(null);
    }
  };


  if (!isClient) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ml-2">Loading games...</span></div>;
  }

  if (!currentUser) {
    return (
       <div className="container mx-auto py-8">
           <Card className="w-full max-w-lg mx-auto shadow-xl bg-card">
               <CardHeader>
                   <CardTitle className="text-2xl font-bold text-primary">Access Denied</CardTitle>
               </CardHeader>
               <CardContent>
                   <p className="text-muted-foreground">Please log in to manage the game library.</p>
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
      <header className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-primary mb-2 flex items-center gap-2"><Swords/> Game Library</h1>
          <p className="text-lg text-muted-foreground">Browse, add, or manage games available for tracking.</p>
        </div>
        <Button onClick={() => setIsAddGameOpen(true)} className="bg-primary hover:bg-primary/90 text-primary-foreground whitespace-nowrap">
          <PlusCircle className="mr-2 h-5 w-5" /> Add New Game
        </Button>
      </header>
       <Input 
          type="text"
          placeholder="Search games..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="mb-6 max-w-md"
        />
      
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGames.map((game) => (
            <GameCard 
              key={game.id} 
              game={game}
              showAdminControls={true}
              onEdit={() => handleEditClick(game)}
              onDelete={() => handleDeleteClick(game)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-10 bg-card border border-border rounded-lg shadow">
           <Swords className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-xl text-muted-foreground">
            {searchTerm ? "No games found matching your search." : "No games in the library yet."}
          </p>
          {!searchTerm && (
            <Button onClick={() => setIsAddGameOpen(true)} className="mt-4">
              <PlusCircle className="mr-2 h-4 w-4" /> Add Your First Game
            </Button>
          )}
        </div>
      )}

      {isAddGameOpen && (
        <AddGameForm 
          isOpen={isAddGameOpen}
          onOpenChange={setIsAddGameOpen}
        />
      )}
      {isEditGameOpen && editingGame && (
        <EditGameForm
          game={editingGame}
          isOpen={isEditGameOpen}
          onOpenChange={(open) => {
            setIsEditGameOpen(open);
            if (!open) setEditingGame(null);
          }}
        />
      )}
      {gameToDelete && (
         <AlertDialog open={!!gameToDelete} onOpenChange={() => setGameToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <ShieldAlert className="text-destructive h-6 w-6"/>
                Confirm Deletion
              </AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete the game "{gameToDelete.name}"?
                {matches.some(match => match.gameId === gameToDelete.id) 
                  ? " This game is used in recorded matches and cannot be deleted. You can edit it instead."
                  : " This action cannot be undone."
                }
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setGameToDelete(null)}>Cancel</AlertDialogCancel>
              {!matches.some(match => match.gameId === gameToDelete.id) && (
                <AlertDialogAction
                  onClick={confirmDeleteGame}
                  className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                >
                  Delete Game
                </AlertDialogAction>
              )}
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

    