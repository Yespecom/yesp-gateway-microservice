require("dotenv").config()
const express = require("express")
const { connectMainDB } = require("./config/db")
const gatewayRoutes = require("./routes/gatewayRoutes")
const paymentRoutes = require("./routes/paymentRoutes")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(express.json()) // For parsing application/json

// Connect to the main database
connectMainDB()

// Routes
app.use("/api/gateway", gatewayRoutes)
app.use("/api/payments", paymentRoutes)

// Basic health check route
app.get("/", (req, res) => {
  res.send("Multi-tenant Payment Gateway Microservice is running!")
})

// Error handling middleware (optional, but good practice)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).send("Something broke!")
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Access the API at http://localhost:${PORT}`)
})
