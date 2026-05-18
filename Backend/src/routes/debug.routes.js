const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewReportModel = require("../models/interviewReport.model")

const router = express.Router()

// Returns the most recent interview report for the logged-in user (full document)
router.get("/last-report", authMiddleware.authUser, async (req, res) => {
  try {
    const report = await interviewReportModel.findOne({ user: req.user.id }).sort({ createdAt: -1 })
    if (!report) return res.status(404).json({ message: "No interview reports found for user." })
    return res.status(200).json({ message: "OK", report })
  } catch (err) {
    console.error("Error fetching last report:", err)
    return res.status(500).json({ message: "Internal error" })
  }
})

// TEMPORARY: public endpoint for local debugging — returns last saved report (no auth)
// WARNING: this is unauthenticated and should only be used in local development.
router.get("/public-last-report", async (req, res) => {
  try {
    // include aiRaw even if schema has select:false
    const report = await interviewReportModel.findOne({}).sort({ createdAt: -1 }).select('+aiRaw')
    if (!report) return res.status(404).json({ message: "No interview reports found." })
    // return only key fields plus raw AI output to avoid large payloads
    const out = {
      id: report._id,
      createdAt: report.createdAt,
      title: report.title,
      matchScore: report.matchScore,
      technicalQuestions: report.technicalQuestions,
      behavioralQuestions: report.behavioralQuestions,
      skillGaps: report.skillGaps,
      preparationPlan: report.preparationPlan,
      aiRaw: report.aiRaw || null
    }
    return res.status(200).json({ message: "OK", report: out })
  } catch (err) {
    console.error("Error fetching public last report:", err)
    return res.status(500).json({ message: "Internal error" })
  }
})

// TEMP: reprocess the last saved report using its aiRaw and populate derived fields
router.post("/reprocess-last-report", async (req, res) => {
  try {
    const report = await interviewReportModel.findOne({}).sort({ createdAt: -1 }).select('+aiRaw')
    if (!report) return res.status(404).json({ message: "No interview reports found." })

    const raw = report.aiRaw || {}

    // Build derived fields
    const derived = {}

    // matchScore from recommendation
    if (raw.recommendation && raw.recommendation.status) {
      const st = String(raw.recommendation.status).toLowerCase()
      if (st.includes('strong')) derived.matchScore = 85
      else if (st.includes('recommend')) derived.matchScore = 70
      else if (st.includes('consider')) derived.matchScore = 55
      else derived.matchScore = 35
    }

    // technical questions from strengths
    if (Array.isArray(raw.strengths) && raw.strengths.length > 0) {
      derived.technicalQuestions = raw.strengths.map(s => ({ question: `Describe your experience with ${s.area}`, intention: s.details || '', answer: '' }))
    }

    // behavioral questions
    const b = []
    if (raw.overallImpression) b.push({ question: `How would you describe your strengths and areas for growth?`, intention: raw.overallImpression, answer: '' })
    if (Array.isArray(raw.strengths)) raw.strengths.slice(0,3).forEach(s => b.push({ question: `Tell me about a time you demonstrated ${s.area}`, intention: s.details || '', answer: '' }))
    if (b.length) derived.behavioralQuestions = b

    // skill gaps
    if (Array.isArray(raw.areasForFurtherExploration) && raw.areasForFurtherExploration.length > 0) {
      derived.skillGaps = raw.areasForFurtherExploration.map(a => ({ skill: a.area || a, severity: 'medium' }))
      derived.preparationPlan = raw.areasForFurtherExploration.map((a, idx) => ({ day: idx + 1, focus: a.area || a, tasks: [] }))
    }

    // Apply derived values to report using update (avoid validation failures on save)
    const updateFields = {}
    if (derived.matchScore != null) updateFields.matchScore = derived.matchScore
    if (derived.technicalQuestions) updateFields.technicalQuestions = derived.technicalQuestions
    if (derived.behavioralQuestions) updateFields.behavioralQuestions = derived.behavioralQuestions
    if (derived.skillGaps) updateFields.skillGaps = derived.skillGaps
    if (derived.preparationPlan) updateFields.preparationPlan = derived.preparationPlan

    const updated = await interviewReportModel.findByIdAndUpdate(report._id, { $set: updateFields }, { new: true }).select('+aiRaw')
    return res.status(200).json({ message: 'Reprocessed', report: updated })
  } catch (err) {
    console.error('Error reprocessing last report:', err)
    return res.status(500).json({ message: 'Internal error' })
  }
})

module.exports = router

