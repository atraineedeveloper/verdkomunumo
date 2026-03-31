import {
  MessageSquare, BookOpen, Clapperboard, Newspaper,
  Cpu, Plane, HelpCircle, Gamepad2,
  Sprout, Leaf, TreePine,
  type LucideIcon,
} from 'lucide-react'

export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  generala:   MessageSquare,
  lernado:    BookOpen,
  kulturo:    Clapperboard,
  novajoj:    Newspaper,
  teknologio: Cpu,
  vojagoj:    Plane,
  helpo:      HelpCircle,
  ludoj:      Gamepad2,
}

export const CATEGORY_COLORS: Record<string, string> = {
  generala:   '#64748b',
  lernado:    '#3b82f6',
  kulturo:    '#7c3aed',
  novajoj:    '#ea580c',
  teknologio: '#0891b2',
  vojagoj:    '#0d9488',
  helpo:      '#d97706',
  ludoj:      '#db2777',
}

export const LEVEL_ICONS: Record<string, LucideIcon> = {
  komencanto: Sprout,
  progresanto: Leaf,
  flua:        TreePine,
}

export const LEVEL_COLORS: Record<string, string> = {
  komencanto: '#65a30d',
  progresanto: '#16a34a',
  flua:        '#15803d',
}
