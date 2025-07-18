const express = require("express")
const router = express.Router()
const paymentController = require("../controllers/paymentController")
const auth = require("../middleware/auth") // Your authentication middleware

// Route to record a payment
router.post("/", auth, paymentController.createPayment)

// Route to get all payments for a store
router.get("/", auth, paymentController.getPayments)

module.exports = router
