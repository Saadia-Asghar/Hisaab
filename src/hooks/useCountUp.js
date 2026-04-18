import { useEffect, useState } from 'react'

export function useCountUp(target, durationMs = 800) {
  const [value, setValue] = useState(0)

  useEffect(() => {
    const start = performance.now()
    const from = 0
    const to = typeof target === 'number' ? target : 0
    let raf
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - (1 - t) * (1 - t)
      setValue(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(tick)
      else setValue(to)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, durationMs])

  return value
}
