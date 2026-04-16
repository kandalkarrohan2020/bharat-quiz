import { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button }   from '@/components/ui/button';
import { Label }    from '@/components/ui/label';
import { Badge }    from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { adminApi } from '@/services/api.admin';
import { Category } from '@/data/quizData';
import {
  FileSpreadsheet, Upload, Loader2, CheckCircle2, XCircle, AlertTriangle, Download,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

type Difficulty = 'easy' | 'medium' | 'hard';

export interface ImportRow {
  question: string;
  option1: string;
  option2: string;
  option3: string;
  option4: string;
  correctAnswer: 1 | 2 | 3 | 4;   // 1-indexed (friendlier for Excel authors)
  difficulty: Difficulty;
  // validation
  _valid: boolean;
  _errors: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: Category[];
  /** Called after a successful import so the parent can refresh its data */
  onImported: () => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const VALID_DIFFICULTIES = new Set<string>(['easy', 'medium', 'hard']);

function normalise(raw: Record<string, unknown>): ImportRow {
  const errors: string[] = [];

  const question = String(raw['question'] ?? raw['Question'] ?? '').trim();

  const option1 = String(
    raw['option1'] ?? raw['Option1'] ?? raw['Option A'] ?? raw['option_1'] ?? ''
  ).trim();

  const option2 = String(
    raw['option2'] ?? raw['Option2'] ?? raw['Option B'] ?? raw['option_2'] ?? ''
  ).trim();

  const option3 = String(
    raw['option3'] ?? raw['Option3'] ?? raw['Option C'] ?? raw['option_3'] ?? ''
  ).trim();

  const option4 = String(
    raw['option4'] ?? raw['Option4'] ?? raw['Option D'] ?? raw['option_4'] ?? ''
  ).trim();

  const rawCA =
    raw['correctAnswer'] ??
    raw['Correct Answer'] ??
    raw['correct_answer'] ??
    raw['answer'] ??
    '';

  const rawDiff = String(
    raw['difficulty'] ?? raw['Difficulty'] ?? 'easy'
  ).trim().toLowerCase();

  let correctAnswer: number;

  // Handle A/B/C/D OR 1/2/3/4
  if (typeof rawCA === 'string') {
    const map: Record<string, number> = {
      A: 1,
      B: 2,
      C: 3,
      D: 4,
    };
    correctAnswer = map[rawCA.toUpperCase()] || Number(rawCA);
  } else {
    correctAnswer = Number(rawCA);
  }

  // Validations
  if (!question) errors.push('Question is required');
  if (!option1) errors.push('Option 1 is required');
  if (!option2) errors.push('Option 2 is required');
  if (!option3) errors.push('Option 3 is required');
  if (!option4) errors.push('Option 4 is required');

  if (![1, 2, 3, 4].includes(correctAnswer)) {
    errors.push('correctAnswer must be A/B/C/D or 1–4');
  }

  if (!VALID_DIFFICULTIES.has(rawDiff)) {
    errors.push('difficulty must be easy / medium / hard');
  }

  return {
    question,
    option1,
    option2,
    option3,
    option4,
    correctAnswer: (correctAnswer as 1 | 2 | 3 | 4) || 1,
    difficulty: VALID_DIFFICULTIES.has(rawDiff)
      ? (rawDiff as Difficulty)
      : 'easy',
    _valid: errors.length === 0,
    _errors: errors,
  };
}

const diffColor = (d: string) => {
  if (d === 'easy')   return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
  if (d === 'medium') return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
  return 'bg-red-500/20 text-red-400 border-red-500/30';
};

// ─────────────────────────────────────────────────────────────
// Template download helper
// ─────────────────────────────────────────────────────────────

function downloadTemplate() {
  const sample = [
    {
      question:      'What is the capital of France?',
      option1:       'Berlin',
      option2:       'Madrid',
      option3:       'Paris',
      option4:       'Rome',
      correctAnswer: 3,
      difficulty:    'easy',
    },
    {
      question:      'Which planet is closest to the Sun?',
      option1:       'Venus',
      option2:       'Mercury',
      option3:       'Earth',
      option4:       'Mars',
      correctAnswer: 2,
      difficulty:    'medium',
    },
  ];

  const ws = XLSX.utils.json_to_sheet(sample);

  // Column widths
  ws['!cols'] = [
    { wch: 50 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 14 }, { wch: 12 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Questions');
  XLSX.writeFile(wb, 'questions_template.xlsx');
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export default function ExcelImportDialog({ open, onOpenChange, categories, onImported }: Props) {
  const { toast }    = useToast();
  const fileRef      = useRef<HTMLInputElement>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [rows,             setRows]             = useState<ImportRow[]>([]);
  const [fileName,         setFileName]         = useState('');
  const [importing,        setImporting]        = useState(false);
  const [step,             setStep]             = useState<'upload' | 'preview'>('upload');

  const validRows   = rows.filter(r => r._valid);
  const invalidRows = rows.filter(r => !r._valid);

  // ── Parse file ─────────────────────────────────────────────

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data  = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb    = XLSX.read(data, { type: 'array' });
      const ws    = wb.Sheets[wb.SheetNames[0]];
      const json  = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);
      setRows(json.map(normalise));
      setStep('preview');
    };
    reader.readAsArrayBuffer(file);
    // reset so same file can be re-selected
    e.target.value = '';
  };

  // ── Import ─────────────────────────────────────────────────

  const handleImport = async () => {
    if (!selectedCategory) {
      toast({ title: 'Select a category', description: 'Please choose a category before importing.', variant: 'destructive' });
      return;
    }
    if (validRows.length === 0) {
      toast({ title: 'No valid rows', description: 'Fix the errors before importing.', variant: 'destructive' });
      return;
    }

    setImporting(true);
    try {
      const payload = validRows.map(r => ({
        categoryId:    selectedCategory,
        question:      r.question,
        options:       [r.option1, r.option2, r.option3, r.option4] as [string, string, string, string],
        correctAnswer: (r.correctAnswer - 1) as 0 | 1 | 2 | 3,  // convert 1-indexed → 0-indexed
        difficulty:    r.difficulty,
      }));

      await adminApi.bulkCreateQuestions({ questions: payload });

      toast({
        title: `Imported ${validRows.length} question${validRows.length !== 1 ? 's' : ''}`,
        description: invalidRows.length > 0 ? `${invalidRows.length} row(s) were skipped due to errors.` : 'All rows imported successfully.',
      });

      onImported();
      handleClose();
    } catch (err: unknown) {
      toast({
        title:       'Import failed',
        description: err instanceof Error ? err.message : 'An unexpected error occurred.',
        variant:     'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

  // ── Reset / close ──────────────────────────────────────────

  const handleClose = () => {
    setRows([]);
    setFileName('');
    setStep('upload');
    setSelectedCategory('');
    onOpenChange(false);
  };

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-card border-border">

        {/* ── Header ── */}
        <DialogHeader className="shrink-0">
          <DialogTitle className="font-display text-foreground flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Import Questions from Excel
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Upload an <code className="text-xs bg-muted px-1 py-0.5 rounded">.xlsx</code> or{' '}
            <code className="text-xs bg-muted px-1 py-0.5 rounded">.csv</code> file to bulk-add questions to a category.
          </DialogDescription>
        </DialogHeader>

        {/* ── Category selector (always visible) ── */}
        <div className="shrink-0 space-y-1">
          <Label className="font-heading text-foreground">Target Category <span className="text-destructive">*</span></Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="font-heading">
              <SelectValue placeholder="Choose a category…" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">

          {/* ══ STEP 1 — Upload ══ */}
          {step === 'upload' && (
            <div className="space-y-5">

              {/* Drop zone */}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="
                  w-full rounded-xl border-2 border-dashed border-border
                  hover:border-primary hover:bg-primary/5
                  transition-colors cursor-pointer
                  flex flex-col items-center justify-center gap-3
                  py-14 px-6 text-center
                "
              >
                <Upload className="h-10 w-10 text-muted-foreground" />
                <p className="font-heading text-foreground text-sm">Click to browse or drag &amp; drop</p>
                <p className="text-xs text-muted-foreground">.xlsx · .xls · .csv supported</p>
              </button>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={handleFile} />

              {/* Template download */}
              <div className="rounded-lg bg-muted/40 border border-border p-4 flex items-start gap-3">
                <AlertTriangle className="h-4 w-4 text-timer-warning shrink-0 mt-0.5" />
                <div className="text-sm font-body text-muted-foreground space-y-1">
                  <p>Your sheet must have these columns (exact header names):</p>
                  <p className="font-mono text-xs bg-muted rounded px-2 py-1 text-foreground select-all">
                    question · option1 · option2 · option3 · option4 · correctAnswer · difficulty
                  </p>
                  <p><code className="text-xs">correctAnswer</code> = 1–4 (which option is correct).{' '}
                    <code className="text-xs">difficulty</code> = easy / medium / hard.</p>
                  <button
                    type="button"
                    onClick={downloadTemplate}
                    className="mt-1 inline-flex items-center gap-1.5 text-primary hover:underline text-xs font-heading"
                  >
                    <Download className="h-3.5 w-3.5" /> Download template (.xlsx)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ══ STEP 2 — Preview ══ */}
          {step === 'preview' && (
            <div className="space-y-4">

              {/* Summary bar */}
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-heading text-sm text-muted-foreground">
                  📄 <span className="text-foreground">{fileName}</span>
                </span>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/30 font-heading">
                  <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> {validRows.length} valid
                </Badge>
                {invalidRows.length > 0 && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30 font-heading">
                    <XCircle className="h-3.5 w-3.5 mr-1" /> {invalidRows.length} invalid
                  </Badge>
                )}
                <button
                  type="button"
                  onClick={() => { setRows([]); setFileName(''); setStep('upload'); fileRef.current?.click(); }}
                  className="ml-auto text-xs font-heading text-muted-foreground hover:text-foreground underline"
                >
                  Change file
                </button>
              </div>

              {/* Preview table */}
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/40">
                        <th className="px-3 py-2 text-left font-heading text-muted-foreground w-6">#</th>
                        <th className="px-3 py-2 text-left font-heading text-muted-foreground min-w-[200px]">Question</th>
                        <th className="px-3 py-2 text-left font-heading text-muted-foreground">Opt 1</th>
                        <th className="px-3 py-2 text-left font-heading text-muted-foreground">Opt 2</th>
                        <th className="px-3 py-2 text-left font-heading text-muted-foreground">Opt 3</th>
                        <th className="px-3 py-2 text-left font-heading text-muted-foreground">Opt 4</th>
                        <th className="px-3 py-2 text-center font-heading text-muted-foreground">✓</th>
                        <th className="px-3 py-2 text-center font-heading text-muted-foreground">Level</th>
                        <th className="px-3 py-2 text-center font-heading text-muted-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r, i) => (
                        <tr
                          key={i}
                          className={`border-b border-border last:border-0 ${
                            r._valid ? '' : 'bg-destructive/5'
                          }`}
                        >
                          <td className="px-3 py-2 text-muted-foreground font-heading">{i + 1}</td>
                          <td className="px-3 py-2 font-body text-foreground max-w-[260px]">
                            <span className="line-clamp-2">{r.question || <em className="text-muted-foreground">—</em>}</span>
                          </td>
                          {([r.option1, r.option2, r.option3, r.option4] as string[]).map((opt, oi) => (
                            <td
                              key={oi}
                              className={`px-3 py-2 max-w-[120px] truncate font-body text-sm ${
                                r.correctAnswer === oi + 1 ? 'text-emerald-400 font-semibold' : 'text-muted-foreground'
                              }`}
                            >
                              {opt || '—'}
                            </td>
                          ))}
                          <td className="px-3 py-2 text-center font-heading text-xs text-muted-foreground">
                            {r.correctAnswer}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <Badge variant="outline" className={`${diffColor(r.difficulty)} font-heading capitalize text-xs`}>
                              {r.difficulty}
                            </Badge>
                          </td>
                          <td className="px-3 py-2 text-center">
                            {r._valid
                              ? <CheckCircle2 className="h-4 w-4 text-emerald-400 mx-auto" />
                              : (
                                <div className="flex items-center justify-center gap-1 group relative">
                                  <XCircle className="h-4 w-4 text-destructive" />
                                  {/* Tooltip */}
                                  <div className="
                                    absolute bottom-full mb-1 right-0 z-50
                                    hidden group-hover:block
                                    bg-popover border border-border rounded-md shadow-lg
                                    p-2 text-xs font-body text-destructive
                                    w-48 text-left
                                  ">
                                    {r._errors.map((e, ei) => <p key={ei}>• {e}</p>)}
                                  </div>
                                </div>
                              )
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invalid warning */}
              {invalidRows.length > 0 && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm font-body text-destructive flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    {invalidRows.length} row{invalidRows.length !== 1 ? 's' : ''} have errors and will be <strong>skipped</strong>.
                    Hover the ✕ icon in the Status column to see details.
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <DialogFooter className="shrink-0 pt-2">
          <Button variant="outline" onClick={handleClose} disabled={importing} className="font-heading">
            Cancel
          </Button>

          {step === 'preview' && (
            <Button
              onClick={handleImport}
              disabled={importing || validRows.length === 0 || !selectedCategory}
              className="font-heading"
            >
              {importing
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Importing…</>
                : <><FileSpreadsheet className="h-4 w-4 mr-2" /> Import {validRows.length} Question{validRows.length !== 1 ? 's' : ''}</>
              }
            </Button>
          )}
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}