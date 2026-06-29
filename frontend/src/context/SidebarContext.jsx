import React, { createContext, useContext, useState, useEffect } from 'react'
import useResponsive from '../hooks/useResponsive'

const SidebarContext = createContext()

export function SidebarProvider({ children }) {
  const { isDesktop } = useResponsive()
  const [isOpen, setIsOpen] = useState(isDesktop)

  // Ferme sur mobile, ouvre sur desktop quand on redimensionne
  useEffect(() => { setIsOpen(isDesktop) }, [isDesktop])

  const toggle = () => setIsOpen(v => !v)
  const close  = () => setIsOpen(false)

  return (
    <SidebarContext.Provider value={{ isOpen, toggle, close }}>
      {children}
    </SidebarContext.Provider>
  )
}

export const useSidebar = () => useContext(SidebarContext)
