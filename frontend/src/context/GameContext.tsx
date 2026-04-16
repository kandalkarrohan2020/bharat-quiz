import { createContext, useContext, useReducer, useCallback, ReactNode } from 'react';
import { gameApi } from '@/services/api';
import { getTitleByScore } from '@/data/quizData';
import { FetchedQuestion, CategoryQuestionsResponse } from '@/services/api';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'medium' | 'hard';
export type GamePhase  = 'welcome' | 'categories' | 'playing' | 'results';

// The selected category shape — questions already come filtered
// and randomised from the backend, so no local filtering needed.
export interface SelectedCategory {
  id:          string;
  name:        string;
  icon:        string;
  description: string;
  color:       string;
  questions:   FetchedQuestion[];
}

export interface GameState {
  gamePhase:            GamePhase;
  playerName:           string;
  playerEmail:          string;
  playerContact:        string;
  difficulty:           Difficulty;
  selectedCategory:     SelectedCategory | null;
  currentQuestionIndex: number;
  score:                number;
  timePerQuestion:      number;
  resultSaved:          boolean;
  resultSaving:         boolean;
}

type GameAction =
  | { type: 'SET_PLAYER_INFO'; name: string; email: string; contact: string }
  | { type: 'SET_DIFFICULTY'; difficulty: Difficulty }
  | { type: 'SELECT_CATEGORY'; category: SelectedCategory }
  | { type: 'ANSWER_QUESTION'; correct: boolean }
  | { type: 'NEXT_QUESTION' }
  | { type: 'TIME_OUT' }
  | { type: 'SET_RESULT_SAVING'; saving: boolean }
  | { type: 'SET_RESULT_SAVED' }
  | { type: 'RESET_GAME' };

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const timeForDifficulty = (d: Difficulty): number => {
  if (d === 'easy')   return 60;
  if (d === 'medium') return 45;
  return 30;
};

// ─────────────────────────────────────────────────────────────
// Initial state
// ─────────────────────────────────────────────────────────────

const initialState: GameState = {
  gamePhase:            'welcome',
  playerName:           '',
  playerEmail:          '',
  playerContact:        '',
  difficulty:           'medium',
  selectedCategory:     null,
  currentQuestionIndex: 0,
  score:                0,
  timePerQuestion:      20,
  resultSaved:          false,
  resultSaving:         false,
};

// ─────────────────────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────────────────────

function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {

    case 'SET_PLAYER_INFO':
      return {
        ...state,
        playerName:    action.name,
        playerEmail:   action.email,
        playerContact: action.contact,
        gamePhase:     'categories',
      };

    case 'SET_DIFFICULTY':
      return {
        ...state,
        difficulty:      action.difficulty,
        timePerQuestion: timeForDifficulty(action.difficulty),
      };

    case 'SELECT_CATEGORY':
      // Questions are already filtered + randomised by the backend —
      // store them directly without any local re-filtering.
      return {
        ...state,
        selectedCategory:     action.category,
        currentQuestionIndex: 0,
        score:                0,
        gamePhase:            'playing',
        resultSaved:          false,
        resultSaving:         false,
      };

    case 'ANSWER_QUESTION':
      return {
        ...state,
        score: action.correct ? state.score + 1 : state.score,
      };

    case 'TIME_OUT':
      return state;

    case 'NEXT_QUESTION': {
      const total = state.selectedCategory?.questions.length ?? 0;
      const next  = state.currentQuestionIndex + 1;
      if (next >= total) {
        return { ...state, gamePhase: 'results' };
      }
      return { ...state, currentQuestionIndex: next };
    }

    case 'SET_RESULT_SAVING':
      return { ...state, resultSaving: action.saving };

    case 'SET_RESULT_SAVED':
      return { ...state, resultSaved: true, resultSaving: false };

    case 'RESET_GAME':
      return {
        ...initialState,
        playerName:    state.playerName,
        playerEmail:   state.playerEmail,
        playerContact: state.playerContact,
        gamePhase:     'categories',
      };

    default:
      return state;
  }
}

// ─────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────

interface GameContextValue {
  state:          GameState;
  setPlayerInfo:  (name: string, email: string, contact: string) => void;
  setDifficulty:  (d: Difficulty) => void;
  selectCategory: (cat: SelectedCategory) => void;
  answerQuestion: (index: number) => void;
  nextQuestion:   () => void;
  timeOut:        () => void;
  resetGame:      () => void;
  saveResult:     () => Promise<void>;
}

const GameContext = createContext<GameContextValue | null>(null);

// ─────────────────────────────────────────────────────────────
// Provider
// ─────────────────────────────────────────────────────────────

export const GameProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  const setPlayerInfo = useCallback(
    (name: string, email: string, contact: string) => {
      dispatch({ type: 'SET_PLAYER_INFO', name, email, contact });
    }, []
  );

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    dispatch({ type: 'SET_DIFFICULTY', difficulty });
  }, []);

  const selectCategory = useCallback((category: SelectedCategory) => {
    dispatch({ type: 'SELECT_CATEGORY', category });
  }, []);

  const answerQuestion = useCallback((index: number) => {
    const question = state.selectedCategory?.questions[state.currentQuestionIndex];
    if (!question) return;
    dispatch({ type: 'ANSWER_QUESTION', correct: index === question.correctAnswer });
  }, [state.selectedCategory, state.currentQuestionIndex]);

  const nextQuestion = useCallback(() => {
    dispatch({ type: 'NEXT_QUESTION' });
  }, []);

  const timeOut = useCallback(() => {
    dispatch({ type: 'TIME_OUT' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  // Save result once after game ends. Called from ResultsScreen on mount.
  const saveResult = useCallback(async () => {
    if (state.resultSaved || state.resultSaving) return;
    if (!state.selectedCategory) return;

    const total      = state.selectedCategory.questions.length;
    const percentage = Math.round((state.score / total) * 100);
    const { title }  = getTitleByScore(state.score, total);

    dispatch({ type: 'SET_RESULT_SAVING', saving: true });
    try {
      await gameApi.saveResult({
        playerName:     state.playerName,
        playerEmail:    state.playerEmail,
        playerContact:  state.playerContact,
        categoryId:     state.selectedCategory.id,
        categoryName:   state.selectedCategory.name,
        score:          state.score,
        totalQuestions: total,
        percentage,
        difficulty:     state.difficulty,
        title,
        completedAt:    new Date().toISOString(),
      });
      dispatch({ type: 'SET_RESULT_SAVED' });
    } catch (err) {
      console.error('Failed to save result:', err);
      dispatch({ type: 'SET_RESULT_SAVING', saving: false });
    }
  }, [state]);

  return (
    <GameContext.Provider value={{
      state,
      setPlayerInfo,
      setDifficulty,
      selectCategory,
      answerQuestion,
      nextQuestion,
      timeOut,
      resetGame,
      saveResult,
    }}>
      {children}
    </GameContext.Provider>
  );
};

// ─────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────

export const useGame = (): GameContextValue => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};