
import React from 'react';
import type { LucideIcon } from 'lucide-react';
import { Swords, Users, Dices, HelpCircle, Medal, Info } from 'lucide-react';

const BilliardBallIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="10" />
  </svg>
);

const gameIconMap: Record<string, LucideIcon | React.ComponentType<any>> = {
    Swords,
    Users,
    Dices,
    HelpCircle,
    Medal,
    BilliardBallIcon,
};

export const getGameIcon = (iconName?: string) => {
    if (iconName && gameIconMap[iconName]) {
        return gameIconMap[iconName];
    }
    return Info; // Return a default fallback icon component
}
