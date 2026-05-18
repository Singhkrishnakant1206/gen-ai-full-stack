import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useInterview } from '../interview/hooks/useinterview.js'
import '../interview/style/interview.scss'
import CircularProgress from '../interview/components/CircularProgress'
import Skeleton from '../interview/components/Skeleton'

function Interview() {
  const { interviewId } = useParams()
  const { report } = useInterview()
  const [data, setData] = useState(report || null)
  const [loading, setLoading] = useState(!report)
  const [error, setError] = useState(null)
  const [expandedSections, setExpandedSections] = useState({ match: true, technical: true })

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        if (interviewId === 'xyz' || interviewId === 'demo') {
          const sample = {
            createdAt: new Date().toISOString(),
            selfDescription: 'Jane Doe\nFull-stack developer with 5 years experience',
            jobDescription: 'Job Title: Senior Software Engineer\nCompany: Example Co.\nRequirements: React, Node.js, Algorithms',
            technicalQuestion: [
              { question: 'Explain event loop in Node.js', difficulty: 'Medium', topic: 'Node.js', tip: 'Mention the call stack and libuv' },
              { question: 'Implement debounce in JS', difficulty: 'Easy', topic: 'JavaScript' }
            ],
            behavioralQuestion: [
              { question: 'Tell me about a time you faced a tough bug', framework: 'STAR', tip: 'Structure with Situation, Task, Action, Result' }
            ],
            skillGap: [{ skill: 'redis' }, { skill: 'Message queue' }, { skill: 'Event loop' }],
            preparationPlan: [{ week: 1, focus: 'Data Structures', tasks: ['Arrays & Strings', 'Linked Lists'] }],
            matchScore: 78
          }
          setData(sample)
          return
        }

        const res = await fetch(`http://localhost:3000/api/interview/${interviewId}`, { credentials: 'include' })
        if (!res.ok) {
          setError(`Server responded ${res.status} ${res.statusText}`)
          setData(null)
          return
        }

        const json = await res.json()
        const reportObj = json.interviewReport || json
        const normalized = {
          ...reportObj,
          technicalQuestion: reportObj.technicalQuestion || reportObj.technicalQuestions || [],
          behavioralQuestion: reportObj.behavioralQuestion || reportObj.behavioralQuestions || [],
          skillGap: reportObj.skillGap || reportObj.skillGaps || [],
          preparationPlan: reportObj.preparationPlan || reportObj.prepPlan || reportObj.preparationPlan || []
        }

        setData(normalized)
      } catch (err) {
        console.error(err)
        setError(err.message || String(err))
      } finally {
        setLoading(false)
      }
    }

    if (interviewId && (!report || report._id !== interviewId)) fetchInterview()
  }, [interviewId])

  useEffect(() => {
    if (report) {
      const normalized = {
        ...report,
        technicalQuestion: report.technicalQuestion || report.technicalQuestions || [],
        behavioralQuestion: report.behavioralQuestion || report.behavioralQuestions || [],
        skillGap: report.skillGap || report.skillGaps || [],
        preparationPlan: report.preparationPlan || report.prepPlan || report.preparationPlan || []
      }
      setData(normalized)
      setLoading(false)
    }
  }, [report])

  const toggleSection = (sectionId) => {
    setExpandedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const createdDate = data?.createdAt?.$date
    ? new Date(data.createdAt.$date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : data?.createdAt
      ? new Date(data.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
      : '—'

  const candidateName = data?.selfDescription?.split('\n')[0] || 'Candidate'
  const jobTitle = data?.jobDescription?.split('\n')[0]?.replace('Job Title:', '').trim() || 'Role'
  const matchScore = data?.matchScore ? Math.max(0, Math.min(100, Number(data.matchScore))) : 0

  // If preparation plan is missing or short, generate a helpful 7-day plan
  const generateDefault7DayPlan = () => {
    return [
      { day: 1, focus: 'Resume & Fundamentals', tasks: ['Polish resume', 'Review JS basics', 'Brush up on HTML/CSS'] },
      { day: 2, focus: 'Data Structures', tasks: ['Arrays & Strings', 'Hash maps', 'Two pointers'] },
      { day: 3, focus: 'Algorithms', tasks: ['Sorting', 'Searching', 'Recursion basics'] },
      { day: 4, focus: 'System Design Basics', tasks: ['Read common design patterns', 'CAP theorem', 'Design a simple service'] },
      { day: 5, focus: 'Backend & APIs', tasks: ['Node.js event loop', 'REST vs GraphQL', 'Database modeling'] },
      { day: 6, focus: 'Frontend & Frameworks', tasks: ['React hooks & lifecycle', 'State management', 'Accessibility'] },
      { day: 7, focus: 'Mock Interviews', tasks: ['Practice live coding', 'Answer behavioral questions using STAR', 'Review past mistakes'] }
    ]
  }

  const planToShow = (data.preparationPlan && data.preparationPlan.length >= 7) ? data.preparationPlan : generateDefault7DayPlan()

  // Provide concise suggested answers for common technical questions when an explicit answer is not present
  const getSuggestedAnswer = (q) => {
    const text = typeof q === 'string' ? q : q?.question || q?.prompt || ''
    const t = text.toLowerCase()

    if (t.includes('event loop')) {
      return `The Node.js event loop is a mechanism that handles asynchronous callbacks. It uses a call stack, an event queue, and libuv to offload I/O. Tasks are executed from the queue when the stack is empty; timers, I/O callbacks, and nextTick/Promise microtasks have different phases and priorities.`
    }

    if (t.includes('debounce')) {
      return `Debounce delays invoking a function until a specified wait time has elapsed since the last call. Example in JS:\nfunction debounce(fn, wait) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); } }`
    }

    if (t.includes('binary search')) {
      return `Binary search repeatedly halves a sorted array to find a target in O(log n) time: compare middle element, discard half, repeat until found or range empty.`
    }

    if (t.includes('promise') || t.includes('async')) {
      return `Promises represent future values. Use .then/.catch or async/await to compose async code. Handle errors with try/catch in async functions and avoid unhandled rejections.`
    }

    // Generic suggested answer structure
    return `Suggested approach: 1) Restate the problem, 2) Explain complexity and constraints, 3) Describe algorithm or architecture, 4) Provide short code sketch or example, 5) Mention optimizations and edge-cases.`
  }

  if (loading) return (
    <main className="interview-page">
      <header className="page-header">
        <h1>Loading your <em>Interview Report</em></h1>
        <p>Please wait...</p>
      </header>
      <div className="skeleton-grid" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <Skeleton height={100} />
        <Skeleton height={200} />
        <Skeleton height={200} />
      </div>
    </main>
  )

  if (error) return (
    <main className="interview-page">
      <header className="page-header">
        <h1>Error</h1>
        <p>{error}</p>
      </header>
    </main>
  )

  if (!data) return (
    <main className="interview-page">
      <header className="page-header">
        <h1>No Report Found</h1>
        <p>Interview report not found for ID: {interviewId}</p>
      </header>
    </main>
  )

  return (
    <main className="interview-page">
      {/* Header */}
      <header className="page-header">
        <h1>Your <em>Interview Strategy</em></h1>
        <p>Personalized insights for {jobTitle} at {candidateName}</p>
        <p className="header-date">Generated on {createdDate}</p>
      </header>

      <div className="interview-container">
        {/* Match Score Card */}
        <div className="section-card match-card">
          <div className="section-header" onClick={() => toggleSection('match')}>
            <div className="section-title-group">
              <span className="section-icon">🎯</span>
              <h2>Match Score</h2>
            </div>
            <span className="toggle-icon">{expandedSections.match ? '−' : '+'}</span>
          </div>

          {expandedSections.match && (
            <div className="section-body">
              <div className="match-display">
                <CircularProgress value={matchScore} />
                <div className="match-text">
                  <p className="match-percentage">{matchScore}%</p>
                  <p className="match-description">Your profile alignment with the job description</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Technical Questions Card */}
        <div className="section-card">
          <div className="section-header" onClick={() => toggleSection('technical')}>
            <div className="section-title-group">
              <span className="section-icon">🧠</span>
              <h2>Technical Questions</h2>
              <span className="count-badge">{data.technicalQuestion?.length || 0}</span>
            </div>
            <span className="toggle-icon">{expandedSections.technical ? '−' : '+'}</span>
          </div>

          {expandedSections.technical && (
            <div className="section-body">
              {data.technicalQuestion?.length > 0 ? (
                <div className="questions-list">
                  {data.technicalQuestion.map((q, i) => {
                    const text = typeof q === 'string' ? q : q?.question || q?.prompt || ''
                    const difficulty = typeof q === 'string' ? null : q?.difficulty
                    const topic = typeof q === 'string' ? null : q?.topic
                    const tip = typeof q === 'string' ? null : q?.tip

                    const answer = q?.answer || q?.solution || getSuggestedAnswer(q)

                    return (
                      <div className="question-item" key={i}>
                        <div className="q-header">
                          <span className="q-num">Q{i + 1}</span>
                          <div className="q-badges">
                            {difficulty && <span className={`badge diff-${difficulty.toLowerCase()}`}>{difficulty}</span>}
                            {topic && <span className="badge topic">{topic}</span>}
                          </div>
                        </div>
                        <p className="q-text">{text}</p>
                        {tip && <div className="tip"><span>💡</span> {tip}</div>}
                        {answer && (
                          <div className="q-answer">
                            <strong>Answer:</strong>
                            <pre>{answer}</pre>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="empty-state">No technical questions generated yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Behavioral Questions Card */}
        <div className="section-card">
          <div className="section-header" onClick={() => toggleSection('behavioral')}>
            <div className="section-title-group">
              <span className="section-icon">🗣️</span>
              <h2>Behavioral Questions</h2>
              <span className="count-badge">{data.behavioralQuestion?.length || 0}</span>
            </div>
            <span className="toggle-icon">{expandedSections.behavioral ? '−' : '+'}</span>
          </div>

          {expandedSections.behavioral && (
            <div className="section-body">
              {data.behavioralQuestion?.length > 0 ? (
                <div className="questions-list">
                  {data.behavioralQuestion.map((q, i) => {
                    const text = typeof q === 'string' ? q : q?.question || q?.prompt || ''
                    const framework = typeof q === 'string' ? null : q?.framework
                    const tip = typeof q === 'string' ? null : q?.tip

                    return (
                      <div className="question-item" key={i}>
                        <div className="q-header">
                          <span className="q-num">Q{i + 1}</span>
                          {framework && <span className="badge framework">{framework}</span>}
                        </div>
                        <p className="q-text">{text}</p>
                        {tip && <div className="tip"><span>💡</span> {tip}</div>}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="empty-state">No behavioral questions generated yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Skill Gaps Card */}
        <div className="section-card">
          <div className="section-header" onClick={() => toggleSection('skillGap')}>
            <div className="section-title-group">
              <span className="section-icon">⚠️</span>
              <h2>Skill Gaps</h2>
              <span className="count-badge">{data.skillGap?.length || 0}</span>
            </div>
            <span className="toggle-icon">{expandedSections.skillGap ? '−' : '+'}</span>
          </div>

          {expandedSections.skillGap && (
            <div className="section-body">
              {data.skillGap?.length > 0 ? (
                <div className="skills-grid">
                  {data.skillGap.map((s, idx) => (
                    <div key={idx} className="skill-tag">
                      {typeof s === 'string' ? s : s.skill || s.name || 'Skill'}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No skill gaps identified.</p>
              )}
            </div>
          )}
        </div>

        {/* Preparation Plan Card */}
        <div className="section-card">
          <div className="section-header" onClick={() => toggleSection('plan')}>
            <div className="section-title-group">
              <span className="section-icon">📅</span>
              <h2>Interview Roadmap</h2>
              <span className="count-badge">{planToShow?.length || 0}</span>
            </div>
            <span className="toggle-icon">{expandedSections.plan ? '−' : '+'}</span>
          </div>

          {expandedSections.plan && (
            <div className="section-body">
              {planToShow?.length > 0 ? (
                <div className="plan-items">
                  {planToShow.map((w, i) => (
                    <div className="plan-item" key={i}>
                      <div className="plan-label">Day {w.day || w.week || i + 1}</div>
                      <p className="plan-focus">{w.focus}</p>
                      {w.tasks && (
                        <ul className="plan-tasks">
                          {w.tasks.map((task, j) => (
                            <li key={j}>{task}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="empty-state">No roadmap available yet.</p>
              )}
            </div>
          )}
        </div>

        {/* Job Description Card */}
        <div className="section-card">
          <div className="section-header" onClick={() => toggleSection('jd')}>
            <div className="section-title-group">
              <span className="section-icon">📋</span>
              <h2>Job Description</h2>
            </div>
            <span className="toggle-icon">{expandedSections.jd ? '−' : '+'}</span>
          </div>

          {expandedSections.jd && (
            <div className="section-body">
              <pre className="jd-text">{data.jobDescription}</pre>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

export default Interview
