import { useEffect, useMemo, useState } from 'react'

const getRemainingSeconds = (targetTime) => {
  return Math.max(0, Math.ceil((targetTime - Date.now()) / 1000))
}

const splitTime = (remainingSeconds) => {
  const days = Math.floor(remainingSeconds / 86400)
  const hours = Math.floor((remainingSeconds % 86400) / 3600)
  const minutes = Math.floor((remainingSeconds % 3600) / 60)
  const seconds = remainingSeconds % 60

  return { days, hours, minutes, seconds }
}

export function useCountdown(targetDate) {
  const targetTime = useMemo(() => new Date(targetDate).getTime(), [targetDate])
  const [remainingSeconds, setRemainingSeconds] = useState(() =>
    getRemainingSeconds(targetTime),
  )

  useEffect(() => {
    let timeoutId

    const sync = () => {
      window.clearTimeout(timeoutId)

      const remaining = getRemainingSeconds(targetTime)
      setRemainingSeconds(remaining)

      if (remaining === 0) {
        return
      }

      const millisecondsLeft = Math.max(1, targetTime - Date.now())
      const nextBoundary = millisecondsLeft % 1000 || 1000
      timeoutId = window.setTimeout(sync, nextBoundary + 12)
    }

    const handleVisibility = () => {
      if (!document.hidden) {
        sync()
      }
    }

    sync()
    document.addEventListener('visibilitychange', handleVisibility)

    return () => {
      window.clearTimeout(timeoutId)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [targetTime])

  return {
    ...splitTime(remainingSeconds),
    isLive: remainingSeconds === 0,
    remainingSeconds,
  }
}
