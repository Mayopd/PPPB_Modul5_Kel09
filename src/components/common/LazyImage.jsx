import { useState } from 'react'

/**
 * LazyImage — An enhanced lazy-loaded image component with skeleton placeholder
 * and graceful fallback.
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  width,
  height,
  fallback = '/guns/pistol.svg',
  ...props
}) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)

  const imgSrc = error || !src ? fallback : src

  return (
    <div
      className={`lazy-img-wrapper ${loaded ? 'lazy-img--loaded' : 'lazy-img--loading'}`}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {!loaded && !error && (
        <div
          className="lazy-img-skeleton"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, var(--card, #1c1c1c) 25%, var(--line, #2a2a2a) 50%, var(--card, #1c1c1c) 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
        />
      )}
      <img
        src={imgSrc}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => {
          setError(true)
          setLoaded(true)
        }}
        className={className}
        style={{
          transition: 'opacity 0.3s ease-in-out',
          opacity: loaded ? 1 : 0,
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'contain',
        }}
        {...props}
      />
    </div>
  )
}
