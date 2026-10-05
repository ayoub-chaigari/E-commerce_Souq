const mongoose = require('mongoose');

const deliverySchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      unique: true,
    },
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    trackingNumber: {
      type: String,
      unique: true,
    },
    carrier: {
      type: String,
      default: 'Marketplace Delivery',
    },
    status: {
      type: String,
      enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned'],
      default: 'pending',
    },
    timeline: [
      {
        status: String,
        description: String,
        location: String,
        timestamp: { type: Date, default: Date.now },
      },
    ],
    estimatedDeliveryDate: Date,
    actualDeliveryDate: Date,
    deliveryAddress: {
      fullName: String,
      phone: String,
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    notes: String,
    // Simulated delivery agent
    deliveryAgent: {
      name: String,
      phone: String,
    },
  },
  { timestamps: true }
);

// Auto-generate tracking number
deliverySchema.pre('save', function (next) {
  if (!this.trackingNumber) {
    this.trackingNumber = `TRK-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }
  next();
});

// Static: calculate simulated shipping fee
deliverySchema.statics.calculateShippingFee = function (city, weight = 500) {
  const cityRates = {
    casablanca: 25,
    rabat: 30,
    marrakech: 35,
    fes: 35,
    tanger: 40,
    agadir: 40,
  };
  const baseRate = cityRates[city?.toLowerCase()] || 50;
  const weightSurcharge = weight > 1000 ? Math.ceil((weight - 1000) / 500) * 5 : 0;
  return baseRate + weightSurcharge;
};

// Static: estimate delivery date
deliverySchema.statics.estimateDeliveryDate = function (city) {
  const localCities = ['casablanca', 'rabat', 'sale'];
  const isLocal = localCities.includes(city?.toLowerCase());
  const daysToAdd = isLocal ? 2 : 4;
  const estimated = new Date();
  estimated.setDate(estimated.getDate() + daysToAdd);
  // Skip weekends
  if (estimated.getDay() === 0) estimated.setDate(estimated.getDate() + 1);
  if (estimated.getDay() === 6) estimated.setDate(estimated.getDate() + 2);
  return estimated;
};

module.exports = mongoose.model('Delivery', deliverySchema);
