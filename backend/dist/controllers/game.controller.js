import { GameService } from '../services/game.service.js';
import { sendSuccess, sendCreated } from '../utils/response.helper.js';
// ─────────────────────────────────────────────────────────────
// GameController
// ─────────────────────────────────────────────────────────────
export const GameController = {
    // ============================================================
    // POST /api/v1/game/results
    // Public — no auth required.
    // Body: SaveResultPayload
    // ============================================================
    saveResult: async (req, res, next) => {
        try {
            const result = await GameService.saveResult(req.body);
            if (!result.saved) {
                // Existing record was better — still 200, not an error
                sendSuccess(res, result.result, result.message ?? 'Score not improved');
                return;
            }
            sendCreated(res, result.result, 'Result saved successfully');
        }
        catch (err) {
            next(err);
        }
    },
    // ============================================================
    // GET /api/v1/game/leaderboard
    // Public — but email field only returned when caller is admin.
    //
    // Admin detection:
    //   The route passes through `optionalAdminAuth` middleware which
    //   sets req.isAdmin = true when a valid admin JWT is present.
    //   The frontend sends the admin token via Authorization header
    //   when calling getLeaderboardAdmin().
    // ============================================================
    getLeaderboard: async (req, res, next) => {
        try {
            // includeEmail = true only when:
            //   1. Caller is an authenticated admin, AND
            //   2. They explicitly pass ?showEmail=1
            const includeEmail = req.isAdmin === true && req.query.showEmail === '1';
            const { leaderboard, meta } = await GameService.getLeaderboard(req.query, includeEmail);
            sendSuccess(res, leaderboard, 'Leaderboard fetched successfully', 200, meta);
        }
        catch (err) {
            next(err);
        }
    },
};
//# sourceMappingURL=game.controller.js.map