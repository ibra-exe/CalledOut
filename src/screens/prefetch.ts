// Warm lazy-route chunks before they're needed so navigations don't flash the
// Suspense loader. import() is cached by the bundler, so these are cheap and
// idempotent — call them on the screen *before* the likely next destination.

export const prefetchCreateJoin = () => {
  import('./CreateRoomScreen')
  import('./JoinRoomScreen')
}

export const prefetchLobby = () => {
  import('./LobbyScreen')
}

// Warms the whole in-game chunk (GameRouter statically pulls Game + Reveal).
export const prefetchGame = () => {
  import('./GameRouter')
}

export const prefetchStats = () => {
  import('./StatsScreen')
}
