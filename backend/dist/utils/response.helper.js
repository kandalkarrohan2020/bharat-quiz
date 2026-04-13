export const sendSuccess = (res, data, message = 'Success', statusCode = 200, meta) => {
    const response = { success: true, message, data };
    if (meta)
        response.meta = meta;
    return res.status(statusCode).json(response);
};
export const sendCreated = (res, data, message = 'Resource created successfully') => sendSuccess(res, data, message, 201);
export const sendError = (res, message = 'Something went wrong', statusCode = 500, error) => {
    return res.status(statusCode).json({
        success: false,
        message,
        ...(error && { error }),
    });
};
export const buildPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};
export const parsePaginationQuery = (query) => {
    const page = Math.max(1, parseInt(String(query.page ?? 1), 10));
    const limit = Math.min(100, Math.max(1, parseInt(String(query.limit ?? 10), 10)));
    return { page, limit, skip: (page - 1) * limit };
};
//# sourceMappingURL=response.helper.js.map