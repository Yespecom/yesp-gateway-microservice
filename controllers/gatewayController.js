const Razorpay = require("razorpay")
const Stripe = require("stripe")
const StoreGatewaySettingsSchema = require("../models/tenant/StoreGatewaySettings")
const { connectTenantDB, connectMainDB } = require("../config/db")
const mongoose = require("mongoose") // Changed from import to require

// Helper function to get tenant DB name (copied from paymentController for self-containment)
const getTenantDbName = async (tenantId) => {
  const Tenant = mongoose.model(
    "Tenant",
    new mongoose.Schema({
      tenantId: String,
      dbName: String,
    }),
    "tenants",
  )
  await connectMainDB()
  const tenant = await Tenant.findOne({ tenantId })
  if (!tenant || !tenant.dbName) throw new Error("Tenant DB not found")
  return tenant.dbName
}

const getGatewayKeys = async (storeId, tenantId) => {
  const dbName = await getTenantDbName(tenantId)
  const tenantDb = await connectTenantDB(dbName)
  const StoreGatewaySettings = tenantDb.model("StoreGatewaySettings", StoreGatewaySettingsSchema)
  return await StoreGatewaySettings.findOne({ storeId })
}

// Expose a POST API: Route: /api/gateway/settings
exports.updateGatewaySettings = async (req, res) => {
  const { storeId, tenantId } = req
  const dbName = await getTenantDbName(tenantId)
  const tenantDb = await connectTenantDB(dbName)

  const StoreGatewaySettings = tenantDb.model("StoreGatewaySettings", StoreGatewaySettingsSchema)

  const { razorpay, stripe, phonepe } = req.body

  try {
    await StoreGatewaySettings.findOneAndUpdate({ storeId }, { razorpay, stripe, phonepe }, { upsert: true, new: true })
    res.json({ message: "Gateway credentials updated successfully" })
  } catch (error) {
    console.error("Error updating credentials", error)
    res.status(500).json({ message: "Failed to update credentials" })
  }
}

// Use the Keys Dynamically While Creating Orders
exports.initiatePayment = async (req, res) => {
  const { storeId, tenantId } = req
  const { method, amount } = req.body

  try {
    const settings = await getGatewayKeys(storeId, tenantId)
    if (!settings) return res.status(404).json({ message: "Payment gateway settings not found" })

    let result = {}

    if (method === "razorpay") {
      if (!settings.razorpay || !settings.razorpay.key_id || !settings.razorpay.key_secret) {
        return res.status(400).json({ message: "Razorpay keys not configured for this store." })
      }
      const razorpay = new Razorpay({
        key_id: settings.razorpay.key_id,
        key_secret: settings.razorpay.key_secret,
      })

      const order = await razorpay.orders.create({
        amount: amount * 100, // amount in smallest currency unit
        currency: "INR",
        receipt: `rcpt_${Date.now()}`,
      })

      result = {
        gateway: "razorpay",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      }
    } else if (method === "stripe") {
      if (!settings.stripe || !settings.stripe.secret_key) {
        return res.status(400).json({ message: "Stripe secret key not configured for this store." })
      }
      const stripe = new Stripe(settings.stripe.secret_key)

      const intent = await stripe.paymentIntents.create({
        amount: amount * 100, // amount in smallest currency unit
        currency: "INR",
        automatic_payment_methods: { enabled: true },
      })

      result = {
        gateway: "stripe",
        clientSecret: intent.client_secret,
        amount: intent.amount,
        currency: intent.currency,
      }
    } else if (method === "phonepe") {
      // PhonePe integration would typically involve calling their API.
      // For this example, we'll use mock data as provided.
      if (!settings.phonepe || !settings.phonepe.merchant_id || !settings.phonepe.secret_key) {
        return res.status(400).json({ message: "PhonePe keys not configured for this store." })
      }
      result = {
        gateway: "phonepe",
        transactionId: `TXN-${Date.now()}`,
        paymentUrl: `https://mock.phonepe.com/pay/${Date.now()}`, // Mock URL
        merchantId: settings.phonepe.merchant_id,
      }
    } else {
      return res.status(400).json({ message: "Unsupported method" })
    }

    res.json({ success: true, data: result })
  } catch (error) {
    console.error("Error initiating payment:", error)
    res.status(500).json({ message: "Gateway error", error: error.message })
  }
}
