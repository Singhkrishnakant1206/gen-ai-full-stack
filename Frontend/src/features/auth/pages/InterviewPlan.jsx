import React, { useState, useMemo } from 'react'
import "../interview/style/interview-plan.scss"

function InterviewPlan() {
  // Mock data for stages - will be replaced with state/API layer
  const [stages] = useState([
    {
      id: 1,
      title: "Job Description",
      description: "Enter the job description",
      icon: "📋",
      isActive: false,
      isCompleted: false
    },
    {
      id: 2,
      title: "Your Profile",
      description: "Share your resume and skills",
      icon: "👤",
      isActive: false,
      isCompleted: false
    },
    {
      id: 3,
      title: "Interview Focus",
      description: "Choose interview topics",
      icon: "🎯",
      isActive: false,
      isCompleted: false
    },
    {
      id: 4,
      title: "Difficulty Level",
      description: "Select difficulty level",
      icon: "⚡",
      isActive: false,
      isCompleted: false
    },
    {
      id: 5,
      title: "Generate Plan",
      description: "Create your custom plan",
      icon: "✨",
      isActive: true,
      isCompleted: false
    }
  ])

  const completedCount = useMemo(() => stages.filter(s => s.isCompleted).length, [stages])
  const total = stages.length
  const progressPercent = Math.round((completedCount / Math.max(1, total)) * 100)

  return (
    <main className="interview-plan">
      <aside className="plan-sidebar">
        <h1 className="plan-title">Create Your Custom Interview Plan</h1>
        <p className="plan-subtitle">Follow these steps to generate a personalized interview preparation plan</p>
        <div className="progress-indicator" aria-hidden={false}>
          <div className="progress-bar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent} role="progressbar">
            <div className="progress-fill" style={{ width: `${progressPercent}%` }}></div>
          </div>
          <span className="progress-text">{completedCount} of {total}</span>
        </div>
      </aside>

      <section className="stages-container">
        <div className="stages-wrapper">
          {stages.map((stage, index) => (
            <div 
              key={stage.id} 
              className={`stage-card ${stage.isActive ? 'active' : ''} ${stage.isCompleted ? 'completed' : ''}`}
              role="group"
              aria-label={`${stage.title} - ${stage.description}`}
              tabIndex={0}
            >
              <div className="stage-header">
                <div className="stage-icon">{stage.icon}</div>
                <div className="stage-number">Step {index + 1}</div>
              </div>
              
              <h3 className="stage-title">{stage.title}</h3>
              <p className="stage-description">{stage.description}</p>
              
              <div className="stage-footer">
                {stage.isCompleted && <span className="badge completed">✓ Completed</span>}
                {stage.isActive && <span className="badge active">In Progress</span>}
                {!stage.isCompleted && !stage.isActive && <span className="badge pending">Pending</span>}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}

export default InterviewPlan
