/**
 * Store global de l'application.
 * Gère les états partagés : notifications, thème, état de chargement global.
 */

// TODO: état : notifications[], theme, globalLoading
// TODO: actions : addNotification, removeNotification, setTheme

const appStore = {
  notifications: [],
  theme: 'light',
  globalLoading: false,
}

export default appStore
