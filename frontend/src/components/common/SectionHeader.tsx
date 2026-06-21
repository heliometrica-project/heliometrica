import './SectionHeader.css'

interface SectionHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

import React from 'react'

export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <div className="section-header">
      <div className="section-header__text">
        <h2 className="section-header__title">{title}</h2>
        {subtitle && <p className="section-header__subtitle">{subtitle}</p>}
      </div>
      {action && <div className="section-header__action">{action}</div>}
    </div>
  )
}
