import { AnimatePresence, motion } from 'framer-motion'
import { Moon, Sun } from 'lucide-react'
import { usePreferences } from '../../context/PreferencesContext.jsx'

function ThemeToggle() {
  const { prefs, update } = usePreferences()
  const theme = prefs.theme
  const toggle = () => update({ theme: theme === 'dark' ? 'light' : 'dark' }).catch(() => {})
  const dark = theme === 'dark'
  return (
    <button
      type="button"
      className="btn glass-btn icon sm theme-toggle"
      onClick={toggle}
      aria-label={dark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      title={dark ? 'Tema claro' : 'Tema oscuro'}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={theme}
          initial={{ rotate: -90, scale: 0.4, opacity: 0 }}
          animate={{ rotate: 0, scale: 1, opacity: 1 }}
          exit={{ rotate: 90, scale: 0.4, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 500, damping: 26 }}
          style={{ display: 'grid' }}
        >
          {dark ? <Sun size={16} /> : <Moon size={16} />}
        </motion.span>
      </AnimatePresence>
    </button>
  )
}

export default ThemeToggle
