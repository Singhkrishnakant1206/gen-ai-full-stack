const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const upload = require("../middlewares/file.middleware")
const {
  generateInterViewReportController,
  getInterviewReportByIdController,
  getAllInterviewReportsController
} = require("../controllers/interview.controller")

const interviewRouter = express.Router()

// Generate interview report
interviewRouter.post(
  "/",
  authMiddleware.authUser,
  upload.single("resume"),
  generateInterViewReportController
)

// Get all interview reports
interviewRouter.get(
  "/",
  authMiddleware.authUser,
  getAllInterviewReportsController
)

// Get interview report by ID
interviewRouter.get(
  "/:interviewId",
  authMiddleware.authUser,
  getInterviewReportByIdController
)

module.exports = interviewRouter