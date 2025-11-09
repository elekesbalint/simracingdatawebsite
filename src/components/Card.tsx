import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  style?: React.CSSProperties
}

const Card: React.FC<CardProps> = ({ children, className = '', onClick, style }) => {
  return (
    <div 
      className={`card ${onClick ? 'cursor-pointer hover:scale-105' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  )
}

export default Card
