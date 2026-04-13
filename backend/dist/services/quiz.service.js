import { Types } from 'mongoose';
import { Category } from '../models/category.model.js';
import { QuizAttempt } from '../models/quiz-attempt.model.js';
import { NotFoundError, ValidationError } from '../utils/app-error.js';
import { getTitleByScore, getMotivationalMessage, calculateScore, } from '../utils/quiz.helper.js';
import { buildPaginationMeta, parsePaginationQuery, } from '../utils/response.helper.js';
export const QuizService = {
    // ============================================================
    // Submit Attempt
    // ============================================================
    async submitAttempt(userId, payload) {
        const { categoryId, timeTaken, answers, } = payload;
        if (!Types.ObjectId.isValid(categoryId)) {
            throw new ValidationError('Invalid category ID');
        }
        const category = await Category.findOne({
            _id: categoryId,
            isActive: true,
        });
        if (!category)
            throw new NotFoundError('Category');
        let answerRecords = [];
        if (answers && answers.length > 0) {
            const questionMap = new Map(category.questions.map((q) => [String(q._id), q]));
            answerRecords = answers.map((ans) => {
                const dbQ = questionMap.get(String(ans.questionId));
                if (!dbQ) {
                    throw new ValidationError(`Question ${ans.questionId} not found`);
                }
                const isCorrect = ans.selectedAnswer === dbQ.correctAnswer;
                return {
                    questionId: dbQ._id,
                    question: dbQ.question,
                    selectedAnswer: ans.selectedAnswer,
                    correctAnswer: dbQ.correctAnswer,
                    isCorrect,
                    difficulty: dbQ.difficulty,
                    timeTaken: ans.timeTaken ?? 0,
                };
            });
        }
        const correctAnswers = answerRecords.filter((a) => a.isCorrect).length;
        const totalQuestions = answerRecords.length;
        const wrongAnswers = totalQuestions - correctAnswers;
        const { score, percentage } = calculateScore(correctAnswers, totalQuestions);
        const { title, emoji } = getTitleByScore(score, totalQuestions);
        const motivationalMessage = getMotivationalMessage(score, totalQuestions);
        const attempt = await QuizAttempt.create({
            user: userId,
            category: categoryId,
            categoryName: category.name,
            answers: answerRecords,
            score,
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            percentage,
            timeTaken: timeTaken ?? 0,
            earnedTitle: title,
            titleEmoji: emoji,
        });
        return {
            attemptId: attempt._id,
            score,
            totalQuestions,
            correctAnswers,
            wrongAnswers,
            percentage,
            timeTaken: attempt.timeTaken,
            title,
            titleEmoji: emoji,
            motivationalMessage,
            questionBreakdown: answerRecords,
        };
    },
    // ============================================================
    // User History
    // ============================================================
    async getUserHistory(userId, query) {
        const { page, limit, skip } = parsePaginationQuery(query);
        const filter = { user: userId };
        if (query.categoryId)
            filter.category = query.categoryId;
        if (query.difficulty)
            filter.difficulty = query.difficulty;
        const [attempts, total] = await Promise.all([
            QuizAttempt.find(filter)
                .select('-answers -__v')
                .sort({ completedAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            QuizAttempt.countDocuments(filter),
        ]);
        return {
            attempts,
            meta: buildPaginationMeta(total, page, limit),
        };
    },
    // ============================================================
    // Get Attempt By ID
    // ============================================================
    async getAttemptById(attemptId, userId) {
        if (!Types.ObjectId.isValid(attemptId)) {
            throw new ValidationError('Invalid attempt ID');
        }
        const attempt = await QuizAttempt.findOne({
            _id: attemptId,
            user: userId,
        }).lean();
        if (!attempt)
            throw new NotFoundError('Attempt');
        return attempt;
    },
    // ============================================================
    // Leaderboard (MATCH FRONTEND)
    // ============================================================
    async getLeaderboard(query) {
        const { page, limit, skip } = parsePaginationQuery(query);
        const match = {};
        if (query.categoryId) {
            if (!Types.ObjectId.isValid(String(query.categoryId))) {
                throw new ValidationError('Invalid category ID');
            }
            match.category = new Types.ObjectId(String(query.categoryId));
        }
        if (query.difficulty) {
            match.difficulty = query.difficulty;
        }
        const [results, totalArr] = await Promise.all([
            QuizAttempt.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { user: '$user', category: '$category' },
                        bestScore: { $max: '$percentage' },
                        bestTime: { $min: '$timeTaken' },
                        totalQuestions: { $first: '$totalQuestions' },
                        playerName: { $first: '$playerName' },
                        difficulty: { $first: '$difficulty' },
                        earnedTitle: { $first: '$earnedTitle' },
                        achievedAt: { $max: '$completedAt' },
                    },
                },
                { $sort: { bestScore: -1, bestTime: 1 } },
                { $skip: skip },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: '_id.user',
                        foreignField: '_id',
                        as: 'userInfo',
                    },
                },
                { $unwind: '$userInfo' },
                {
                    $project: {
                        _id: 0,
                        playerName: {
                            $ifNull: ['$playerName', '$userInfo.name'],
                        },
                        score: {
                            $round: [
                                {
                                    $divide: [
                                        { $multiply: ['$bestScore', '$totalQuestions'] },
                                        100,
                                    ],
                                },
                                0,
                            ],
                        },
                        totalQuestions: 1,
                        percentage: '$bestScore',
                        difficulty: 1,
                        title: '$earnedTitle',
                        completedAt: '$achievedAt',
                    },
                },
            ]),
            QuizAttempt.aggregate([
                { $match: match },
                {
                    $group: {
                        _id: { user: '$user', category: '$category' },
                    },
                },
                { $count: 'total' },
            ]),
        ]);
        const totalCount = totalArr[0]?.total ?? 0;
        const leaderboard = results.map((entry, idx) => ({
            rank: skip + idx + 1,
            ...entry,
        }));
        return {
            leaderboard,
            meta: buildPaginationMeta(totalCount, page, limit),
        };
    },
    // ============================================================
    // User Stats
    // ============================================================
    async getUserStats(userId) {
        const stats = await QuizAttempt.aggregate([
            { $match: { user: new Types.ObjectId(userId) } },
            {
                $group: {
                    _id: '$user',
                    totalAttempts: { $sum: 1 },
                    avgPercentage: { $avg: '$percentage' },
                    bestPercentage: { $max: '$percentage' },
                    totalTimeTaken: { $sum: '$timeTaken' },
                    categoriesAttempted: { $addToSet: '$category' },
                },
            },
            {
                $project: {
                    _id: 0,
                    totalAttempts: 1,
                    avgPercentage: { $round: ['$avgPercentage', 2] },
                    bestPercentage: 1,
                    totalTimeTaken: 1,
                    uniqueCategories: { $size: '$categoriesAttempted' },
                },
            },
        ]);
        return (stats[0] ?? {
            totalAttempts: 0,
            avgPercentage: 0,
            bestPercentage: 0,
            totalTimeTaken: 0,
            uniqueCategories: 0,
        });
    },
};
//# sourceMappingURL=quiz.service.js.map