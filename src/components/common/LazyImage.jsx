// src/components/common/LazyImage.jsx
import React, { useState, useEffect, useRef } from 'react';

export default function LazyImage({
  src,
  alt,
  className = '',
  fallbackSrc = '/guns/rifle.svg',
  ...props
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px', threshold: 0.01 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div ref={imgRef} className={`relative overflow-hidden bg-slate-800 ${className}`}>
      {/* Skeleton / Shimmer saat gambar belum selesai dimuat */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse flex items-center justify-center">
          <span className="text-xs text-slate-400">Memuat...</span>
        </div>
      )}

      {/* Render tag img hanya ketika sudah masuk viewport */}
      {isInView && (
        <img
          src={hasError ? fallbackSrc : src}
          alt={alt}
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
          onError={() => {
            setHasError(true);
            setIsLoaded(true);
          }}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          {...props}
        />
      )}
    </div>
  );
}
