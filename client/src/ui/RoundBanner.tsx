import { useEffect, useState } from 'react'

interface Props {
  round: number
  visible: boolean
}

export default function RoundBanner({ round, visible }: Props) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (visible) {
      setShow(true)
      const t = setTimeout(() => setShow(false), 2200)
      return () => clearTimeout(t)
    }
  }, [visible, round])

  if (!show) return null

  return (
    <div className="round-banner">
      <div className="round-banner-inner">
        <div className="round-banner-label">RONDA</div>
        <div className="round-banner-number">{round}</div>
      </div>
    </div>
  )
}
