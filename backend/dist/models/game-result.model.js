import mongoose from 'mongoose';
const { Schema, model } = mongoose;
// ─────────────────────────────────────────────────────────────
// GameResult — stores one completed game per guest player.
// No user ref required; identified by playerEmail.
// ─────────────────────────────────────────────────────────────
const gameResultSchema = new Schema({
    // ── Player identity (from WelcomeScreen) ──────────────────
    playerName: {
        type: String,
        required: [true, 'Player name is required'],
        trim: true,
    },
    playerEmail: {
        type: String,
        required: [true, 'Player email is required'],
        trim: true,
        lowercase: true,
        index: true,
    },
    playerContact: {
        type: String,
        trim: true,
        default: null,
    },
    // ── Category info ─────────────────────────────────────────
    categoryId: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
        index: true,
    },
    categoryName: {
        type: String,
        required: true,
    },
    // ── Result data ───────────────────────────────────────────
    score: {
        type: Number,
        required: true,
        min: 0,
    },
    totalQuestions: {
        type: Number,
        required: true,
        min: 1,
    },
    percentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100,
    },
    difficulty: {
        type: String,
        enum: ['easy', 'medium', 'hard'],
        required: true,
        index: true,
    },
    title: {
        type: String,
        required: true,
    },
    completedAt: {
        type: Date,
        default: Date.now,
        index: true,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
});
// ── Compound indexes for leaderboard queries ──────────────────
gameResultSchema.index({ difficulty: 1, percentage: -1, completedAt: -1 });
gameResultSchema.index({ categoryId: 1, difficulty: 1, percentage: -1 });
gameResultSchema.index({ percentage: -1, completedAt: -1 });
// ── Prevent leaderboard duplication: keep best score per
//    player+category+difficulty combo (handled in service) ─────
gameResultSchema.index({ playerEmail: 1, categoryId: 1, difficulty: 1 }, { name: 'unique_player_attempt' });
export const GameResult = model('GameResult', gameResultSchema);
//# sourceMappingURL=game-result.model.js.map