import { 
  Book, 
  Video, 
  Globe, 
  FileText, 
  Lightbulb, 
  Code, 
  GraduationCap, 
  Music,
  LucideIcon
} from 'lucide-react';
import { LinkColor } from '@/types/link';

export const LINK_COLORS: { 
  name: LinkColor; 
  class: string; 
  bg: string; 
  border: string; 
  text: string; 
  darkText: string;
  badge: string;
}[] = [
  { 
    name: 'emerald', 
    class: 'bg-[#10b981]', 
    bg: 'bg-emerald-50/90', 
    border: 'border-emerald-200', 
    text: 'text-emerald-700', 
    darkText: 'text-emerald-900',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200'
  },
  { 
    name: 'blue', 
    class: 'bg-[#3b82f6]', 
    bg: 'bg-blue-50/90', 
    border: 'border-blue-200', 
    text: 'text-blue-700', 
    darkText: 'text-blue-900',
    badge: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  { 
    name: 'amber', 
    class: 'bg-[#f59e0b]', 
    bg: 'bg-amber-50/90', 
    border: 'border-amber-200', 
    text: 'text-amber-700', 
    darkText: 'text-amber-900',
    badge: 'bg-amber-100 text-amber-800 border-amber-200'
  },
  { 
    name: 'rose', 
    class: 'bg-[#f43f5e]', 
    bg: 'bg-rose-50/90', 
    border: 'border-rose-200', 
    text: 'text-rose-700', 
    darkText: 'text-rose-900',
    badge: 'bg-rose-100 text-rose-800 border-rose-200'
  },
  { 
    name: 'slate', 
    class: 'bg-[#64748b]', 
    bg: 'bg-slate-50/90', 
    border: 'border-slate-300', 
    text: 'text-slate-700', 
    darkText: 'text-slate-900',
    badge: 'bg-slate-200 text-slate-800 border-slate-300'
  },
];

export const LINK_ICONS: { name: string; icon: LucideIcon }[] = [
  { name: 'book', icon: Book },
  { name: 'video', icon: Video },
  { name: 'globe', icon: Globe },
  { name: 'file', icon: FileText },
  { name: 'idea', icon: Lightbulb },
  { name: 'code', icon: Code },
  { name: 'study', icon: GraduationCap },
  { name: 'audio', icon: Music },
];

export const getIcon = (name: string) => {
  return LINK_ICONS.find(i => i.name === name)?.icon || Globe;
};

export const getColorData = (name: LinkColor) => {
  return LINK_COLORS.find(c => c.name === name) || LINK_COLORS[0];
};
