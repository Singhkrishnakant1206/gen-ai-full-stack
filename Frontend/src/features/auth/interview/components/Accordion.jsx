import React from 'react'

const Accordion = ({ id, icon, title, subtitle, open, onToggle, children }) => {
  return (
    <div className={`ai-accordion ${open ? 'open' : ''}`}>
      <button className="ai-accordion-header" aria-expanded={open} onClick={() => onToggle(id)}>
        <div className="ai-acc-left">
          <span className="ai-acc-icon">{icon}</span>
          <div className="ai-acc-title">
            <div className="title-text">{title}</div>
            {subtitle && <div className="title-sub">{subtitle}</div>}
          </div>
        </div>
        <div className="ai-acc-right">
          <span className="ai-acc-toggle">{open ? '−' : '+'}</span>
        </div>
      </button>

      <div className="ai-accordion-body" style={{ display: open ? 'block' : 'none' }}>
        {children}
      </div>
    </div>
  )
}

export default Accordion
