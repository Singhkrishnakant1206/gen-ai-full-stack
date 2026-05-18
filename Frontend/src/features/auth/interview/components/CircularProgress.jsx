import React from 'react'

const CircularProgress = ({ value = 0, size = 96, stroke = 10 }) => {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (value / 100) * circumference

  return (
    <svg width={size} height={size} className="ai-circular">
      <defs>
        <linearGradient id="g1" x1="0%" x2="100%">
          <stop offset="0%" stopColor="#ff6ea6" />
          <stop offset="100%" stopColor="#da1d7a" />
        </linearGradient>
      </defs>
      <g transform={`translate(${size/2}, ${size/2})`}>
        <circle r={radius} fill="transparent" stroke="rgba(255,255,255,0.04)" strokeWidth={stroke} />
        <circle r={radius} fill="transparent" stroke="url(#g1)" strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference} strokeDashoffset={offset} transform={`rotate(-90)`} />
        <text x="0" y="6" textAnchor="middle" fontSize="18" fill="#fff" fontWeight="700">{`${value}%`}</text>
      </g>
    </svg>
  )
}

export default CircularProgress
