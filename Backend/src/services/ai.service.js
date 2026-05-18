const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")

console.log("API KEY:", process.env.GOOGLE_GENAI_API_KEY)

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_GENAI_API_KEY
})

const interviewReportSchema = z.object({
  matchScore: z.number().describe("A score between 0 and 1 indicating how well the candidate matches the job requirements."),

  technicalQuestions: z.array(z.object({
    question: z.string().describe("The technical question asked during the interview."),
    intention: z.string().describe("The intention behind asking the technical question, such as assessing problem-solving skills or knowledge of specific technologies."),
    answer: z.string().describe("The candidate's answer to the technical question.")
  })),

  behavioralQuestions: z.array(z.object({
    question: z.string().describe("The behavioral question asked during the interview."),
    intention: z.string().describe("The intention behind asking the behavioral question, such as assessing communication skills or cultural fit."),
    answer: z.string().describe("The candidate's answer to the behavioral question.")
  })),

  skillGaps: z.array(z.object({
    skill: z.string().describe("The skill that the candidate lacks."),
    severity: z.enum(["low", "medium", "high"]).describe("The severity of the skill gap.")
  })),

  preparationPlan: z.array(z.object({
    days: z.number().describe("The number of days the candidate should prepare before the next interview."),
    focus: z.string().describe("The specific areas the candidate should focus on during their preparation."),
    task: z.array(z.string())
  }))
})

async function generateInterviewReport({ resume, selfDescription, jobDescription } = {}) {
  const prompt = `Generate an interview report for a candidate with the following details:\nResume: ${resume}\nSelf Description: ${selfDescription}\nJob Description: ${jobDescription}`

  const maxRetries = 3
  const backoff = (attempt) => 250 * Math.pow(2, attempt)

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      })

      const text = result?.candidates?.[0]?.content?.parts?.[0]?.text

      if (!text) {
        throw new Error("No text received from AI")
      }

      let parsed
      try {
        parsed = JSON.parse(text)
      } catch (e) {
        console.error("Invalid JSON from AI (attempt", attempt + 1, "):", text)
        throw e
      }

      console.log("AI generated interview report:", parsed)
      return parsed
    } catch (err) {
      console.error(`AI generation attempt ${attempt + 1} failed:`, err?.message || err)
      if (attempt < maxRetries - 1) {
        await new Promise((resolve) => setTimeout(resolve, backoff(attempt)))
        continue
      }
      // all retries failed — fall back to a safe default structure so upstream can save a record
      console.error("AI service unavailable after retries; returning fallback report structure.")
      return {
        matchScore: null,
        technicalQuestions: [],
        behavioralQuestions: [],
        skillGaps: [],
        preparationPlan: [],
        _warning: "AI service unavailable"
      }
    }
  }
}

async function generateResumePdf({ resume, jobDescription, selfDescription } = {}) {
  // Simple placeholder PDF generator — returns an empty PDF buffer for now.
  // Replace with a proper PDF generation using pdfkit or a templating library if needed.
  const header = `Resume for generated interview report\n\n`;
  const body = `Job Description:\n${jobDescription || ''}\n\nSelf Description:\n${selfDescription || ''}\n\nResume:\n${resume || ''}`;
  const content = header + body;

  return Buffer.from(content);
}

module.exports = { generateInterviewReport, generateResumePdf };