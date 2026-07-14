import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LogOut, MoreVertical, Moon, Settings, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext.jsx';

export default function SidebarMenu({ onSettings, onLogout }) {
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    if (!open) return undefined;

    function onDocClick(e) {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    }
    function onKeyDown(e) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onDocClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="sidebar-menu" ref={rootRef}>
      <motion.button
        type="button"
        className={`sidebar-menu-trigger ${open ? 'open' : ''}`}
        aria-label="Open menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
      >
        <MoreVertical size={18} strokeWidth={2.2} aria-hidden="true" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="sidebar-menu-dropdown"
            role="menu"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <button
              type="button"
              className="sidebar-menu-item theme-item"
              role="menuitemcheckbox"
              aria-checked={isDark}
              onClick={toggleTheme}
            >
              <span className="sidebar-menu-item-left">
                {isDark ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
                <span>{isDark ? 'Dark mode' : 'Light mode'}</span>
              </span>
              <span className={`menu-switch ${isDark ? 'on' : ''}`} aria-hidden="true">
                <span className="menu-switch-knob" />
              </span>
            </button>

            <button
              type="button"
              className="sidebar-menu-item"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSettings?.();
              }}
            >
              <span className="sidebar-menu-item-left">
                <Settings size={16} aria-hidden="true" />
                <span>Settings</span>
              </span>
            </button>

            <div className="sidebar-menu-divider" />

            <button
              type="button"
              className="sidebar-menu-item danger"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onLogout?.();
              }}
            >
              <span className="sidebar-menu-item-left">
                <LogOut size={16} aria-hidden="true" />
                <span>Log out</span>
              </span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
