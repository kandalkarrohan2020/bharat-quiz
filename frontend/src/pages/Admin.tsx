import { useState, useEffect, useCallback } from 'react';
import { Question, Category } from '@/data/quizData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { authApi } from '@/services/api';
import { adminApi } from '@/services/api.admin';
import {
  LayoutDashboard, ArrowLeft, HelpCircle, Layers, BarChart3,
  Plus, Pencil, Trash2, Search, SlidersHorizontal, Settings, LogOut, Key, Mail,
  Loader2,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';

interface QuestionRow extends Question {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const difficultyColor = (d: string) => {
  switch (d) {
    case 'easy':   return 'bg-correct/20 text-correct border-correct/30';
    case 'medium': return 'bg-timer-warning/20 text-timer-warning border-timer-warning/30';
    case 'hard':   return 'bg-destructive/20 text-destructive border-destructive/30';
    default:       return '';
  }
};

const emptyQuestion: Omit<Question, 'id'> & { id?: string } = {
  question: '',
  options: ['', '', '', ''],
  correctAnswer: 0,
  difficulty: 'easy',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

const Admin = () => {
  const navigate  = useNavigate();
  const { toast } = useToast();

  // ── Auth guard ─────────────────────────────────────────────
  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) navigate('/admin/login');
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    navigate('/admin/login');
  };

  // ── Data state ─────────────────────────────────────────────
  const [categoriesData, setCategoriesData]   = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery]           = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | 'all'>('all');

  // Dashboard stats (fetched separately so they stay accurate)
  const [stats, setStats] = useState({ totalQuestions: 0, totalCategories: 0, byDifficulty: { easy: 0, medium: 0, hard: 0 } });

  // ── Loading flags ──────────────────────────────────────────
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingStats,      setLoadingStats]      = useState(true);
  const [savingQuestion,    setSavingQuestion]    = useState(false);
  const [deletingQuestion,  setDeletingQuestion]  = useState(false);
  const [bulkDeleting,      setBulkDeleting]      = useState(false);
  const [bulkUpdating,      setBulkUpdating]      = useState(false);
  const [savingCategory,    setSavingCategory]    = useState(false);
  const [deletingCategory,  setDeletingCategory]  = useState(false);
  const [savingSettings,    setSavingSettings]    = useState(false);

  // ── Dialog states ──────────────────────────────────────────
  const [questionDialog,        setQuestionDialog]        = useState(false);
  const [bulkDeleteDialog,      setBulkDeleteDialog]      = useState(false);
  const [deleteDialog,          setDeleteDialog]          = useState(false);
  const [bulkDifficultyDialog,  setBulkDifficultyDialog]  = useState(false);
  const [categoryDialog,        setCategoryDialog]        = useState(false);
  const [deleteCategoryDialog,  setDeleteCategoryDialog]  = useState(false);
  const [settingsDialog,        setSettingsDialog]        = useState(false);

  // ── Editing state ──────────────────────────────────────────
  const [editingQuestion,   setEditingQuestion]   = useState<(Omit<Question, 'id'> & { id?: string }) | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [deleteTarget,      setDeleteTarget]      = useState<{ questionId: string; categoryId: string } | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [newDifficulty,     setNewDifficulty]     = useState<Difficulty>('medium');

  // ── Category editing state ─────────────────────────────────
  const [editingCategory,       setEditingCategory]       = useState<Category | null>(null);
  const [deleteCategoryTarget,  setDeleteCategoryTarget]  = useState<Category | null>(null);
  const [hoveredCategory,       setHoveredCategory]       = useState<string | null>(null);

  // ── Settings form ──────────────────────────────────────────
  const [settingsTab,      setSettingsTab]      = useState<'password' | 'email'>('password');
  const [currentPassword,  setCurrentPassword]  = useState('');
  const [newPassword,      setNewPassword]      = useState('');
  const [newEmail,         setNewEmail]         = useState('');

  // ── Category form ──────────────────────────────────────────
  const [categoryForm, setCategoryForm] = useState({
    name: '', icon: '📚', description: '', color: 'from-blue-700 to-cyan-600',
  });

  // ─────────────────────────────────────────────────────────────
  // Data fetching
  // ─────────────────────────────────────────────────────────────

  const fetchCategories = useCallback(async () => {
    try {
      setLoadingCategories(true);
      const res = await adminApi.getCategories();
      const normalised: Category[] = (res.data ?? []).map((c: any) => ({
        ...c,
        id: c._id ?? c.id,
        questions: (c.questions ?? []).map((q: any) => ({
          ...q,
          id: q._id ?? q.id,
        })),
      }));
      setCategoriesData(normalised);
    } catch {
      toast({ title: 'Error', description: 'Failed to load categories', variant: 'destructive' });
    } finally {
      setLoadingCategories(false);
    }
  }, [toast]);

  const fetchStats = useCallback(async () => {
    try {
      setLoadingStats(true);
      const res = await adminApi.getStats();
      setStats(res.data);
    } catch {
      // Silently derive stats from local data as fallback
    } finally {
      setLoadingStats(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchStats();
  }, [fetchCategories, fetchStats]);

  // ─────────────────────────────────────────────────────────────
  // Derived values
  // ─────────────────────────────────────────────────────────────

  const totalQuestions  = loadingStats ? stats.totalQuestions  : categoriesData.reduce((s, c) => s + c.questions.length, 0);
  const totalCategories = loadingStats ? stats.totalCategories : categoriesData.length;
  const diffCounts      = loadingStats
    ? stats.byDifficulty
    : categoriesData.flatMap(c => c.questions).reduce(
        (acc, q) => { acc[q.difficulty] = (acc[q.difficulty] || 0) + 1; return acc; },
        { easy: 0, medium: 0, hard: 0 } as Record<string, number>
      );

  // ─────────────────────────────────────────────────────────────
  // Filtered question rows
  // ─────────────────────────────────────────────────────────────

  const allQuestions: QuestionRow[] = selectedCategory
    ? (categoriesData.find(c => c.id === selectedCategory)?.questions ?? []).map(q => ({
        ...q,
        categoryId:   selectedCategory,
        categoryName: categoriesData.find(c => c.id === selectedCategory)!.name,
        categoryIcon: categoriesData.find(c => c.id === selectedCategory)!.icon,
      }))
    : categoriesData.flatMap(c =>
        c.questions.map(q => ({ ...q, categoryId: c.id, categoryName: c.name, categoryIcon: c.icon }))
      );

  const filteredQuestions = allQuestions.filter(q => {
    const matchesSearch     = !searchQuery || q.question.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || q.difficulty === difficultyFilter;
    return matchesSearch && matchesDifficulty;
  });

  // ─────────────────────────────────────────────────────────────
  // Question handlers
  // ─────────────────────────────────────────────────────────────

  const openAddQuestion = () => {
    setEditingQuestion({ ...emptyQuestion });
    setEditingCategoryId(selectedCategory || categoriesData[0]?.id || null);
    setQuestionDialog(true);
  };

  const openEditQuestion = (q: QuestionRow) => {
    setEditingQuestion({ ...q, options: [...q.options] });
    setEditingCategoryId(q.categoryId);
    setQuestionDialog(true);
  };

  const saveQuestion = async () => {
    if (!editingQuestion || !editingCategoryId) return;

    if (!editingQuestion.question.trim()) {
      toast({ title: 'Error', description: 'Question text is required', variant: 'destructive' });
      return;
    }
    if (editingQuestion.options.some(o => !o.trim())) {
      toast({ title: 'Error', description: 'All options are required', variant: 'destructive' });
      return;
    }

    setSavingQuestion(true);
    try {
      if (editingQuestion.id) {
        const res = await adminApi.updateQuestion(editingQuestion.id, {
          categoryId:    editingCategoryId,
          question:      editingQuestion.question,
          options:       editingQuestion.options as [string, string, string, string],
          correctAnswer: editingQuestion.correctAnswer as 0 | 1 | 2 | 3,
          difficulty:    editingQuestion.difficulty,
        });
        const updated = { ...res.data, id: res.data._id ?? res.data.id };
        setCategoriesData(prev => prev.map(cat => {
          const withoutQ = { ...cat, questions: cat.questions.filter(q => q.id !== editingQuestion.id) };
          if (cat.id === editingCategoryId) {
            return { ...withoutQ, questions: [...withoutQ.questions, updated] };
          }
          return withoutQ;
        }));
        toast({ title: 'Question Updated', description: 'Changes saved successfully' });
      } else {
        const res = await adminApi.createQuestion({
          categoryId:    editingCategoryId,
          question:      editingQuestion.question,
          options:       editingQuestion.options as [string, string, string, string],
          correctAnswer: editingQuestion.correctAnswer as 0 | 1 | 2 | 3,
          difficulty:    editingQuestion.difficulty,
        });
        const newQ = { ...res.data, id: res.data._id ?? res.data.id };
        setCategoriesData(prev => prev.map(cat =>
          cat.id === editingCategoryId
            ? { ...cat, questions: [...cat.questions, newQ] }
            : cat
        ));
        toast({ title: 'Question Added', description: 'Question created successfully' });
      }

      setQuestionDialog(false);
      setEditingQuestion(null);
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save question', variant: 'destructive' });
    } finally {
      setSavingQuestion(false);
    }
  };

  const confirmDelete = (questionId: string, categoryId: string) => {
    setDeleteTarget({ questionId, categoryId });
    setDeleteDialog(true);
  };

  const executeDelete = async () => {
    if (!deleteTarget) return;
    setDeletingQuestion(true);
    try {
      await adminApi.deleteQuestion(deleteTarget.questionId, deleteTarget.categoryId);
      setCategoriesData(prev => prev.map(cat =>
        cat.id === deleteTarget.categoryId
          ? { ...cat, questions: cat.questions.filter(q => q.id !== deleteTarget.questionId) }
          : cat
      ));
      setDeleteDialog(false);
      setDeleteTarget(null);
      toast({ title: 'Question Deleted', description: 'Question removed successfully' });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete question', variant: 'destructive' });
    } finally {
      setDeletingQuestion(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Selection / bulk handlers
  // ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedQuestions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkChangeDifficulty = async () => {
    const ids = Array.from(selectedQuestions);
    setBulkUpdating(true);
    try {
      await adminApi.bulkUpdateDifficulty({ questionIds: ids, difficulty: newDifficulty });
      setCategoriesData(prev => prev.map(cat => ({
        ...cat,
        questions: cat.questions.map(q =>
          selectedQuestions.has(q.id) ? { ...q, difficulty: newDifficulty } : q
        ),
      })));
      setBulkDifficultyDialog(false);
      setSelectedQuestions(new Set());
      toast({ title: 'Difficulty Updated', description: `${ids.length} questions updated to ${newDifficulty}` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update difficulty', variant: 'destructive' });
    } finally {
      setBulkUpdating(false);
    }
  };

  const executeBulkDelete = async () => {
    const ids = Array.from(selectedQuestions);
    setBulkDeleting(true);
    try {
      await adminApi.bulkDeleteQuestions({ questionIds: ids });
      setCategoriesData(prev => prev.map(cat => ({
        ...cat,
        questions: cat.questions.filter(q => !selectedQuestions.has(q.id)),
      })));
      setBulkDeleteDialog(false);
      setSelectedQuestions(new Set());
      toast({ title: 'Questions Deleted', description: `${ids.length} questions removed successfully` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete questions', variant: 'destructive' });
    } finally {
      setBulkDeleting(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Category handlers
  // ─────────────────────────────────────────────────────────────

  const openAddCategory = () => {
    setEditingCategory(null);
    setCategoryForm({ name: '', icon: '📚', description: '', color: 'from-blue-700 to-cyan-600' });
    setCategoryDialog(true);
  };

  const openEditCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent selecting the category filter
    setEditingCategory(cat);
    setCategoryForm({
      name:        cat.name,
      icon:        cat.icon,
      description: (cat as any).description ?? '',
      color:       (cat as any).color ?? 'from-blue-700 to-cyan-600',
    });
    setCategoryDialog(true);
  };

  const openDeleteCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteCategoryTarget(cat);
    setDeleteCategoryDialog(true);
  };

  const saveCategory = async () => {
    if (!categoryForm.name.trim()) {
      toast({ title: 'Error', description: 'Category name is required', variant: 'destructive' });
      return;
    }
    setSavingCategory(true);
    try {
      if (editingCategory) {
        // Update existing category
        const res = await adminApi.updateCategory(editingCategory.id, categoryForm);
        const updated = { ...res.data, id: res.data._id ?? res.data.id };
        setCategoriesData(prev => prev.map(cat =>
          cat.id === editingCategory.id
            ? { ...cat, ...updated, questions: cat.questions } // preserve local questions array
            : cat
        ));
        setCategoryDialog(false);
        toast({ title: 'Category Updated', description: `"${categoryForm.name}" updated` });
      } else {
        // Create new category
        const res = await adminApi.createCategory(categoryForm);
        const newCat: Category = {
          ...res.data,
          id: res.data._id ?? res.data.id,
          questions: [],
        };
        setCategoriesData(prev => [...prev, newCat]);
        setCategoryDialog(false);
        toast({ title: 'Category Added', description: `"${categoryForm.name}" created` });
      }
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to save category', variant: 'destructive' });
    } finally {
      setSavingCategory(false);
    }
  };

  const executeDeleteCategory = async () => {
    if (!deleteCategoryTarget) return;
    setDeletingCategory(true);
    try {
      await adminApi.deleteCategory(deleteCategoryTarget.id);
      setCategoriesData(prev => prev.filter(cat => cat.id !== deleteCategoryTarget.id));
      // If the deleted category was selected, reset filter
      if (selectedCategory === deleteCategoryTarget.id) setSelectedCategory(null);
      setDeleteCategoryDialog(false);
      setDeleteCategoryTarget(null);
      toast({ title: 'Category Deleted', description: `"${deleteCategoryTarget.name}" removed` });
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to delete category', variant: 'destructive' });
    } finally {
      setDeletingCategory(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Settings handler
  // ─────────────────────────────────────────────────────────────

  const resetSettings = () => {
    setCurrentPassword('');
    setNewPassword('');
    setNewEmail('');
  };

  const saveSettings = async () => {
    setSavingSettings(true);
    try {
      if (settingsTab === 'password') {
        await authApi.changePassword({ currentPassword, newPassword });
        toast({ title: 'Password Changed', description: 'Your password has been updated' });
      } else {
        await authApi.changeEmail({ newEmail, password: currentPassword });
        toast({ title: 'Email Changed', description: 'Your email has been updated' });
      }
      setSettingsDialog(false);
      resetSettings();
    } catch (err: unknown) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update', variant: 'destructive' });
    } finally {
      setSavingSettings(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-stage">

      {/* ── Header ── */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-display font-bold text-foreground">Admin Panel</h1>
            </div>
          </div>
          <div className="w-full sm:w-auto flex items-center justify-end gap-3">
            <Button size="sm" variant="ghost" onClick={() => setSettingsDialog(true)} className="font-heading text-muted-foreground hover:text-foreground">
              <Settings className="h-4 w-4" />
            </Button>
            <Button size="sm" variant="outline" onClick={openAddCategory} className="font-heading">
              <Plus className="h-4 w-4 mr-1" /> Category
            </Button>
            <Button size="sm" onClick={openAddQuestion} className="font-heading">
              <Plus className="h-4 w-4 mr-1" /> Question
            </Button>
            <Button size="sm" variant="ghost" onClick={handleLogout} className="font-heading text-destructive hover:text-destructive">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">

        {/* ── Stats ── */}
        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" /> Dashboard
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { label: 'Total Questions', value: totalQuestions,          color: 'text-primary' },
              { label: 'Categories',      value: totalCategories,         color: 'text-accent' },
              { label: 'Easy',            value: diffCounts.easy   || 0,  color: 'text-correct' },
              { label: 'Medium',          value: diffCounts.medium || 0,  color: 'text-timer-warning' },
              { label: 'Hard',            value: diffCounts.hard   || 0,  color: 'text-destructive' },
            ].map(s => (
              <Card key={s.label} className="bg-gradient-card border-border">
                <CardHeader className="pb-2 pt-4 px-4">
                  <CardTitle className="text-sm font-heading text-muted-foreground">{s.label}</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {loadingStats
                    ? <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    : <div className={`text-3xl font-display font-bold ${s.color}`}>{s.value}</div>}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ── Category Filter ── */}
        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" /> Categories
          </h2>
          {loadingCategories ? (
            <div className="flex items-center gap-2 text-muted-foreground font-heading text-sm">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading categories…
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {/* ── "All" pill — no edit/delete ── */}
              <Button
                variant={selectedCategory === null ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(null)}
                className="font-heading"
              >
                All ({totalQuestions})
              </Button>

              {/* ── Category pills with inline Edit / Delete ── */}
              {categoriesData.map(c => (
                <div
                  key={c.id}
                  className="relative flex items-center group"
                  onMouseEnter={() => setHoveredCategory(c.id)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  {/* Main pill — click to filter */}
                  <Button
                    variant={selectedCategory === c.id ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(c.id)}
                    className={`font-heading pr-2 transition-all ${
                      hoveredCategory === c.id ? 'rounded-r-none border-r-0' : ''
                    }`}
                  >
                    {c.icon} {c.name} ({c.questions.length})
                  </Button>

                  {/* Edit / Delete actions — revealed on hover */}
                  <div
                    className={`
                      flex items-center overflow-hidden transition-all duration-200 ease-in-out
                      ${hoveredCategory === c.id ? 'w-auto opacity-100' : 'w-0 opacity-0'}
                      border border-l-0 rounded-r-md
                      ${selectedCategory === c.id ? 'border-primary bg-primary/10' : 'border-border bg-card'}
                    `}
                  >
                    {/* Edit button */}
                    <button
                      onClick={(e) => openEditCategory(c, e)}
                      title={`Edit "${c.name}"`}
                      className="
                        flex items-center justify-center h-8 w-8
                        text-muted-foreground hover:text-primary
                        hover:bg-primary/10
                        transition-colors
                      "
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>

                    {/* Divider */}
                    <span className="w-px h-4 bg-border" />

                    {/* Delete button */}
                    <button
                      onClick={(e) => openDeleteCategory(c, e)}
                      title={`Delete "${c.name}"`}
                      className="
                        flex items-center justify-center h-8 w-8
                        text-muted-foreground hover:text-destructive
                        hover:bg-destructive/10
                        transition-colors rounded-r-md
                      "
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Toolbar ── */}
        <section className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search questions..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-9 font-body" />
          </div>
          <Select value={difficultyFilter} onValueChange={v => setDifficultyFilter(v as Difficulty | 'all')}>
            <SelectTrigger className="w-40 font-heading">
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="easy">🟢 Easy</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="hard">🔴 Hard</SelectItem>
            </SelectContent>
          </Select>
          {selectedQuestions.size > 0 && (
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => setBulkDifficultyDialog(true)} className="font-heading">
                <SlidersHorizontal className="h-4 w-4 mr-1" /> Change Difficulty ({selectedQuestions.size})
              </Button>
              <Button size="sm" variant="destructive" onClick={() => setBulkDeleteDialog(true)} className="font-heading">
                <Trash2 className="h-4 w-4 mr-1" /> Delete ({selectedQuestions.size})
              </Button>
            </div>
          )}
        </section>

        {/* ── Questions Table ── */}
        <section>
          <h2 className="text-lg font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-primary" /> Questions ({filteredQuestions.length})
          </h2>
          <Card className="bg-gradient-card border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="w-10">
                    <input type="checkbox" className="rounded"
                      onChange={e => {
                        if (e.target.checked) setSelectedQuestions(new Set(filteredQuestions.map(q => q.id)));
                        else setSelectedQuestions(new Set());
                      }}
                      checked={selectedQuestions.size === filteredQuestions.length && filteredQuestions.length > 0}
                    />
                  </TableHead>
                  <TableHead className="text-muted-foreground font-heading w-12">#</TableHead>
                  <TableHead className="text-muted-foreground font-heading">Question</TableHead>
                  <TableHead className="text-muted-foreground font-heading hidden md:table-cell">Category</TableHead>
                  <TableHead className="text-muted-foreground font-heading hidden lg:table-cell">Answer</TableHead>
                  <TableHead className="text-muted-foreground font-heading text-center">Difficulty</TableHead>
                  <TableHead className="text-muted-foreground font-heading text-center">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loadingCategories ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                ) : filteredQuestions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground py-12 font-heading">
                      No questions found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredQuestions.map((q, i) => (
                    <TableRow key={q.id} className="border-border">
                      <TableCell>
                        <input type="checkbox" className="rounded" checked={selectedQuestions.has(q.id)} onChange={() => toggleSelect(q.id)} />
                      </TableCell>
                      <TableCell className="font-heading text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-body text-foreground max-w-xs lg:max-w-md">
                        <span className="line-clamp-2">{q.question}</span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <span className="font-heading text-muted-foreground">{q.categoryIcon} {q.categoryName}</span>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-correct font-heading text-sm">{q.options[q.correctAnswer]}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline" className={`${difficultyColor(q.difficulty)} font-heading capitalize text-xs`}>
                          {q.difficulty}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary" onClick={() => openEditQuestion(q)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={() => confirmDelete(q.id, q.categoryId)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </section>
      </main>

      {/* ── Add / Edit Question Dialog ── */}
      <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editingQuestion?.id ? 'Edit Question' : 'Add Question'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">Fill in all fields below</DialogDescription>
          </DialogHeader>
          {editingQuestion && (
            <div className="space-y-4">
              <div>
                <Label className="font-heading text-foreground">Category</Label>
                <Select value={editingCategoryId || ''} onValueChange={setEditingCategoryId}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoriesData.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="font-heading text-foreground">Question</Label>
                <Textarea
                  className="mt-1"
                  value={editingQuestion.question}
                  onChange={e => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  placeholder="Enter question text..."
                />
              </div>
              {editingQuestion.options.map((opt, idx) => (
                <div key={idx}>
                  <Label className="font-heading text-foreground">
                    Option {idx + 1}{' '}
                    {idx === editingQuestion.correctAnswer && (
                      <Badge className="ml-2 bg-correct/20 text-correct text-xs">Correct</Badge>
                    )}
                  </Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={opt}
                      onChange={e => {
                        const newOpts = [...editingQuestion.options];
                        newOpts[idx] = e.target.value;
                        setEditingQuestion({ ...editingQuestion, options: newOpts });
                      }}
                      placeholder={`Option ${idx + 1}`}
                    />
                    <Button
                      type="button"
                      variant={idx === editingQuestion.correctAnswer ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setEditingQuestion({ ...editingQuestion, correctAnswer: idx })}
                    >✓</Button>
                  </div>
                </div>
              ))}
              <div>
                <Label className="font-heading text-foreground">Difficulty</Label>
                <Select value={editingQuestion.difficulty} onValueChange={v => setEditingQuestion({ ...editingQuestion, difficulty: v as Difficulty })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">🟢 Easy</SelectItem>
                    <SelectItem value="medium">🟡 Medium</SelectItem>
                    <SelectItem value="hard">🔴 Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialog(false)} disabled={savingQuestion}>Cancel</Button>
            <Button onClick={saveQuestion} disabled={savingQuestion}>
              {savingQuestion && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingQuestion?.id ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Question Confirmation ── */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Delete Question</DialogTitle>
            <DialogDescription className="text-muted-foreground">This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialog(false)} disabled={deletingQuestion}>Cancel</Button>
            <Button variant="destructive" onClick={executeDelete} disabled={deletingQuestion}>
              {deletingQuestion && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Difficulty Change ── */}
      <Dialog open={bulkDifficultyDialog} onOpenChange={setBulkDifficultyDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Change Difficulty</DialogTitle>
            <DialogDescription className="text-muted-foreground">Update {selectedQuestions.size} selected questions</DialogDescription>
          </DialogHeader>
          <Select value={newDifficulty} onValueChange={v => setNewDifficulty(v as Difficulty)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="easy">🟢 Easy</SelectItem>
              <SelectItem value="medium">🟡 Medium</SelectItem>
              <SelectItem value="hard">🔴 Hard</SelectItem>
            </SelectContent>
          </Select>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDifficultyDialog(false)} disabled={bulkUpdating}>Cancel</Button>
            <Button onClick={bulkChangeDifficulty} disabled={bulkUpdating}>
              {bulkUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bulk Delete Confirmation ── */}
      <Dialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Delete {selectedQuestions.size} Questions</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. All selected questions will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkDeleteDialog(false)} disabled={bulkDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={executeBulkDelete} disabled={bulkDeleting}>
              {bulkDeleting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Add / Edit Category Dialog ── */}
      <Dialog open={categoryDialog} onOpenChange={setCategoryDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">
              {editingCategory ? 'Edit Category' : 'Add Category'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingCategory ? `Editing "${editingCategory.name}"` : 'Create a new quiz category'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="font-heading text-foreground">Icon (emoji)</Label>
              <Input className="mt-1" value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} />
            </div>
            <div>
              <Label className="font-heading text-foreground">Name</Label>
              <Input className="mt-1" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="Category name" />
            </div>
            <div>
              <Label className="font-heading text-foreground">Description</Label>
              <Input className="mt-1" value={categoryForm.description} onChange={e => setCategoryForm({ ...categoryForm, description: e.target.value })} placeholder="Short description" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCategoryDialog(false)} disabled={savingCategory}>Cancel</Button>
            <Button onClick={saveCategory} disabled={savingCategory}>
              {savingCategory && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Category Confirmation ── */}
      <Dialog open={deleteCategoryDialog} onOpenChange={setDeleteCategoryDialog}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground">Delete Category</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Delete <span className="font-semibold text-foreground">"{deleteCategoryTarget?.name}"</span>?
              {deleteCategoryTarget && deleteCategoryTarget.questions.length > 0 && (
                <span className="block mt-1 text-destructive">
                  This will also remove {deleteCategoryTarget.questions.length} question{deleteCategoryTarget.questions.length !== 1 ? 's' : ''} inside it.
                </span>
              )}
              {' '}This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteCategoryDialog(false)} disabled={deletingCategory}>Cancel</Button>
            <Button variant="destructive" onClick={executeDeleteCategory} disabled={deletingCategory}>
              {deletingCategory && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Settings Dialog ── */}
      <Dialog open={settingsDialog} onOpenChange={open => { if (!open) resetSettings(); setSettingsDialog(open); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="font-display text-foreground flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" /> Account Settings
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Change your email or password
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 mb-4">
            <Button
              variant={settingsTab === 'password' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSettingsTab('password')}
              className="font-heading"
            >
              <Key className="h-4 w-4 mr-1" /> Password
            </Button>
            <Button
              variant={settingsTab === 'email' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSettingsTab('email')}
              className="font-heading"
            >
              <Mail className="h-4 w-4 mr-1" /> Email
            </Button>
          </div>

          {settingsTab === 'password' ? (
            <div className="space-y-4">
              <div>
                <Label className="font-heading text-foreground">Current Password</Label>
                <Input
                  type="password"
                  className="mt-1"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div>
                <Label className="font-heading text-foreground">New Password</Label>
                <Input
                  type="password"
                  className="mt-1"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label className="font-heading text-foreground">New Email</Label>
                <Input
                  type="email"
                  className="mt-1"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  placeholder="Enter new email address"
                />
              </div>
              <div>
                <Label className="font-heading text-foreground">Confirm Password</Label>
                <Input
                  type="password"
                  className="mt-1"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => { setSettingsDialog(false); resetSettings(); }}
              disabled={savingSettings}
            >
              Cancel
            </Button>
            <Button onClick={saveSettings} disabled={savingSettings}>
              {savingSettings && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default Admin;