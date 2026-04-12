import { GameProvider, useGame } from '@/context/GameContext';
import WelcomeScreen from '@/components/game/WelcomeScreen';
import CategorySelect from '@/components/game/CategorySelect';
import QuizScreen from '@/components/game/QuizScreen';
import ResultsScreen from '@/components/game/ResultsScreen';

const GameRouter = () => {
  const { state } = useGame();

  switch (state.gamePhase) {
    case 'welcome':
      return <WelcomeScreen />;
    case 'categories':
      return <CategorySelect />;
    case 'playing':
      return <QuizScreen />;
    case 'results':
      return <ResultsScreen />;
    default:
      return <WelcomeScreen />;
  }
};

const Index = () => {
  return (
    <GameProvider>
      <div className="min-h-screen bg-stage">
        <GameRouter />
      </div>
    </GameProvider>
  );
};

export default Index;
