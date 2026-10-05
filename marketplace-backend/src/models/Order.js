const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderNumber: {
      type: String,
      unique: true,
    },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        vendor: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        name: String, // snapshot at time of order
        image: String,
        price: { type: Number, required: true },
        quantity: { type: Number, required: true, min: 1 },
        subtotal: Number,
      },
    ],
    shippingAddress: {
      fullName: { type: String, required: true },
      phone: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
      state: String,
      postalCode: String,
      country: { type: String, default: 'MA' },
    },
    pricing: {
      subtotal: { type: Number, required: true },
      shippingFee: { type: Number, default: 0 },
      discount: { type: Number, default: 0 },
      total: { type: Number, required: true },
    },
    paymentMethod: {
      type: String,
      enum: ['cash_on_delivery', 'paypal'],
      default: 'cash_on_delivery',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'awaiting_payment', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    paypal: {
      paymentId: { type: String, default: null },
      payerId: { type: String, default: null },
      transactionId: { type: String, default: null },
      refundId: { type: String, default: null },
      amount: { type: Number, default: null }, // in MAD
      currency: { type: String, default: 'MAD' },
      receiptUrl: { type: String, default: null },
    },
    paidAt:    Date,
    refundedAt: Date,
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'preparing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
    statusHistory: [
      {
        status: String,
        updatedAt: { type: Date, default: Date.now },
        note: String,
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      },
    ],
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    notes: String,
    cancelReason: String,
    cancelledAt: Date,
    confirmedAt: Date,
    shippedAt: Date,
    deliveredAt: Date,
    estimatedDelivery: Date,
  },
  { timestamps: true }
);

// Auto-generate order number
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const count = await mongoose.model('Order').countDocuments();
    this.orderNumber = `ORD-${Date.now()}-${String(count + 1).padStart(4, '0')}`;
  }
  // Calculate subtotals
  this.items = this.items.map((item) => ({
    ...item.toObject ? item.toObject() : item,
    subtotal: item.price * item.quantity,
  }));
  // Add to status history on status change
  if (this.isModified('status')) {
    this.statusHistory.push({ status: this.status });
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
