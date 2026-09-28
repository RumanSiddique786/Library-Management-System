// const express = require("express");
// const dotenv = require("dotenv");
// dotenv.config();
// const authRoutes = require("./routes/authRoutes");
// const app = express()

// app.get("/health", (req, res) => {
//     res.send("Server Is Running Perfectly....");
// });
// app.use("/api/v1/auth",authRoutes)
// const PORT = process.env.PORT || 4000;
// app.listen(PORT, () => {
//     console.log(`Server Is Running On: http://localhost:${PORT}/health `)
// })






require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const path = require('path')
const logger = require('./utils/logger')
const { errorMiddleware, notFoundMiddleware } = require('./middleware/error.middleware')

const app = express()

app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:4200',
  credentials: true,
}))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests' },
})
app.use('/api', limiter)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))
app.use('/uploads', express.static(path.join(__dirname, '../uploads')))

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Library Management System API',
    version: '1.0.0',
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
  })
})

//   All routes in one line!
app.use('/api', require('./routes/index'))

// Initialize Cron Jobs
const { initCronJobs } = require('./config/cronJobs')
initCronJobs()

app.use(notFoundMiddleware)
app.use(errorMiddleware)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`)
  logger.info(`📚 Library Management System API Ready`)
  logger.info(`🌍 Environment: ${process.env.NODE_ENV}`)
})

module.exports = app