import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat().format(num)
}

export function formatDate(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateTime(date: string | Date): string {
  const d = new Date(date)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function calculateGrade(percentage: number): 'A' | 'B' | 'C' | 'S' | 'F' {
  if (percentage >= 75) return 'A'
  if (percentage >= 65) return 'B'
  if (percentage >= 55) return 'C'
  if (percentage >= 40) return 'S'
  return 'F'
}

export function getGradeColor(grade: string): string {
  const colors: { [key: string]: string } = {
    'A': 'text-success',
    'B': 'text-primary',
    'C': 'text-warning',
    'S': 'text-accent',
    'F': 'text-error'
  }
  return colors[grade] || 'text-muted-foreground'
}

export function getSubjectIcon(subjectName: string): string {
  const name = subjectName.toLowerCase()
  if (name.includes('english') || name.includes('language')) return '📚'
  if (name.includes('math') || name.includes('calculation')) return '🔢'
  if (name.includes('science') || name.includes('physics') || name.includes('chemistry') || name.includes('biology')) return '🔬'
  if (name.includes('sinhala') || name.includes('tamil') || name.includes('local')) return '🇱🇰'
  if (name.includes('history') || name.includes('social')) return '📜'
  if (name.includes('art') || name.includes('drawing')) return '🎨'
  if (name.includes('music') || name.includes('song')) return '🎵'
  if (name.includes('sport') || name.includes('physical')) return '⚽'
  if (name.includes('computer') || name.includes('ict') || name.includes('technology')) return '💻'
  if (name.includes('geography') || name.includes('map')) return '🗺️'
  if (name.includes('religion') || name.includes('buddhism') || name.includes('islam') || name.includes('christianity') || name.includes('hinduism')) return '🙏'
  return '📖' // Default icon
}
