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
  { name: 'emerald', class: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  { name: 'blue', class: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700' },
  { name: 'amber', class: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-700' },
  { name: 'rose', class: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700' },
  { name: 'violet', class: 'bg-violet-500', bg: 'bg-violet-50', text: 'text-violet-700' },
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
