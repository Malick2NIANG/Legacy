import { useSidebar } from '../context/SidebarContext'
import useResponsive from './useResponsive'

/**
 * Retourne le marginLeft à appliquer sur le contenu principal.
 * Desktop : 220px (ouvert) ou 60px (mini) — la sidebar est toujours présente.
 * Mobile/tablette : 0 — la sidebar est en overlay.
 */
export default function useLayout() {
  const { isOpen }              = useSidebar()
  const { isMobile, isTablet }  = useResponsive()

  const isDesktop   = !isMobile && !isTablet
  const sidebarWidth = isDesktop ? (isOpen ? 220 : 60) : 0

  return {
    mainStyle: {
      marginLeft: sidebarWidth,
      paddingTop: 64,
      transition: 'margin-left 0.25s ease',
      minHeight: '100vh',
    },
    sidebarWidth,
  }
}
