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
  { name: 'emerald', class: 'bg-emerald-600', bg: 'bg-emerald-100', text: 'text-emerald-900' },
  { name: 'blue', class: 'bg-blue-600', bg: 'bg-blue-100', text: 'text-blue-900' },
  { name: 'amber', class: 'bg-amber-500', bg: 'bg-amber-100', text: 'text-amber-900' },
  { name: 'rose', class: 'bg-rose-600', bg: 'bg-rose-100', text: 'text-rose-900' },
  { name: 'violet', class: 'bg-violet-600', bg: 'bg-violet-100', text: 'text-violet-900' },
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