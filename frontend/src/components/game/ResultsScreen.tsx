import { useRef, useCallback, useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { getTitleByScore, getMotivationalMessage, getDifficultyLabel } from '@/data/quizData';
import { Loader2 } from 'lucide-react';

const ResultsScreen = () => {
  const { state, resetGame, saveResult } = useGame();
  const certificateRef = useRef<HTMLDivElement>(null);
  const [wantsCertificate, setWantsCertificate] = useState(false);

  const category   = state.selectedCategory!;
  const total      = category.questions.length;
  const percentage = Math.round((state.score / total) * 100);
  const { title, emoji } = getTitleByScore(state.score, total);
  const message    = getMotivationalMessage(state.score, total);
  const diffLabel  = state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);

  // ── Save result once on mount ──────────────────────────────
  useEffect(() => {
    saveResult();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Certificate download ───────────────────────────────────
  const downloadCertificate = useCallback(() => {
    const canvas = document.createElement('canvas');
    canvas.width  = 1200;
    canvas.height = 800;
    const ctx = canvas.getContext('2d')!;

    const bg = ctx.createLinearGradient(0, 0, 1200, 800);
    bg.addColorStop(0,   '#0a1628');
    bg.addColorStop(0.5, '#132040');
    bg.addColorStop(1,   '#0a1628');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 1200, 800);

    const borderColor      = state.difficulty === 'hard' ? '#e74c3c' : state.difficulty === 'medium' ? '#f39c12' : '#d4a843';
    const borderColorFaded = borderColor + '80';

    ctx.strokeStyle = borderColor;
    ctx.lineWidth   = 6;
    ctx.strokeRect(30, 30, 1140, 740);
    ctx.strokeStyle = borderColorFaded;
    ctx.lineWidth   = 2;
    ctx.strokeRect(45, 45, 1110, 710);

    const drawCorner = (x: number, y: number, flipX: number, flipY: number) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(flipX, flipY);
      ctx.fillStyle = borderColor;
      ctx.fillRect(0, 0, 40, 4);
      ctx.fillRect(0, 0, 4, 40);
      ctx.restore();
    };
    drawCorner(50,   50,  1,  1);
    drawCorner(1150, 50, -1,  1);
    drawCorner(50,   750, 1, -1);
    drawCorner(1150, 750,-1, -1);

    ctx.fillStyle = '#FF9933'; ctx.fillRect(560, 80, 80, 10);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(560, 90, 80, 10);
    ctx.fillStyle = '#138808'; ctx.fillRect(560, 100, 80, 10);

    ctx.fillStyle = borderColor;
    ctx.font      = 'bold 48px serif';
    ctx.textAlign = 'center';
    ctx.fillText('CERTIFICATE OF ACHIEVEMENT', 600, 170);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillText(`[ ${diffLabel.toUpperCase()} LEVEL ]`, 600, 205);

    ctx.fillStyle = '#8899aa';
    ctx.font      = '18px sans-serif';
    ctx.fillText('BHARAT QUIZ - The Ultimate Indian Knowledge Challenge', 600, 240);

    ctx.fillStyle = '#bbccdd';
    ctx.font      = '20px sans-serif';
    ctx.fillText('This is to certify that', 600, 300);

    ctx.fillStyle = borderColor;
    ctx.font      = 'bold 44px serif';
    ctx.fillText(state.playerName, 600, 360);

    ctx.strokeStyle = borderColorFaded;
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(300, 380);
    ctx.lineTo(900, 380);
    ctx.stroke();

    ctx.fillStyle = '#bbccdd';
    ctx.font      = '20px sans-serif';
    ctx.fillText(`has successfully completed the ${category.name} Challenge`, 600, 420);
    ctx.fillText(`at ${diffLabel} difficulty with a score of ${state.score}/${total} (${percentage}%)`, 600, 455);

    ctx.fillStyle = borderColor;
    ctx.font      = 'bold 36px serif';
    ctx.fillText(`${emoji} ${title} ${emoji}`, 600, 530);

    ctx.fillStyle = '#8899aa';
    ctx.font      = '16px sans-serif';
    ctx.fillText(message, 600, 575);

    const date = new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    ctx.fillStyle = '#667788';
    ctx.font      = '16px sans-serif';
    ctx.fillText(`Awarded on ${date}`, 600, 650);

    ctx.strokeStyle = borderColorFaded;
    ctx.beginPath();
    ctx.moveTo(420, 710);
    ctx.lineTo(780, 710);
    ctx.stroke();
    ctx.fillStyle = '#667788';
    ctx.font      = '14px sans-serif';
    ctx.fillText('Bharat Quiz Committee', 600, 735);

    const link   = document.createElement('a');
    link.download = `BharatQuiz_${diffLabel}_Certificate_${state.playerName.replace(/\s+/g, '_')}.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  }, [state.playerName, state.score, state.difficulty, total, percentage, title, emoji, message, category.name, diffLabel]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-2xl animate-fade-in text-center" ref={certificateRef}>
        <div className="mb-4 text-7xl animate-scale-in">{emoji}</div>

        <h2 className="font-display text-3xl font-bold text-primary text-glow-gold md:text-4xl">
          {title}
        </h2>

        <p className="mt-2 text-muted-foreground">{state.playerName}</p>

        {/* Save status indicator */}
        {state.resultSaving && (
          <p className="mt-1 flex items-center justify-center gap-1 text-xs text-muted-foreground font-heading">
            <Loader2 className="h-3 w-3 animate-spin" /> Saving your result…
          </p>
        )}
        {state.resultSaved && (
          <p className="mt-1 text-xs text-correct font-heading">✓ Result saved to leaderboard</p>
        )}

        <div className="mt-2">
          <span className={`inline-block rounded-full px-4 py-1 font-heading text-sm font-semibold ${
            state.difficulty === 'easy'   ? 'bg-correct/20 text-correct' :
            state.difficulty === 'medium' ? 'bg-timer-warning/20 text-timer-warning' :
                                            'bg-wrong/20 text-wrong'
          }`}>
            {getDifficultyLabel(state.difficulty)}
          </span>
        </div>

        {/* Score card */}
        <div className="mt-6 rounded-xl border border-border bg-card p-6 border-glow-gold">
          <div className="mb-4 text-6xl font-display font-bold text-primary">
            {state.score}<span className="text-2xl text-muted-foreground">/{total}</span>
          </div>

          <div className="mb-4 h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className="h-full rounded-full bg-primary transition-all duration-1000"
              style={{ width: `${percentage}%` }}
            />
          </div>

          <p className="text-sm text-muted-foreground">{percentage}% accuracy</p>
          <p className="mt-4 font-heading text-foreground">{message}</p>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-card border border-border p-3">
            <div className="text-2xl font-bold text-correct">{state.score}</div>
            <div className="text-xs text-muted-foreground">Correct</div>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <div className="text-2xl font-bold text-wrong">{total - state.score}</div>
            <div className="text-xs text-muted-foreground">Wrong</div>
          </div>
          <div className="rounded-lg bg-card border border-border p-3">
            <div className="text-2xl font-bold text-primary">{diffLabel}</div>
            <div className="text-xs text-muted-foreground">Difficulty</div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-8 flex flex-col gap-3">
          {!wantsCertificate ? (
            <button
              onClick={() => setWantsCertificate(true)}
              className="w-full rounded-lg border border-primary bg-primary/10 px-8 py-3 font-heading text-lg font-semibold text-primary transition-all hover:bg-primary/20"
            >
              📜 Want a Certificate?
            </button>
          ) : (
            <button
              onClick={downloadCertificate}
              className="w-full rounded-lg bg-primary px-8 py-3 font-heading text-lg font-semibold text-primary-foreground transition-all hover:brightness-110 animate-pulse-gold"
            >
              📜 Download Certificate
            </button>
          )}
          <button
            onClick={resetGame}
            className="w-full rounded-lg border border-border bg-secondary px-8 py-3 font-heading text-lg font-semibold text-secondary-foreground transition-all hover:border-primary"
          >
            🔄 Play Again
          </button>
          <a
            href="/leaderboard"
            className="w-full rounded-lg border border-border bg-card px-8 py-3 font-heading text-lg font-semibold text-foreground transition-all hover:border-primary text-center"
          >
            🏆 View Rankings
          </a>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen;