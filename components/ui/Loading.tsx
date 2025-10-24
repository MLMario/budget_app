/**
 * Loading Component
 *
 * Reusable loading spinner for async operations
 */

import React from 'react'
import { cn } from '@/lib/utils/cn'

export interface LoadingProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse'
  text?: string
  fullScreen?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16',
}

/**
 * Spinner variant
 */
function Spinner({ size = 'md', className }: Pick<LoadingProps, 'size' | 'className'>) {
  return (
    <svg
      className={cn('animate-spin text-blue-600', sizeClasses[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  )
}

/**
 * Dots variant
 */
function Dots({ size = 'md', className }: Pick<LoadingProps, 'size' | 'className'>) {
  const dotSize = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2.5 h-2.5',
    lg: 'w-3.5 h-3.5',
    xl: 'w-4 h-4',
  }[size]

  return (
    <div className={cn('flex gap-1.5', className)}>
      <div
        className={cn(
          'rounded-full bg-blue-600 animate-bounce',
          dotSize
        )}
        style={{ animationDelay: '0ms' }}
      ></div>
      <div
        className={cn(
          'rounded-full bg-blue-600 animate-bounce',
          dotSize
        )}
        style={{ animationDelay: '150ms' }}
      ></div>
      <div
        className={cn(
          'rounded-full bg-blue-600 animate-bounce',
          dotSize
        )}
        style={{ animationDelay: '300ms' }}
      ></div>
    </div>
  )
}

/**
 * Pulse variant
 */
function Pulse({ size = 'md', className }: Pick<LoadingProps, 'size' | 'className'>) {
  return (
    <div
      className={cn(
        'rounded-full bg-blue-600 animate-pulse',
        sizeClasses[size],
        className
      )}
    ></div>
  )
}

/**
 * Main Loading component
 */
export function Loading({
  size = 'md',
  variant = 'spinner',
  text,
  fullScreen = false,
  className,
}: LoadingProps) {
  const LoadingVariant = {
    spinner: Spinner,
    dots: Dots,
    pulse: Pulse,
  }[variant]

  const content = (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3',
        fullScreen ? 'min-h-screen' : '',
        className
      )}
    >
      <LoadingVariant size={size} />
      {text && (
        <p className="text-sm text-gray-600 animate-pulse">{text}</p>
      )}
    </div>
  )

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-white bg-opacity-80 backdrop-blur-sm">
        {content}
      </div>
    )
  }

  return content
}

/**
 * Loading skeleton for content placeholders
 */
export interface SkeletonProps {
  width?: string | number
  height?: string | number
  className?: string
  circle?: boolean
}

export function Skeleton({ width, height, className, circle = false }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-gray-200',
        circle ? 'rounded-full' : 'rounded',
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    ></div>
  )
}

/**
 * Card skeleton for loading states
 */
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
      <Skeleton height={24} width="60%" />
      <Skeleton height={16} width="40%" />
      <div className="space-y-2">
        <Skeleton height={12} width="100%" />
        <Skeleton height={12} width="80%" />
        <Skeleton height={12} width="90%" />
      </div>
    </div>
  )
}

/**
 * Table skeleton for loading states
 */
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      <Skeleton height={40} width="100%" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height={56} width="100%" />
      ))}
    </div>
  )
}
