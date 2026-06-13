import Header from '../components/Header'
import AttackInfo from '../components/AttackInfo'
import { useEffect } from 'react'

export default function InfoPage() {
  useEffect(() => { document.title = 'NIDS · Info' }, [])
  return (
    <div>
      <Header title="Info" subtitle="Attack type reference — what they are, how they work, and how to detect them" />
      <AttackInfo standalone />
    </div>
  )
}
