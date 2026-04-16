import { useState, useEffect } from "react";
import { useGame, Difficulty, SelectedCategory } from "@/context/GameContext";
import { getDifficultyLabel } from "@/data/quizData";
import { gameApi } from "@/services/api";
import { Loader2 } from "lucide-react";

const difficulties: Difficulty[] = ["easy", "medium", "hard"];

const QUESTION_COUNT: Record<Difficulty, number> = {
  easy: 10,
  medium: 15,
  hard: 20,
};

const difficultyStyles: Record<Difficulty, string> = {
  easy: "border-correct text-correct bg-correct/10",
  medium: "border-timer-warning text-timer-warning bg-timer-warning/10",
  hard: "border-wrong text-wrong bg-wrong/10",
};

const CategorySelect = () => {
  const { state, selectCategory, setDifficulty } = useGame();

  // ── Category list (for grid display) ──────────────────────
  const [categories, setCategories] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── Per-card loading when user clicks ─────────────────────
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // ── Fetch category list on mount ───────────────────────────
  const fetchCategories = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await gameApi.getCategories();
      setCategories(data);
    } catch {
      setListError("Failed to load categories. Please try again.");
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // ── Handle card click ──────────────────────────────────────
  // 1. Call backend for randomised, difficulty-filtered questions
  // 2. Build SelectedCategory and pass to context (no re-filtering)
  const handleSelectCategory = async (category: any) => {
    if (loadingCategory) return;
    setCategoryError(null);
    setLoadingCategory(category.id);

    try {
      const res = await gameApi.getCategoryQuestions(
        category.id,
        state.difficulty,
        QUESTION_COUNT[state.difficulty],
      );
      //console.log("Raw question sample:", res.questions[0]);

      if (!res.questions || res.questions.length === 0) {
        setCategoryError(
          `No ${state.difficulty} questions available in "${category.name}" yet.`,
        );
        return;
      }

      // Build SelectedCategory directly from the backend response.
      // Questions are already shuffled and capped server-side — no
      // local filtering happens inside GameContext any more.
      const selected: SelectedCategory = {
        id: category.id,
        name: category.categoryName || category.name,
        icon: category.icon,
        description: category.description,
        color: category.color,
        questions: res.questions,
      };
      //console.log("Response", category);
      //console.log("Selected", selected);
      selectCategory(selected);
    } catch {
      setCategoryError("Failed to load questions. Please try again.");
    } finally {
      setLoadingCategory(null);
    }
  };

  // ─────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-8">
      <div className="w-full max-w-6xl animate-fade-in">
        {/* Header */}
        <div className="mb-6 text-center">
          <p className="font-heading text-lg text-primary">
            Welcome, {state.playerName}!
          </p>
          <h2 className="font-display text-3xl font-bold text-foreground text-glow-gold md:text-4xl">
            Choose Your Arena
          </h2>
          <p className="mt-2 text-muted-foreground">
            Select difficulty & category to begin
          </p>
        </div>

        {/* Difficulty Selector */}
        <div className="max-w-2xl mx-auto mb-8 rounded-xl border border-border bg-card p-5 border-glow-gold animate-scale-in">
          <p className="mb-3 font-heading text-sm text-muted-foreground text-center uppercase tracking-wider">
            Difficulty Level
          </p>
          <div className="flex gap-3 justify-center">
            {difficulties.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDifficulty(d);
                  setCategoryError(null);
                }}
                className={`rounded-lg border-2 px-5 py-2.5 font-heading text-base font-semibold transition-all duration-300 ${
                  state.difficulty === d
                    ? `${difficultyStyles[d]} scale-105 shadow-lg`
                    : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {getDifficultyLabel(d)}
              </button>
            ))}
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            {state.difficulty === "easy" &&
              `⏱️ 30s per question • ${QUESTION_COUNT.easy} questions • Beginner friendly`}
            {state.difficulty === "medium" &&
              `⏱️ 20s per question • ${QUESTION_COUNT.medium} questions • Moderate challenge`}
            {state.difficulty === "hard" &&
              `⏱️ 15s per question • ${QUESTION_COUNT.hard} questions • Expert level`}
          </p>
        </div>

        {/* Category fetch error banner */}
        {categoryError && (
          <div className="max-w-2xl mx-auto mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-center font-heading text-sm text-destructive">
            {categoryError}
          </div>
        )}

        {/* List loading */}
        {loadingList && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="font-heading text-sm text-muted-foreground">
              Loading categories…
            </p>
          </div>
        )}

        {/* List error */}
        {!loadingList && listError && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <p className="font-heading text-sm text-destructive">{listError}</p>
            <button
              onClick={fetchCategories}
              className="rounded-lg border border-border px-5 py-2 font-heading text-sm text-foreground hover:border-primary transition-colors"
            >
              🔄 Retry
            </button>
          </div>
        )}

        {/* Category Grid */}

        {!loadingList && !listError && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.length === 0 ? (
              <div className="col-span-full text-center py-20 font-heading text-muted-foreground">
                No categories available yet.
              </div>
            ) : (
              categories.map((category, index) => {
                const isLoading = loadingCategory === category.id;

                return (
                  <button
                    key={category.id}
                    onClick={() => handleSelectCategory(category)}
                    className={`group relative overflow-hidden rounded-xl border border-border bg-card p-6 text-left transition-all duration-300 animate-slide-up ${
                      loadingCategory && !isLoading
                        ? "opacity-60 cursor-not-allowed"
                        : "hover:border-primary hover:border-glow-gold cursor-pointer"
                    }`}
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    {/* Icon */}
                    <div className="mb-3 text-4xl">
                      {isLoading ? (
                        <Loader2 className="h-9 w-9 animate-spin text-primary" />
                      ) : (
                        category.icon
                      )}
                    </div>

                    <h3 className="font-display text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                      {category.name}
                    </h3>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {category.description}
                    </p>

                    {/* FIXED COUNT DISPLAY */}
                    <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-2 py-0.5">
                        {isLoading
                          ? "Loading questions..."
                          : `${QUESTION_COUNT[state.difficulty]} ${getDifficultyLabel(state.difficulty)} Qs`}
                      </span>

                      <span className="rounded-full bg-secondary px-2 py-0.5">
                        {state.timePerQuestion}s Timer
                      </span>
                    </div>

                    <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100" />
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelect;
