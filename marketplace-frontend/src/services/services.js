import api from './api';

// ── Orders ─────────────────────────────────────────────────────────────
export const orderService = {
  create:      (data)         => api.post('/orders', data),
  getMyOrders: (params)       => api.get('/orders/my-orders', { params }),
  getOrder:    (id)           => api.get(`/orders/${id}`),
  cancel:      (id, reason)   => api.put(`/orders/${id}/cancel`, { reason }),
  getVendor:   (params)       => api.get('/orders/vendor', { params }),
  updateStatus:(id, data)     => api.put(`/orders/${id}/status`, data),
  getAll:      (params)       => api.get('/orders', { params }),
};

// ── Payment (PayPal) ───────────────────────────────────────────────────
export const paymentService = {
  createPayment: (data)    => api.post('/payment/create-payment', data),
  executePayment: (data)   => api.post('/payment/execute', data),
  refund:        (orderId, data) => api.post(`/payment/refund/${orderId}`, data),
  getStatus:     (orderId) => api.get(`/payment/status/${orderId}`),
};

// ── Delivery ───────────────────────────────────────────────────────────
export const deliveryService = {
  track:         (trackingNumber) => api.get(`/deliveries/track/${trackingNumber}`),
  calculateFee:  (data)           => api.post('/deliveries/calculate-fee', data),
  getByOrder:    (orderId)        => api.get(`/deliveries/order/${orderId}`),
  updateStatus:  (id, data)       => api.put(`/deliveries/${id}/status`, data),
};

// ── Reviews ────────────────────────────────────────────────────────────
export const reviewService = {
  getByProduct: (productId, params) => api.get(`/products/${productId}/reviews`, { params }),
  create:       (productId, data)   => api.post(`/products/${productId}/reviews`, data),
  update:       (id, data)          => api.put(`/reviews/${id}`, data),
  delete:       (id)                => api.delete(`/reviews/${id}`),
};

// ── Favorites ──────────────────────────────────────────────────────────
export const favoriteService = {
  getAll:  ()          => api.get('/favorites'),
  toggle:  (productId) => api.post(`/favorites/${productId}`),
  check:   (productId) => api.get(`/favorites/${productId}/check`),
};

// ── AI ─────────────────────────────────────────────────────────────────
export const aiService = {
  generateDescription:  (data) => api.post('/ai/generate-description', data),
  generateMultilingual: (data) => api.post('/ai/generate-multilingual', data),
  generateSEO:          (data) => api.post('/ai/generate-seo', data),
  suggestPrice:         (data) => api.post('/ai/suggest-price', data),
  improveText:          (data) => api.post('/ai/improve-text', data),
  getHistory:           (params) => api.get('/ai/history', { params }),
};

// ── Vendor ─────────────────────────────────────────────────────────────
export const vendorService = {
  getDashboard: () => api.get('/vendor/dashboard'),
};

// ── Admin ──────────────────────────────────────────────────────────────
export const adminService = {
  getStats:           ()       => api.get('/admin/stats'),
  getUsers:           (params) => api.get('/admin/users', { params }),
  toggleUserStatus:   (id)     => api.put(`/admin/users/${id}/toggle-status`),
  getPendingVendors:  ()       => api.get('/admin/vendors/pending'),
  approveVendor:      (id, approved) => api.put(`/admin/vendors/${id}/approval`, { approved }),
  toggleFeature:      (id)     => api.put(`/admin/products/${id}/feature`),
};

// ── Categories ─────────────────────────────────────────────────────────
export const categoryService = {
  getAll:  (params) => api.get('/categories', { params }),
  create:  (data)   => api.post('/categories', data),
  update:  (id, data) => api.put(`/categories/${id}`, data),
  delete:  (id)     => api.delete(`/categories/${id}`),
};

// ── Products (vendor) ──────────────────────────────────────────────────
export const productService = {
  getAll:     (params) => api.get('/products', { params }),
  getOne:     (id)     => api.get(`/products/${id}`),
  getMine:    (params) => api.get('/products/my-products', { params }),
  create:     (data)   => api.post('/products', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update:     (id, data) => api.put(`/products/${id}`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete:     (id)     => api.delete(`/products/${id}`),
  deleteImage:(id, imageId) => api.delete(`/products/${id}/images/${imageId}`),
};
