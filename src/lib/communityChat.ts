import type { CommunityMessage } from '@/lib/types'

export const COMMUNITY_MESSAGES_LIMIT = 50

export function normalizeCommunityMessages(messages: CommunityMessage[]) {
  return [...messages]
    .sort((left, right) => Date.parse(left.created_at) - Date.parse(right.created_at))
    .slice(-COMMUNITY_MESSAGES_LIMIT)
}

export function mergeCommunityMessages(current: CommunityMessage[], incoming: CommunityMessage) {
  const nextMessages = current.filter((message) => {
    if (message.id === incoming.id) return false

    if (
      message.client_nonce &&
      incoming.client_nonce &&
      message.client_nonce === incoming.client_nonce &&
      message.user_id === incoming.user_id
    ) {
      return false
    }

    return true
  })

  nextMessages.push(incoming)
  return normalizeCommunityMessages(nextMessages)
}
