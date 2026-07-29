'use client'

import React, { useState, useRef, useCallback } from 'react'
import { RefreshCw } from 'lucide-react'

interface PullToRefreshProps {
  children: React.ReactNode
  onRefresh: () => Promise<void> | void
  pullThreshold?: number
  maxPullDistance?: number
}

export function PullToRefresh({
  children,
  onRefresh,
  pullThreshold = 70,
  maxPullDistance = 110,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isTouching, setIsTouching] = useState(false)
  const touchStartY = useRef<number | null>(null)
  const isPulling = useRef(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only activate pull-to-refresh if scroll position is at the very top
    const scrollTop = window.scrollY || document.documentElement.scrollTop || 0
    if (scrollTop <= 0 && e.touches.length === 1) {
      touchStartY.current = e.touches[0].clientY
      isPulling.current = true
      setIsTouching(true)
    } else {
      touchStartY.current = null
      isPulling.current = false
      setIsTouching(false)
    }
  }, [])

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isPulling.current || touchStartY.current === null || isRefreshing) return

      const currentY = e.touches[0].clientY
      const deltaY = currentY - touchStartY.current
      const scrollTop = window.scrollY || document.documentElement.scrollTop || 0

      // Only pull if pulling downwards and scrollTop is 0
      if (deltaY > 0 && scrollTop <= 0) {
        // Apply resistance damping calculation
        const distance = Math.min(deltaY * 0.45, maxPullDistance)
        setPullDistance(distance)
      } else {
        setPullDistance(0)
      }
    },
    [isRefreshing, maxPullDistance]
  )

  const handleTouchEnd = useCallback(async () => {
    setIsTouching(false)
    if (!isPulling.current) return
    isPulling.current = false
    touchStartY.current = null

    if (pullDistance >= pullThreshold && !isRefreshing) {
      setIsRefreshing(true)
      setPullDistance(56) // Lock position for loading indicator

      try {
        await onRefresh()
      } catch (err) {
        console.error('Error during refresh:', err)
      } finally {
        setIsRefreshing(false)
        setPullDistance(0)
      }
    } else {
      // Spring back to 0 if threshold not met
      setPullDistance(0)
    }
  }, [pullDistance, pullThreshold, isRefreshing, onRefresh])

  const handleTouchCancel = useCallback(() => {
    setIsTouching(false)
    isPulling.current = false
    touchStartY.current = null
    if (!isRefreshing) {
      setPullDistance(0)
    }
  }, [isRefreshing])

  const progress = Math.min(pullDistance / pullThreshold, 1)

  return (
    <div
      ref={containerRef}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      className="relative overscroll-y-contain min-h-full"
      style={{ overscrollBehaviorY: 'contain' }}
    >
      {/* Pull Indicator Container */}
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-30 flex items-center justify-center transition-all duration-200 ease-out"
        style={{
          height: `${Math.max(pullDistance, isRefreshing ? 56 : 0)}px`,
          opacity: pullDistance > 10 || isRefreshing ? 1 : 0,
        }}
      >
        <div
          className={`flex items-center gap-2 rounded-full border border-amber-500/30 bg-card/90 px-3.5 py-1.5 shadow-lg shadow-amber-500/10 backdrop-blur-md transition-transform duration-150 ${
            pullDistance >= pullThreshold && !isRefreshing ? 'scale-105 border-amber-500/60 bg-amber-500/10' : ''
          }`}
        >
          <RefreshCw
            className={`h-4 w-4 text-amber-500 transition-transform duration-200 ${
              isRefreshing ? 'animate-spin' : ''
            }`}
            style={{
              transform: isRefreshing ? undefined : `rotate(${progress * 360}deg)`,
            }}
          />
          <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            {isRefreshing
              ? 'Memuat ulang data...'
              : pullDistance >= pullThreshold
              ? 'Lepas untuk refresh'
              : 'Tarik untuk refresh'}
          </span>
        </div>
      </div>

      {/* Main Page Content with Pull Translation */}
      <div
        style={{
          transform: pullDistance > 0 || isRefreshing ? `translate3d(0, ${Math.max(pullDistance, isRefreshing ? 56 : 0)}px, 0)` : 'none',
          transition: isTouching ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      >
        {children}
      </div>
    </div>
  )
}
