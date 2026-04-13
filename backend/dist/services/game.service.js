import { Types } from 'mongoose';
import { GameResult } from '../models/game-result.model.js';
import { ValidationError } from '../utils/app-error.js';
import { buildPaginationMeta, parsePaginationQuery, } from '../utils/response.helper.js';
// ─────────────────────────────────────────────────────────────
// GameService
// ─────────────────────────────────────────────────────────────
export const GameService = {
    // ============================================================
    // Save Result
    // Upserts: if the player already has a result for this
    // category+difficulty, only overwrite if the new score is better.
    // ============================================================
    async saveResult(payload) {
        const { playerName, playerEmail, playerContact, categoryId, categoryName, score, totalQuestions, percentage, difficulty, title, completedAt, } = payload;
        // Basic validation
        if (!playerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(playerEmail)) {
            throw new ValidationError('Valid player email is required');
        }
        if (!playerName || playerName.trim().length < 2) {
            throw new ValidationError('Player name must be at least 2 characters');
        }
        if (!Types.ObjectId.isValid(categoryId)) {
            throw new ValidationError('Invalid category ID');
        }
        if (score < 0 || score > totalQuestions) {
            throw new ValidationError('Score is out of range');
        }
        const filter = {
            playerEmail: playerEmail.toLowerCase().trim(),
            categoryId: new Types.ObjectId(categoryId),
            difficulty,
        };
        // Find existing record for this player+category+difficulty
        const existing = await GameResult.findOne(filter).lean();
        if (existing) {
            // Only update if new score is strictly better
            if (percentage <= existing.percentage) {
                return {
                    saved: false,
                    message: 'Existing score is equal or better — not overwritten',
                    result: existing,
                };
            }
            // Update with the better score
            const updated = await GameResult.findOneAndUpdate(filter, {
                $set: {
                    playerName,
                    playerContact: playerContact ?? null,
                    categoryName,
                    score,
                    totalQuestions,
                    percentage,
                    title,
                    completedAt: completedAt ? new Date(completedAt) : new Date(),
                },
            }, { new: true }).lean();
            return { saved: true, improved: true, result: updated };
        }
        // First attempt — create new document
        const result = await GameResult.create({
            playerName: playerName.trim(),
            playerEmail: playerEmail.toLowerCase().trim(),
            playerContact: playerContact ?? null,
            categoryId: new Types.ObjectId(categoryId),
            categoryName,
            score,
            totalQuestions,
            percentage,
            difficulty,
            title,
            completedAt: completedAt ? new Date(completedAt) : new Date(),
        });
        return { saved: true, improved: false, result };
    },
    // ============================================================
    // Leaderboard
    // Returns ranked list.  Email field included only when
    // showEmail === '1' (admin-gated at controller level).
    // ============================================================
    async getLeaderboard(query, includeEmail = false) {
        const { page, limit, skip } = parsePaginationQuery(query);
        const match = {};
        if (query.categoryId) {
            if (!Types.ObjectId.isValid(String(query.categoryId))) {
                throw new ValidationError('Invalid category ID');
            }
            match.categoryId = new Types.ObjectId(String(query.categoryId));
        }
        if (query.difficulty) {
            const allowed = ['easy', 'medium', 'hard'];
            if (!allowed.includes(String(query.difficulty))) {
                throw new ValidationError('Invalid difficulty value');
            }
            match.difficulty = String(query.difficulty);
        }
        // Build the projection dynamically — email only for admins
        const project = {
            _id: 0,
            playerName: 1,
            score: 1,
            totalQuestions: 1,
            percentage: 1,
            difficulty: 1,
            categoryName: 1,
            title: 1,
            completedAt: 1,
        };
        if (includeEmail) {
            project.playerEmail = 1;
            project.playerContact = 1;
        }
        const [results, total] = await Promise.all([
            GameResult.aggregate([
                { $match: match },
                { $sort: { percentage: -1, completedAt: 1 } },
                { $skip: skip },
                { $limit: limit },
                { $project: project },
            ]),
            GameResult.countDocuments(match),
        ]);
        const leaderboard = results.map((entry, idx) => ({
            rank: skip + idx + 1,
            ...entry,
        }));
        return {
            leaderboard,
            meta: buildPaginationMeta(total, page, limit),
        };
    },
};
//# sourceMappingURL=game.service.js.map