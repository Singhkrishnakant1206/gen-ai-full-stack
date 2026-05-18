const pdfParse = require("pdf-parse")
const { generateInterviewReport, generateResumePdf } = require("../services/ai.service")
const interviewReportModel = require("../models/interviewReport.model")


/**
 * @description Controller to generate interview report based on user self description, resume and job description.
 */
async function generateInterViewReportController(req, res) {
    try {
        const { selfDescription, jobDescription } = req.body

        let resumeContent = { text: '' }
        if (req.file && req.file.buffer) {
            try {
                resumeContent = await pdfParse(req.file.buffer)
            } catch (err) {
                resumeContent = { text: '' }
            }
        } else {
            // If no file uploaded, fall back to selfDescription as resume text
            resumeContent.text = selfDescription || ''
        }

        const interViewReportByAi = await generateInterviewReport({
            resume: resumeContent.text,
            selfDescription,
            jobDescription
        })

        // Helper: normalize various possible AI response shapes and key formats
        function normalizeAiReport(raw = {}) {
            let data = raw

            if (typeof raw === 'string') {
                try { data = JSON.parse(raw) } catch (e) { data = {} }
            }

            // some models might wrap the result
            if (data && (data.interviewReport || data.interview || data.data)) {
                data = data.interviewReport || data.interview || data.data
            }

            // convert snake_case keys to camelCase
            const toCamel = (s = '') => s.replace(/_([a-z])/g, (_, ch) => ch.toUpperCase())

            const normalized = {}
            Object.keys(data || {}).forEach((k) => {
                normalized[toCamel(k)] = data[k]
            })

            // ensure arrays exist for expected fields
            normalized.technicalQuestions = normalized.technicalQuestions || normalized.technicalQuestion || normalized.technical_questions || []
            normalized.behavioralQuestions = normalized.behavioralQuestions || normalized.behavioralQuestion || normalized.behavioral_questions || []
            normalized.skillGaps = normalized.skillGaps || normalized.skillGap || normalized.skill_gaps || []
            normalized.preparationPlan = normalized.preparationPlan || normalized.prepPlan || normalized.preparation_plan || []

            // coerce matchScore to a 0-100 number when possible
            let ms = normalized.matchScore ?? normalized.match_score ?? normalized.match ?? null
            if (typeof ms === 'string') ms = Number(ms.replace(/[^0-9\.]/g, ''))
            if (typeof ms === 'number') {
                if (ms > 0 && ms <= 1) ms = Math.round(ms * 100) // convert 0-1 to percentage
                else ms = Math.round(ms)
            } else {
                ms = null
            }

            normalized.matchScore = ms

            // Heuristic: if AI returned plain text for questions/plans, attempt to split into items
            const textToList = (input) => {
                if (!input) return []
                if (Array.isArray(input)) return input
                if (typeof input === 'string') {
                    const lines = input.split(/\r?\n/).map(l => l.trim()).filter(Boolean)
                    // filter out short non-informative lines
                    return lines.filter(l => l.length > 5)
                }
                return []
            }

            // parse technical questions strings into objects
            if (!Array.isArray(normalized.technicalQuestions) && typeof normalized.technicalQuestions === 'string') {
                normalized.technicalQuestions = textToList(normalized.technicalQuestions).map(q => ({ question: q, intention: '', answer: '' }))
            } else if (Array.isArray(normalized.technicalQuestions)) {
                normalized.technicalQuestions = normalized.technicalQuestions.map(item => {
                    if (typeof item === 'string') return { question: item, intention: '', answer: '' }
                    return item
                })
            }

            if (!Array.isArray(normalized.behavioralQuestions) && typeof normalized.behavioralQuestions === 'string') {
                normalized.behavioralQuestions = textToList(normalized.behavioralQuestions).map(q => ({ question: q, intention: '', answer: '' }))
            } else if (Array.isArray(normalized.behavioralQuestions)) {
                normalized.behavioralQuestions = normalized.behavioralQuestions.map(item => {
                    if (typeof item === 'string') return { question: item, intention: '', answer: '' }
                    return item
                })
            }

            // skill gaps: attempt to extract "Skill - severity" or plain lines
            if (!Array.isArray(normalized.skillGaps) && typeof normalized.skillGaps === 'string') {
                normalized.skillGaps = textToList(normalized.skillGaps).map(line => {
                    const parts = line.split(/[-:]/).map(p => p.trim())
                    return { skill: parts[0] || line, severity: parts[1] || 'medium' }
                })
            } else if (Array.isArray(normalized.skillGaps)) {
                normalized.skillGaps = normalized.skillGaps.map(item => {
                    if (typeof item === 'string') {
                        const parts = item.split(/[-:]/).map(p => p.trim())
                        return { skill: parts[0] || item, severity: parts[1] || 'medium' }
                    }
                    return item
                })
            }

            // preparation plan: parse numbered or bulleted lines into { day, focus, tasks }
            if (!Array.isArray(normalized.preparationPlan) && typeof normalized.preparationPlan === 'string') {
                const items = textToList(normalized.preparationPlan)
                normalized.preparationPlan = items.map((line, idx) => ({ day: idx + 1, focus: line, tasks: [] }))
            } else if (Array.isArray(normalized.preparationPlan)) {
                normalized.preparationPlan = normalized.preparationPlan.map((item, idx) => {
                    if (typeof item === 'string') return { day: idx + 1, focus: item, tasks: [] }
                    if (item.day == null) item.day = idx + 1
                    if (!Array.isArray(item.tasks)) item.tasks = []
                    return item
                })
            }

            return normalized
        }

        const ai = normalizeAiReport(interViewReportByAi)

        // Additional heuristics: handle structured AI outputs that use different keys
        // e.g., aiRaw may include `strengths`, `areasForFurtherExploration`, `recommendation`
        if (interViewReportByAi && typeof interViewReportByAi === 'object') {
            const raw = interViewReportByAi

            // derive technical questions from strengths if none present
            if ((ai.technicalQuestions || []).length === 0 && Array.isArray(raw.strengths) && raw.strengths.length > 0) {
                ai.technicalQuestions = raw.strengths.map(s => ({ question: `Describe your experience with ${s.area}`, intention: s.details || '', answer: '' }))
            }

            // derive behavioral questions from strengths/overallImpression
            if ((ai.behavioralQuestions || []).length === 0) {
                const b = []
                if (raw.overallImpression) b.push({ question: `How would you describe your strengths and areas for growth?`, intention: raw.overallImpression, answer: '' })
                if (Array.isArray(raw.strengths)) {
                    raw.strengths.slice(0,3).forEach(s => b.push({ question: `Tell me about a time you demonstrated ${s.area}`, intention: s.details || '', answer: '' }))
                }
                if (b.length) ai.behavioralQuestions = b
            }

            // derive skill gaps from areasForFurtherExploration
            if ((ai.skillGaps || []).length === 0 && Array.isArray(raw.areasForFurtherExploration) && raw.areasForFurtherExploration.length > 0) {
                ai.skillGaps = raw.areasForFurtherExploration.map(a => ({ skill: a.area || a.skill || a, severity: 'medium' }))
            }

            // derive a simple preparation plan from areasForFurtherExploration
            if ((ai.preparationPlan || []).length === 0 && Array.isArray(raw.areasForFurtherExploration) && raw.areasForFurtherExploration.length > 0) {
                ai.preparationPlan = raw.areasForFurtherExploration.map((a, idx) => ({ day: idx + 1, focus: a.area || a, tasks: [] }))
            }

            // derive matchScore from recommendation.status if missing
            if ((ai.matchScore == null || ai.matchScore === 0) && raw.recommendation && raw.recommendation.status) {
                const st = String(raw.recommendation.status).toLowerCase()
                if (st.includes('strong')) ai.matchScore = 85
                else if (st.includes('recommend')) ai.matchScore = 70
                else if (st.includes('consider')) ai.matchScore = 55
                else ai.matchScore = 35
            }
        }

        // Normalize AI response and fill required fields with safe defaults
        const title = (jobDescription || '').split('\n')[0]?.replace(/Job Title:\s*/i, '').trim() || 'Untitled Role'

        const doc = {
            user: req.user?.id,
            resume: resumeContent.text,
            selfDescription,
            jobDescription,
            title,
            aiRaw: interViewReportByAi,
            matchScore: ai.matchScore ?? null,
            technicalQuestions: Array.isArray(ai.technicalQuestions) ? ai.technicalQuestions : [],
            behavioralQuestions: Array.isArray(ai.behavioralQuestions) ? ai.behavioralQuestions : [],
            skillGaps: Array.isArray(ai.skillGaps) ? ai.skillGaps : [],
            preparationPlan: Array.isArray(ai.preparationPlan) ? ai.preparationPlan : []
        }

        const interviewReport = await interviewReportModel.create(doc)

        return res.status(201).json({
            message: "Interview report generated successfully.",
            interviewReport
        })
    } catch (err) {
        console.error('Error generating interview report:', err)
        const message = err?.message || 'Internal server error while generating interview report.'
        return res.status(500).json({ message })
    }
}


/**
 * @description Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    const { interviewId } = req.params

    const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    res.status(200).json({
        message: "Interview report fetched successfully.",
        interviewReport
    })
}


/**
 * @description Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {
    const interviewReports = await interviewReportModel
        .find({ user: req.user.id })
        .sort({ createdAt: -1 })
        .select("-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan")

    res.status(200).json({
        message: "Interview reports fetched successfully.",
        interviewReports
    })
}


/**
 * @description Controller to generate resume PDF based on user self description, resume and job description.
 */
async function generateResumePdfController(req, res) {
    const { interviewReportId } = req.params

    const interviewReport = await interviewReportModel.findById(interviewReportId)

    if (!interviewReport) {
        return res.status(404).json({
            message: "Interview report not found."
        })
    }

    const { resume, jobDescription, selfDescription } = interviewReport

    const pdfBuffer = await generateResumePdf({ resume, jobDescription, selfDescription })

    res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename=resume_${interviewReportId}.pdf`
    })

    res.send(pdfBuffer)
}


module.exports = {
    generateInterViewReportController,
    getInterviewReportByIdController,
    getAllInterviewReportsController,
    generateResumePdfController
}



