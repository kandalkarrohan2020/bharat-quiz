import { sendError } from '../utils/response.helper.js';
export const validate = (schema, target = 'body') => (req, res, next) => {
    console.log("BODY RECEIVED:", req.body);
    const result = schema.safeParse(req[target]);
    if (!result.success) {
        const error = result.error;
        const message = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
        sendError(res, message, 400);
        return;
    }
    // Replace the target with the parsed (coerced & stripped) data
    req[target] = result.data;
    next();
};
//# sourceMappingURL=validate.middleware.js.map