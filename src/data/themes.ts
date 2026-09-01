import { AestheticTheme } from '../types';

export const AESTHETIC_THEMES: AestheticTheme[] = [
  {
    id: 'nordic-light',
    name: 'Nordic Minimal (Light)',
    nameAmharic: 'ኖርዲክ ሚኒማል (ነጭ)',
    tagline: 'Porcelain white minimalism with deep indigo & cobalt accents. Clean and airy.',
    taglineAmharic: 'ቀላል እና ዘመናዊ የነጭ ዲዛይን ከኢንዲጎ እና ሰማያዊ ድምቀቶች ጋር።',
    mode: 'light',
    palette: {
      bg: '#f1f5f9',
      card: '#ffffff',
      border: '#cbd5e1',
      accent: '#4f46e5',
      text: '#020617',
      textMuted: '#475569'
    }
  },
  {
    id: 'scholar-light',
    name: 'Scholar Parchment (Light)',
    nameAmharic: 'የሊቃውንት ብራና (ነጭ)',
    tagline: 'Crisp warm ivory, high-contrast charcoal typography, and emerald accents.',
    taglineAmharic: 'ንጹህ የብራና ነጭ መደብ ከከሰል ጥቁር ጽሑፍ እና አረንጓዴ ማድመቂያ ጋር።',
    mode: 'light',
    palette: {
      bg: '#fcfbf9',
      card: '#ffffff',
      border: '#e6e0d4',
      accent: '#059669',
      text: '#1c1917',
      textMuted: '#78716c'
    }
  },
  {
    id: 'slate-dark',
    name: 'Academic Slate (Dark)',
    nameAmharic: 'አካዳሚክ ስሌት (ጥቁር)',
    tagline: 'Deep navy-slate with focused emerald & cyan highlights. Optimized for long study sessions.',
    taglineAmharic: 'ለረጅም የጥናት ሰዓታት ተስማሚ የሆነ ጥልቅ የሰሌዳ ቀለም ከአረንጓዴ ማድመቂያ ጋር።',
    mode: 'dark',
    palette: {
      bg: '#020617',
      card: '#0f172a',
      border: '#1e293b',
      accent: '#10b981',
      text: '#f8fafc',
      textMuted: '#94a3b8'
    }
  },
  {
    id: 'obsidian-dark',
    name: 'Obsidian Cyber (Dark)',
    nameAmharic: 'ኦብሲዲያን ሳይበር (ጥቁር)',
    tagline: 'Pure midnight black with high-voltage mint & electric azure accents.',
    taglineAmharic: 'ድቅድቅ ጥቁር መደብ ከደማቅ ሚንት እና ኤሌክትሪክ አዙር ድምቀቶች ጋር።',
    mode: 'dark',
    palette: {
      bg: '#09090b',
      card: '#121215',
      border: '#27272a',
      accent: '#10b981',
      text: '#fafafa',
      textMuted: '#a1a1aa'
    }
  },
  {
    id: 'terracotta-warm',
    name: 'Addis Espresso (Warm Heritage)',
    nameAmharic: 'አዲስ ቡና (ሞቃታማ ጥቁር)',
    tagline: 'Roasted coffee espresso dark theme with warm Ethiopian terracotta & amber gold.',
    taglineAmharic: 'የኢትዮጵያ ባህላዊ የቡና እና ሸክላ ሞቃታማ ቀለማት ቅንብር።',
    mode: 'dark',
    palette: {
      bg: '#160e0a',
      card: '#231610',
      border: '#3d281f',
      accent: '#ea580c',
      text: '#fdf8f5',
      textMuted: '#d1b8a8'
    }
  }
];
