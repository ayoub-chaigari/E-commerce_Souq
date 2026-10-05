exports.sendSuccess = (res, statusCode = 200, message = 'Success', data = {}) => {
  return res.status(statusCode).json({ success: true, message, ...data });
};

exports.sendError = (res, statusCode = 500, message = 'Error') => {
  return res.status(statusCode).json({ success: false, message });
};

exports.sendPaginated = (res, data, total, page, limit) => {
  return res.status(200).json({
    success: true,
    count: data.length,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
    data,
  });
};
