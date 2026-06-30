const express = require("express");
const dotenv = require("dotenv");
dotenv.config();
const authRoutes = require("./routes/authRoutes");
const app = express()

app.get("/health", (req, res) => {
    res.send("Server Is Running Perfectly....");
});
app.use("/api/v1/auth",authRoutes)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server Is Running On: http://localhost:${PORT}/health `)
})