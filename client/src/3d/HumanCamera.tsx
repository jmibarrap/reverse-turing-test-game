import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

interface Props {
  activePlayerAngle?: number | null
  votingPhase?: boolean
}

// Camera sits where the human would be seated, looking toward center
const CAM_POSITION = new THREE.Vector3(0, 0.95, 4.2)
const LOOK_TARGET   = new THREE.Vector3(0, 0.3, 0)

export default function HumanCamera({ activePlayerAngle, votingPhase }: Props) {
  const { camera } = useThree()
  const mouse = useRef({ x: 0, y: 0 })
  const smooth = useRef({ x: 0, y: 0 })

  useEffect(() => {
    // Set initial position immediately
    camera.position.copy(CAM_POSITION)
    camera.lookAt(LOOK_TARGET)
  }, [camera])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2
      mouse.current.y = -(e.clientY / window.innerHeight - 0.5) * 2
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [])

  useFrame((_, delta) => {
    const lf = 1 - Math.pow(0.03, delta)
    smooth.current.x += (mouse.current.x - smooth.current.x) * lf
    smooth.current.y += (mouse.current.y - smooth.current.y) * lf

    // Slight position sway
    const targetPos = CAM_POSITION.clone()
    targetPos.x += smooth.current.x * 0.1
    targetPos.y += smooth.current.y * 0.05
    camera.position.lerp(targetPos, 0.07)

    // Look target
    const lookTarget = LOOK_TARGET.clone()
    if (activePlayerAngle != null) {
      lookTarget.x += Math.sin(activePlayerAngle) * 0.4
      lookTarget.z -= Math.cos(activePlayerAngle) * 0.2
    }
    lookTarget.x += smooth.current.x * 0.22
    lookTarget.y += smooth.current.y * 0.1
    if (votingPhase) lookTarget.y -= 0.08

    const dir = new THREE.Vector3()
    camera.getWorldDirection(dir)
    const desired = lookTarget.clone().sub(camera.position).normalize()
    dir.lerp(desired, 0.055)
    camera.lookAt(camera.position.clone().add(dir))
  })

  return null
}
