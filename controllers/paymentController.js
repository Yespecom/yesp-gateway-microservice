const { connectMainDB, connectTenantDB } = require("../config/db")
const PaymentSchema = require("../models/Payment")
const mongoose = require("mongoose") // Added mongoose import

const getTenantDbName = async (tenantId) => {
  // This assumes a 'tenants' collection exists in the main database
  // with documents having 'tenantId' and 'dbName' fields.
  const Tenant = mongoose.model(
    "Tenant",
    new mongoose.Schema({
      tenantId: String,
      dbName: String,
    }),
    "tenants", // Explicitly specify collection name 'tenants'
  )
  await connectMainDB()
  const tenant = await Tenant.findOne({ tenantId })
  if (!tenant || !tenant.dbName) throw new Error("Tenant DB not found")
  return tenant.dbName
}

// ✅ Create payment
exports.createPayment = async (req, res) => {
  try {
    const { tenantId, storeId } = req
    const { orderId, amount, method, transactionRef } = req.body
    const dbName = await getTenantDbName(tenantId)
    const tenantDb = await connectTenantDB(dbName)
    const Payment = tenantDb.model("Payment", PaymentSchema)
    const newPayment = new Payment({
      paymentId: "PAY-" + Date.now(),
      orderId,
      storeId,
      tenantId,
      method,
      amount,
      transactionRef,
      status: "paid", // Assuming 'paid' for simplicity in this example
      paidAt: new Date(),
    })
    await newPayment.save()
    res.status(201).json({ message: "Payment recorded", payment: newPayment })
  } catch (err) {
    console.error("Error creating payment:", err)
    res.status(500).json({ message: "Internal error" })
  }
}

// ✅ Get all payments
exports.getPayments = async (req, res) => {
  try {
    const { tenantId, storeId } = req
    const dbName = await getTenantDbName(tenantId)
    const tenantDb = await connectTenantDB(dbName)
    const Payment = tenantDb.model("Payment", PaymentSchema)
    const payments = await Payment.find({ storeId }).sort({ createdAt: -1 })
    res.json({ payments })
  } catch (err) {
    console.error("Error fetching payments:", err)
    res.status(500).json({ message: "Internal error" })
  }
}
