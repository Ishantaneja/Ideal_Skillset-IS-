/**
 * Helper to determine badge color class based on score percentage
 */
export function getScoreBadgeVariant(score) {
  const num = typeof score === 'string' ? parseFloat(score) : Number(score);
  if (isNaN(num)) return 'slate';
  if (num >= 80) return 'emerald';
  if (num >= 65) return 'amber';
  return 'rose';
}

/**
 * Format raw numbers to compact currency or counter strings
 */
export function formatNumber(num) {
  if (num === null || num === undefined || isNaN(Number(num))) return '0';
  return new Intl.NumberFormat('en-US').format(Number(num));
}

/**
 * Format string to capitalized words
 */
export function formatTitleCase(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
