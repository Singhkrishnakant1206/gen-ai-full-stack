import { createContext, useState, useContext } from "react"

export const InterviewContext = createContext({
    loading: false,
    setLoading: () => {},
    report: null,
    setReport: () => {},
    reports: [],
    setReports: () => {},
})

export const InterviewProvider = ({ children }) => {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState(null)
    const [reports, setReports] = useState([])

    return (
        <InterviewContext.Provider value={{ loading, setLoading, report, setReport, reports, setReports }}>
            {children}
        </InterviewContext.Provider>
    )
}

export const useInterview = () => {
    const context = useContext(InterviewContext)
    if (!context) throw new Error("useInterview must be used within InterviewProvider")
    return context
}