const express = require("express")
const router = express.Router()
const gatewayController = require("../controllers/gatewayController")
const auth = require("../middleware/auth") // Your authentication middleware

// Route to update/set gateway credentials for a store
router.post("/settings", auth, gatewayController.updateGatewaySettings)

// Route to initiate a payment
router.post("/initiate-payment", auth, gatewayController.initiatePayment)

module.exports = router
