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

export const LINK_COLORS: { name: LinkColor; class: string; bg: string; text: string }[] = [
  { name: 'emerald', class: 'bg-[#10b981]', bg: 'bg-emerald-50', text: 'text-emerald-900' },
  { name: 'blue', class: 'bg-[#3b82f6]', bg: 'bg-blue-50', text: 'text-blue-900' },
  { name: 'amber', class: 'bg-[#f59e0b]', bg: 'bg-amber-50', text: 'text-amber-900' },
  { name: 'rose', class: 'bg-[#f43f5e]', bg: 'bg-rose-50', text: 'text-rose-900' },
  { name: 'slate', class: 'bg-[#64748b]', bg: 'bg-slate-50', text: 'text-slate-900' },
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
