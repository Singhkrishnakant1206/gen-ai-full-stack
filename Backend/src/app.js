const express = require("express")

const cookieParser = require("cookie-parser")
const cors = require("cors")

const app = express()

app.use(express.json())

app.use(cookieParser())

app.use(cors({
    origin: [
        "http://localhost:5173",
        "https://gen-ai-full-stack-frontend.onrender.com"
    ],
    credentials: true
}))

const authRouter = require("./routes/auth.routes")
const interviewRouter = require("./routes/interview.routes")
const debugRouter = require("./routes/debug.routes")

app.use("/api/auth", authRouter)

app.use("/api/interview", interviewRouter)

app.use("/api/debug", debugRouter)

module.exports = app
