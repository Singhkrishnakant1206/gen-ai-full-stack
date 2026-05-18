import React from 'react'

const Skeleton = ({ height = 16, width = '100%', radius = 6 }) => (
  <div className="ai-skeleton" style={{ height, width, borderRadius: radius }} />
)

export default Skeleton
