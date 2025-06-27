
"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { PlayerStats } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useLanguage } from '@/hooks/use-language';

interface PlayerStatsChartProps {
  stats: PlayerStats;
}

export function PlayerStatsChart({ stats }: PlayerStatsChartProps) {
  const { t } = useLanguage();
  const chartData = stats.gameStats.map(gs => ({
    name: gs.game.name,
    [t('stats.playerPage.wins')]: gs.wins,
    [t('stats.playerPage.losses')]: gs.losses,
  }));

  return (
    <Card className="col-span-1 md:col-span-2 bg-card">
      <CardHeader>
        <CardTitle>{t('stats.playerPage.performanceByGame')}</CardTitle>
        <CardDescription>{t('stats.playerPage.performanceDesc')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.5)" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                borderColor: 'hsl(var(--border))',
                borderRadius: 'var(--radius)',
              }}
            />
            <Legend wrapperStyle={{fontSize: "14px"}} />
            <Bar dataKey={t('stats.playerPage.wins')} fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            <Bar dataKey={t('stats.playerPage.losses')} fill="hsl(var(--destructive) / 0.6)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
