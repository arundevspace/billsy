export const CATEGORIES = [
  { id: 'entertainment', label: 'Entertainment', icon: '🎬', color: '#FF6B6B' },
  { id: 'productivity', label: 'Productivity',  icon: '💼', color: '#5B5FEF' },
  { id: 'health',       label: 'Health & Fitness', icon: '🏃', color: '#4CAF50' },
  { id: 'music',        label: 'Music',          icon: '🎵', color: '#FF9800' },
  { id: 'cloud',        label: 'Cloud & Storage', icon: '☁️', color: '#2196F3' },
  { id: 'gaming',       label: 'Gaming',          icon: '🎮', color: '#9C27B0' },
  { id: 'news',         label: 'News & Reading',  icon: '📰', color: '#607D8B' },
  { id: 'education',    label: 'Education',       icon: '📚', color: '#00BCD4' },
  { id: 'finance',      label: 'Finance',         icon: '💳', color: '#4CAF50' },
  { id: 'other',        label: 'Other',           icon: '📦', color: '#9E9E9E' },
];

export const getCategoryById = (id) =>
  CATEGORIES.find((c) => c.id === id) || CATEGORIES[CATEGORIES.length - 1];

export const BILLING_CYCLES = [
  { id: 'weekly',    label: 'Weekly',   multiplier: 52 },
  { id: 'monthly',   label: 'Monthly',  multiplier: 12 },
  { id: 'quarterly', label: 'Quarterly', multiplier: 4 },
  { id: 'yearly',    label: 'Yearly',   multiplier: 1 },
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$' },
  { code: 'EUR', symbol: '€' },
  { code: 'GBP', symbol: '£' },
  { code: 'INR', symbol: '₹' },
  { code: 'JPY', symbol: '¥' },
  { code: 'AUD', symbol: 'A$' },
  { code: 'CAD', symbol: 'C$' },
];

export const POPULAR_SERVICES = [
  { name: 'Netflix',       category: 'entertainment', icon: '🎬' },
  { name: 'Spotify',       category: 'music',         icon: '🎵' },
  { name: 'Apple Music',   category: 'music',         icon: '🎵' },
  { name: 'YouTube Premium', category: 'entertainment', icon: '▶️' },
  { name: 'Disney+',       category: 'entertainment', icon: '🏰' },
  { name: 'Amazon Prime',  category: 'entertainment', icon: '📦' },
  { name: 'iCloud+',       category: 'cloud',         icon: '☁️' },
  { name: 'Google One',    category: 'cloud',         icon: '☁️' },
  { name: 'Notion',        category: 'productivity',  icon: '📝' },
  { name: 'Adobe CC',      category: 'productivity',  icon: '🎨' },
  { name: 'Duolingo Plus', category: 'education',     icon: '🦜' },
  { name: 'ChatGPT Plus',  category: 'productivity',  icon: '🤖' },
];
