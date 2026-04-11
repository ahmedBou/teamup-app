import type { Circuit } from './circuit'

export type ActivityType =
  | 'road_ride'
  | 'mtb_ride'
  | 'gravel_ride'
  | 'casual_ride'

export type ActivityStatus = 'open' | 'full' | 'cancelled' | 'completed'

export type Activity = {
  id: string
  host_id: string
  title: string
  description: string | null
  activity_type: ActivityType
  city: string
  start_time: string
  max_participants: number
  participant_count: number
  circuit_id: string | null
  circuit?: Circuit | null
  status: ActivityStatus
  created_at: string
  updated_at: string
}

export type CreateActivityInput = {
  host_id: string
  title: string
  description?: string | null
  activity_type: ActivityType
  city: string
  start_time: string
  max_participants: number
  circuit_id?: string | null
}