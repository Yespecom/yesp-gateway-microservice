const mongoose = require("mongoose")

const PaymentSchema = new mongoose.Schema(
  {
    paymentId: { type: String, required: true, unique: true },
    orderId: { type: String, required: true },
    storeId: { type: String, required: true },
    tenantId: { type: String, required: true },
    method: { type: String, required: true }, // e.g., 'razorpay', 'stripe', 'phonepe'
    amount: { type: Number, required: true },
    transactionRef: { type: String }, // Reference from the gateway
    status: { type: String, default: "pending" }, // e.g., 'pending', 'paid', 'failed'
    paidAt: { type: Date },
  },
  { timestamps: true },
)

module.exports = PaymentSchema
