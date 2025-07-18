const mongoose = require("mongoose")

const StoreGatewaySettingsSchema = new mongoose.Schema(
  {
    storeId: { type: String, required: true, unique: true },
    razorpay: {
      key_id: String,
      key_secret: String,
    },
    stripe: {
      secret_key: String,
    },
    phonepe: {
      merchant_id: String,
      secret_key: String,
    },
  },
  { timestamps: true },
)

module.exports = StoreGatewaySettingsSchema
