import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api } from '../api/client'
import type { Settings } from '../api/types'

const DEFAULTS: Settings = {
  SHOWROOM_3D_ENABLED: false,
  SITE_NAME: 'Maison Dorée',
  SITE_TAGLINE: 'Fine Jewellery, Considered',
  SUPPORT_EMAIL: 'care@maisondoree.example',
  SUPPORT_PHONE: '+1 212 555 0100',
}

interface SettingsContextValue {
  settings: Settings
  showroomEnabled: boolean
}

const SettingsContext = createContext<SettingsContextValue | null>(null)

/**
 * Loads public site settings. The SHOWROOM_3D_ENABLED flag decides whether the
 * future 3D showroom module is active. While disabled the site always renders
 * the premium 2D experience and no 3D assets are ever requested.
 */
export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(DEFAULTS)

  useEffect(() => {
    let mounted = true
    api
      .getSettings()
      .then((res) => {
        if (mounted) setSettings({ ...DEFAULTS, ...res.settings })
      })
      .catch(() => {
        // Fall back to defaults — never block the site on settings
      })
    return () => {
      mounted = false
    }
  }, [])

  const value = useMemo(
    () => ({ settings, showroomEnabled: settings.SHOWROOM_3D_ENABLED === true }),
    [settings]
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}

// Kept for future use by the 3D showroom module.
export function useShowroomEnabled(): boolean {
  const { showroomEnabled } = useSettings()
  return showroomEnabled
}

export { DEFAULTS as DEFAULT_SETTINGS }
