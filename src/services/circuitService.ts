import { supabase } from '../lib/supabase'
import type { Circuit } from '../types/circuit'

export const circuitService = {
  async listActiveCircuits(): Promise<Circuit[]> {
    const { data, error } = await supabase
      .from('circuits')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return (data ?? []) as Circuit[]
  },
}