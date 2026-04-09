import { Difficulty } from '../types/index.js';

export const getTitleByScore = (
  score: number,
  total: number
): { title: string; emoji: string } => {
  const pct = (score / total) * 100;
  if (pct === 100) return { title: 'Maharishi', emoji: '👑' };
  if (pct >= 80)   return { title: 'Pandit',    emoji: '🏆' };
  if (pct >= 60)   return { title: 'Vidwan',    emoji: '🎖️' };
  if (pct >= 40)   return { title: 'Shishya',   emoji: '📚' };
  if (pct >= 20)   return { title: 'Medhavi',   emoji: '🌟' };
  return                 { title: 'Abhyasi',    emoji: '🙏' };
};

export const getMotivationalMessage = (score: number, total: number): string => {
  const pct = (score / total) * 100;
  if (pct === 100) return 'Perfect! You are a true Maharishi of knowledge! 🙏';
  if (pct >= 80)   return 'Outstanding performance! India is proud of you! 🇮🇳';
  if (pct >= 60)   return 'Well done! You have impressive knowledge! Keep learning!';
  if (pct >= 40)   return "Good effort! There's so much more to discover!";
  if (pct >= 20)   return 'A brave attempt! Every master was once a beginner.';
  return                 "Don't give up! The journey of knowledge begins with a single step.";
};

export const getDifficultyTimer = (difficulty: Difficulty): number => {
  const map: Record<Difficulty, number> = { easy: 30, medium: 20, hard: 15 };
  return map[difficulty];
};

export const getDifficultyLabel = (difficulty: Difficulty): string => {
  const map: Record<Difficulty, string> = {
    easy: '🟢 Easy',
    medium: '🟡 Medium',
    hard: '🔴 Hard',
  };
  return map[difficulty];
};

export const calculateScore = (
  correct: number,
  total: number
): { score: number; percentage: number } => ({
  score: correct,
  percentage: parseFloat(((correct / total) * 100).toFixed(2)),
});