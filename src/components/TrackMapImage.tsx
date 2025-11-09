import React from 'react'
import { MapPin } from 'lucide-react'

interface TrackMapImageProps {
  src?: string
  alt: string
  className?: string
  overlayClassName?: string
  children?: React.ReactNode
  fit?: 'cover' | 'contain'
  showOverlay?: boolean
}

const TrackMapImage: React.FC<TrackMapImageProps> = ({
  src,
  alt,
  className = '',
  overlayClassName = '',
  children,
  fit = 'cover',
  showOverlay = true
}) => {
  const [hasError, setHasError] = React.useState(false)
  const [isLoaded, setIsLoaded] = React.useState(false)
  const canRenderImage = Boolean(src) && !hasError
  const fitClass = fit === 'contain' ? 'object-contain' : 'object-cover'

  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-f1-dark to-f1-gray ${className}`}
    >
      {canRenderImage ? (
        <img
          src={src}
          alt={alt}
          className={`h-full w-full ${fitClass} transition-all duration-700 ${
            isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-110'
          }`}
          style={fit === 'contain' ? { objectPosition: 'center' } : undefined}
          onLoad={() => setIsLoaded(true)}
          onError={() => setHasError(true)}
          loading="lazy"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <MapPin className="h-12 w-12 text-f1-gold/70" />
        </div>
      )}

      {showOverlay ? (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent pointer-events-none" />
      ) : null}

      {children ? (
        <div className={`absolute inset-0 z-10 ${overlayClassName}`}>{children}</div>
      ) : null}
    </div>
  )
}

export default TrackMapImage

