
import { redirect } from 'next/navigation';

export default function HomePage() {
  // Redirect to the game library page as the main landing experience
  redirect('/games');
  
  // Alternatively, you could render a dashboard or welcome page here.
  // For now, a simple redirect is sufficient.
  // return (
  //   <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] text-center">
  //     <h1 className="text-5xl font-bold text-primary mb-4">Welcome to ScoreVerse!</h1>
  //     <p className="text-xl text-muted-foreground">
  //       Track your game scores, climb the leaderboards, and settle rivalries.
  //     </p>
  //   </div>
  // );
}
