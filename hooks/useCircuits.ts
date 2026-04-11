import { useCallback, useEffect, useState } from 'react'
import { circuitService } from '../src/services/circuitService'
import type { Circuit } from '../src/types/circuit'

type UseCircuitsResult = {
  circuits: Circuit[]
  loading: boolean
  error: string | null
  refreshCircuits: () => Promise<void>
}

export function useCircuits(): UseCircuitsResult {
  const [circuits, setCircuits] = useState<Circuit[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refreshCircuits = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await circuitService.listActiveCircuits()
      setCircuits(data)
    } catch (err: any) {
      setError(err?.message ?? 'Failed to load circuits')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refreshCircuits()
  }, [refreshCircuits])

  return {
    circuits,
    loading,
    error,
    refreshCircuits,
  }
}