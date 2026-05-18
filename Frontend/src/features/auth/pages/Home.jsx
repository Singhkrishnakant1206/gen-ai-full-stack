import React, { useRef, useState } from 'react'
import "../interview/style/home.scss"
import { useInterview } from '../interview/hooks/useinterview.js'
import { useNavigate } from 'react-router-dom'

const Home = () => {
  const { loading, generateReport } = useInterview()

  const [jobDescription, setJobDescription] = useState("")
  const [selfDescription, setSelfDescription] = useState("")
  const [dragging, setDragging] = useState(false)
  const [fileName, setFileName] = useState("")
  const [resumeFile, setResumeFile] = useState(null)

  const fileInputRef = useRef(null)

  const handleFileChange = (e) => {
    const file = e.target.files[0]

    if (file) {
      setFileName(file.name)
      setResumeFile(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)

    const file = e.dataTransfer.files[0]

    if (file) {
      setFileName(file.name)
      setResumeFile(file)
    }
  }

  const navigate = useNavigate()

  const handleSubmit = async () => {
    if (!resumeFile && !selfDescription.trim()) {
      alert("Please upload a resume or provide a self-description.")
      return
    }

    if (!jobDescription.trim()) {
      alert("Please enter a job description.")
      return
    }

    try {
      const report = await generateReport({
        resumeFile,
        selfDescription,
        jobDescription
      })

      if (report) {
        const id = report._id || report.id || report.interviewId || report.interview_id
        if (id) {
          navigate(`/interview/${id}`)
          return
        }
      }

      alert('Could not generate interview report. Please try again.')
    } catch (err) {
        const resp = err?.response?.data
        if (resp?.errors) {
          // show validation errors and debug doc if present
          const details = JSON.stringify({ message: resp.message, errors: resp.errors, doc: resp.doc }, null, 2)
          alert(`Server validation error:\n${details}`)
        } else {
          const msg = resp?.message || err?.message || 'Failed to generate report.'
          alert(msg)
        }
    }
  }

  return (
    <main className='home-page'>

      {/* loading overlay removed to preserve original interface */}

      {/* Header */}
      <header className="page-header">
        <h1>
          Create Your Custom <em>Interview Report</em>
        </h1>

        <p>
          Let our AI analyze the job requirements and your unique profile
          to build a winning strategy.
        </p>
      </header>

      {/* Job Description Card */}
      <div className="card jd-card">

        <div className="card-header">
          <span className="card-icon red">●</span>

          <span className="card-title">
            Target Job Description
          </span>

          <span className="badge-required">
            Required
          </span>
        </div>

        <p className="field-hint">
          Paste the full job description here — e.g.
          Senior Software Engineer at Google requires
          5+ years…
        </p>

        <textarea
          name="jobDescription"
          id="jobDescription"
          placeholder='Enter Job Description here...'
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
        />

        <span className="char-count">
          {jobDescription.length} / 10,000 chars
        </span>

      </div>

      {/* Main Input Section */}
      <div className="interview-input-group">

        <div className="top-row">

          {/* Resume Upload */}
          <div className="card profile-card">

            <div className="card-header">
              <span className="card-icon">▲</span>

              <span className="card-title">
                Your Profile
              </span>

              <span className="badge-required">
                Required
              </span>
            </div>

            <div
              className={`upload-zone ${dragging ? 'dragging' : ''} ${fileName ? 'has-file' : ''}`}
              onClick={() => fileInputRef.current.click()}
              onDragOver={(e) => {
                e.preventDefault()
                setDragging(true)
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              role="button"
              tabIndex={0}
              onKeyDown={(e) =>
                e.key === 'Enter' && fileInputRef.current.click()
              }
            >

              <span className="upload-icon">⬆</span>

              {fileName ? (
                <>
                  <span className="upload-filename">
                    {fileName}
                  </span>

                  <span className="upload-sub">
                    Click to replace
                  </span>
                </>
              ) : (
                <>
                  <span className="upload-title">
                    Click to upload or drag & drop
                  </span>

                  <span className="upload-sub">
                    Upload your resume here
                  </span>
                </>
              )}

            </div>

            <input
              hidden
              ref={fileInputRef}
              type="file"
              id="resume"
              name="resume"
              accept=".pdf,.docx,.txt"
              onChange={handleFileChange}
            />

          </div>

          {/* OR Divider */}
          <div className="or-divider">
            or
          </div>

          {/* Self Description */}
          <div className="card self-card">

            <div className="card-header">

              <span className="card-title">
                Quick Self-Description
              </span>

            </div>

            <p className="field-hint">
              Briefly describe your experience,
              key skills, and years of experience
              if you don't have a resume handy.
            </p>

            <textarea
              name="selfDescription"
              id="selfDescription"
              placeholder='Describe yourself in a few sentences...'
              value={selfDescription}
              onChange={(e) =>
                setSelfDescription(e.target.value)
              }
            />

          </div>

          {/* Action Button */}
          <div className="actions-col">

            <p className="actions-note">
              Either a <strong>Resume</strong> or a{" "}
              <strong>Self Description</strong> is
              required to generate a personalised plan.
            </p>

            <button
              className='button primary-button'
              onClick={handleSubmit}
              disabled={loading}
            >

              {loading
                ? 'Generating...'
                : '✦ Generate My Interview Strategy'
              }

            </button>

          </div>

        </div>

      </div>

    </main>
  )
}

export default Home