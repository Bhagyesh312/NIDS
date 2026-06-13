import { useEffect, useRef, useState } from 'react'

function easeOutExpo(t) {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t)
}

export default function useCountUp(target, duration = 1500, decimals = 0) {
  const [value, setValue] = useState(0)
  const raf = useRef(null)
  const start = useRef(null)

  useEffect(() => {
    start.current = null
    const step = (timestamp) => {
      if (!start.current) start.current = timestamp
      const elapsed = timestamp - start.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = easeOutExpo(progress)
      setValue(parseFloat((eased * target).toFixed(decimals)))
      if (progress < 1) raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [target, duration, decimals])

  return value
}
