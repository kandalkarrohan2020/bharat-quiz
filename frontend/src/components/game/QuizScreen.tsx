import { useState, useEffect, useCallback } from 'react';
import { useGame } from '@/context/GameContext';

const QuizScreen = () => {
  const { state, answerQuestion, nextQuestion, timeOut } = useGame();
  const [timeLeft, setTimeLeft] = useState(state.timePerQuestion);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isTimedOut, setIsTimedOut] = useState(false);

  const category = state.selectedCategory!;
  const question = category.questions[state.currentQuestionIndex];
  const totalQuestions = category.questions.length;
  const progress = ((state.currentQuestionIndex) / totalQuestions) * 100;

  // Reset state on new question
  useEffect(() => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsTimedOut(false);
    setTimeLeft(state.timePerQuestion);
  }, [state.currentQuestionIndex, state.timePerQuestion]);

  // Timer
  useEffect(() => {
    if (showResult || isTimedOut) return;
    if (timeLeft <= 0) {
      setIsTimedOut(true);
      timeOut();
      setShowResult(true);
      return;
    }
    const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [timeLeft, showResult, isTimedOut, timeOut]);

  const handleAnswer = useCallback((index: number) => {
    if (showResult || isTimedOut) return;
    setSelectedAnswer(index);
    answerQuestion(index);
    setShowResult(true);
  }, [showResult, isTimedOut, answerQuestion]);

  const handleNext = () => {
    nextQuestion();
  };

  const getTimerColor = () => {
    if (timeLeft <= 5) return 'text-wrong';
    if (timeLeft <= 10) return 'text-timer-warning';
    return 'text-primary';
  };

  const getOptionClass = (index: number) => {
    const base = 'w-full rounded-lg border px-4 py-3 text-left font-heading text-base transition-all duration-300 md:text-lg';

    if (!showResult) {
      return `${base} border-border bg-secondary hover:border-primary hover:bg-secondary/80 text-foreground cursor-pointer`;
    }

    if (index === question.correctAnswer) {
      return `${base} border-correct bg-correct/20 text-correct`;
    }
    if (index === selectedAnswer && index !== question.correctAnswer) {
      return `${base} border-wrong bg-wrong/20 text-wrong`;
    }
    return `${base} border-border bg-secondary/50 text-muted-foreground opacity-60`;
  };

  const optionLabels = ['A', 'B', 'C', 'D'];

  return (
    <div className="flex min-h-screen flex-col items-center px-4 py-6">
      <div className="w-full max-w-2xl">
        {/* Top bar */}
        <div className="mb-6 flex items-center justify-between animate-fade-in">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{category.icon}</span>
            <span className="font-heading text-sm text-muted-foreground">{category.name}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="font-heading text-sm text-muted-foreground">
              {state.currentQuestionIndex + 1}/{totalQuestions}
            </span>
            <span className="font-heading text-sm text-primary">
              Score: {state.score}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-6 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timer */}
        <div className={`mb-6 text-center ${showResult ? '' : 'animate-timer-pulse'}`}>
          <span className={`font-display text-5xl font-bold ${getTimerColor()} transition-colors`}>
            {timeLeft}
          </span>
          <p className="text-xs text-muted-foreground mt-1">seconds remaining</p>
        </div>

        {/* Question */}
        <div className="mb-8 rounded-xl border border-border bg-card p-6 border-glow-gold animate-scale-in">
          <p className="font-heading text-lg text-foreground md:text-xl leading-relaxed">
            {question.question}
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
              className={getOptionClass(index)}
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground">
                {optionLabels[index]}
              </span>
              {option}
            </button>
          ))}
        </div>

        {/* Result feedback & Next button */}
        {showResult && (
          <div className="mt-6 animate-slide-up text-center">
            {isTimedOut ? (
              <p className="mb-4 font-heading text-lg text-timer-warning">⏰ Time's Up!</p>
            ) : selectedAnswer === question.correctAnswer ? (
              <p className="mb-4 font-heading text-lg text-correct">✅ Correct! Shabash!</p>
            ) : (
              <p className="mb-4 font-heading text-lg text-wrong">❌ Wrong Answer!</p>
            )}
            <button
              onClick={handleNext}
              className="rounded-lg bg-primary px-8 py-3 font-heading text-lg font-semibold text-primary-foreground transition-all hover:brightness-110"
            >
              {state.currentQuestionIndex === totalQuestions - 1 ? '🏆 See Results' : 'Next Question →'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuizScreen;
