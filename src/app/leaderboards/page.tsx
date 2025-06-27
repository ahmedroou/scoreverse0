
"use client";
import { useAppContext } from '@/context/AppContext';
import { LeaderboardTable } from '@/components/LeaderboardTable';
import { Loader2, BarChart3, AlertTriangle, Layers } from 'lucide-react'; 
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LeaderboardsPage() {
  const { games, getOverallLeaderboard, getGameLeaderboard, isClient, currentUser, getActiveSpace, spaces, getGameById } = useAppContext();
  const { t } = useLanguage();
  const activeSpace = getActiveSpace();

  const [selectedBoard, setSelectedBoard] = useState<'overall' | string>('overall');

  if (!isClient) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-theme(spacing.32))]"><Loader2 className="h-8 w-8 animate-spin text-primary" /> <span className="ms-2 text-lg">{t('common.loading')}</span></div>;
  }
  
  if (!currentUser) {
     return (
        <div className="container mx-auto py-8">
            <Card className="w-full max-w-3xl mx-auto shadow-xl bg-card">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">{t('draw.accessDenied')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('dashboard.loginPrompt')}</p>
                </CardContent>
            </Card>
        </div>
    );
  }
  
  const overallScores = getOverallLeaderboard();
  const context = activeSpace ? t('leaderboards.contextSpace', { spaceName: activeSpace.name }) : t('leaderboards.contextGlobal');

  const activeScores = selectedBoard === 'overall' 
    ? overallScores
    : getGameLeaderboard(selectedBoard);
  
  const gameForTitle = selectedBoard !== 'overall' ? getGameById(selectedBoard) : null;

  const activeTitle = selectedBoard === 'overall'
    ? `${t('leaderboards.overallLeaderboard')} ${activeSpace ? `(${activeSpace.name})` : '(Global)'}`
    : `${t('leaderboards.gameLeaderboard', {gameName: gameForTitle?.name || ''})} ${activeSpace ? `(${activeSpace.name})` : '(Global)'}`;

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-4xl font-bold tracking-tight text-primary mb-1 flex items-center gap-3"><BarChart3 /> {t('leaderboards.pageTitle')}</h1>
                <p className="text-lg text-muted-foreground">{t('leaderboards.pageDescription', {context})}</p>
            </div>
            {activeSpace && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 border border-border rounded-md bg-card">
                    <Layers className="h-5 w-5 text-accent"/>
                    <span>Active Space: <strong className="text-accent">{activeSpace.name}</strong></span>
                </div>
            )}
        </div>
      </header>

      {(games.length === 0 && overallScores.length === 0) ? (
        <Card className="text-center py-12 bg-card border-border shadow">
          <CardHeader>
            <AlertTriangle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
            <CardTitle className="text-2xl text-card-foreground">{t('leaderboards.noDataTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {t('leaderboards.noDataDescription')}
            </p>
            <p className="text-muted-foreground mt-1">
              {t('leaderboards.noDataPrompt')}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col md:flex-row gap-8">
          <aside className="md:w-64 flex-shrink-0">
            <h2 className="text-lg font-semibold mb-4 px-2">{t('leaderboards.gameList')}</h2>
            <div className="flex flex-col gap-1">
              <Button 
                variant={selectedBoard === 'overall' ? 'secondary' : 'ghost'}
                onClick={() => setSelectedBoard('overall')}
                className="justify-start px-4 py-2 h-auto text-base"
              >
                {t('leaderboards.overallRanking')}
              </Button>
              {games.map(game => (
                <Button 
                  key={game.id}
                  variant={selectedBoard === game.id ? 'secondary' : 'ghost'}
                  onClick={() => setSelectedBoard(game.id)}
                  className="justify-start px-4 py-2 h-auto text-base"
                >
                  {game.name}
                </Button>
              ))}
            </div>
          </aside>
          <main className="flex-1 min-w-0">
            <LeaderboardTable scores={activeScores} title={activeTitle} />
          </main>
        </div>
      )}
    </div>
  );
}
