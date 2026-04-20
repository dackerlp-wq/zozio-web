'use client'

import { useRouter } from 'next/navigation'
import ExitModal from './ExitModal'

interface Props {
  animalId: string
  animalName: string
  evidenceNumber: string
}

export default function ExitModalTrigger({ animalId, animalName, evidenceNumber }: Props) {
  const router = useRouter()

  function handleClose() {
    router.push(`/admin/animals/${animalId}`)
  }

  return (
    <ExitModal
      animalId={animalId}
      animalName={animalName}
      evidenceNumber={evidenceNumber}
      onClose={handleClose}
    />
  )
}
