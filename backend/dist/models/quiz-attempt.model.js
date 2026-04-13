import mongoose from 'mongoose';
const { Schema, model } = mongoose;
// ── Answer sub-document ──────────────────────────────────────
const answerRecordSchema = new Schema({
    questionId: { type: Schema.Types.ObjectId, required: true },
    question: { type: String, required: true },
    selectedAnswer: { type: Number, required: true, min: 0 },
    correctAnswer: { type: Number, required: true, min: 0 },
    isCorrect: { type: Boolean, required: true },
    difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
    timeTaken: { type: Number, required: true, min: 0 },
}, { _id: false });
// ── Quiz attempt schema ──────────────────────────────────────
const quizAttemptSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
        index: true,
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: [true, 'Category reference is required'],
        index: true,
    },
    categoryName: { type: String, required: true },
    // Stored from the frontend welcome screen input
    playerName: { type: String, trim: true, default: null },
    // Difficulty level the user played at (from GameContext state)
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: [true, 'Difficulty is required'],
    },
    answers: { type: [answerRecordSchema], required: true },
    score: { type: Number, required: true, min: 0 },
    totalQuestions: { type: Number, required: true, min: 1 },
    correctAnswers: { type: Number, required: true, min: 0 },
    wrongAnswers: { type: Number, required: true, min: 0 },
    percentage: { type: Number, required: true, min: 0, max: 100 },
    timeTaken: { type: Number, required: true, min: 0 },
    earnedTitle: { type: String, required: true },
    titleEmoji: { type: String, required: true },
    completedAt: { type: Date, default: Date.now },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});
// ── Indexes for leaderboard & history queries ─────────────────
quizAttemptSchema.index({ category: 1, difficulty: 1, percentage: -1, timeTaken: 1 });
quizAttemptSchema.index({ user: 1, category: 1, completedAt: -1 });
quizAttemptSchema.index({ percentage: -1, timeTaken: 1 });
quizAttemptSchema.index({ difficulty: 1, percentage: -1 });
export const QuizAttempt = model('QuizAttempt', quizAttemptSchema);
//# sourceMappingURL=quiz-attempt.model.js.map