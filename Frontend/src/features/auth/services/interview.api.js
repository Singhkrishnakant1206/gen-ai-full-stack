import axios from "axios";

const api = axios.create({
    baseURL: "https://gen-ai-full-stack-backend.onrender.com",
    withCredentials: true,
})


/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile
}) => {

    const formData = new FormData()

    formData.append(
        "jobDescription",
        jobDescription
    )

    formData.append(
        "selfDescription",
        selfDescription
    )

    if (resumeFile) {
        formData.append(
            "resume",
            resumeFile
        )
    }

    try {

        const response =
            await api.post(
                "/api/interview/",
                formData
            )

        return response.data

    } catch (err) {

        if (err?.response) {

            console.error(
                "Server error response:",
                err.response.status,
                err.response.data
            )

        } else {

            console.error(
                "API error:",
                err
            )

        }

        throw err
    }

}


/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById =
async (interviewId) => {

    try {

        const response =
            await api.get(
                `/api/interview/${interviewId}`
            )

        return response.data

    } catch (err) {

        console.log(err)

        throw err
    }

}


/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports =
async () => {

    try {

        const response =
            await api.get(
                "/api/interview/"
            )

        return response.data

    } catch (err) {

        console.log(err)

        return {
            interviewReports:[]
        }
    }

}


/**
 * @description Service to generate resume pdf.
 */
export const generateResumePdf =
async ({ interviewReportId }) => {

    const response =
        await api.post(
            `/api/interview/resume/pdf/${interviewReportId}`,
            null,
            {
                responseType:"blob"
            }
        )

    return response.data
}