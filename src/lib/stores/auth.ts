import { writable } from 'svelte/store'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '$lib/types'

export const currentUser = writable<User | null>(null)
export const currentProfile = writable<Profile | null>(null)
