export const queryKeys = {
  mapUsers: () => ['map-users'] as const,
  profilePrivateDetails: (userId: string) => ['profile-private-details', userId] as const,
}
