export interface SubscriptionCatalogItem {
  key: string;
  name: string;
  aliases: string[];
  category: string;
  color: string;
  defaultCycle?: 'MONTHLY' | 'YEARLY';
  defaultDueDay?: number;
}

export const SUBSCRIPTION_CATALOG: SubscriptionCatalogItem[] = [
  {
    key: 'netflix',
    name: 'Netflix',
    aliases: ['netflix', 'net flix'],
    category: 'Streaming',
    color: '#E50914',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 10,
  },
  {
    key: 'spotify',
    name: 'Spotify',
    aliases: ['spotify', 'musica', 'podcast'],
    category: 'Música',
    color: '#1DB954',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 5,
  },
  {
    key: 'chatgpt',
    name: 'ChatGPT Plus',
    aliases: ['chatgpt', 'openai', 'gpt', 'gpt-4', 'ia'],
    category: 'Produtividade / IA',
    color: '#10A37F',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 1,
  },
  {
    key: 'amazon-prime',
    name: 'Amazon Prime',
    aliases: ['amazon', 'prime', 'prime video'],
    category: 'Streaming / Varejo',
    color: '#00A8E1',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 15,
  },
  {
    key: 'disney-plus',
    name: 'Disney+',
    aliases: ['disney', 'disney+', 'disney plus', 'star+'],
    category: 'Streaming',
    color: '#113CCF',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 12,
  },
  {
    key: 'max',
    name: 'Max',
    aliases: ['max', 'hbo', 'hbo max'],
    category: 'Streaming',
    color: '#002BE7',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 8,
  },
  {
    key: 'youtube-premium',
    name: 'YouTube Premium',
    aliases: ['youtube', 'yt', 'youtube premium', 'yt music'],
    category: 'Vídeo / Música',
    color: '#FF0000',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 10,
  },
  {
    key: 'apple-one',
    name: 'Apple One / iCloud',
    aliases: ['apple', 'apple one', 'icloud', 'apple music', 'apple tv'],
    category: 'Serviços',
    color: '#555555',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 20,
  },
  {
    key: 'google-one',
    name: 'Google One',
    aliases: ['google', 'google one', 'drive', 'google drive'],
    category: 'Armazenamento',
    color: '#4285F4',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 15,
  },
  {
    key: 'microsoft-365',
    name: 'Microsoft 365',
    aliases: ['microsoft', 'office', 'm365', 'office 365'],
    category: 'Produtividade',
    color: '#D83B01',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 1,
  },
  {
    key: 'globoplay',
    name: 'Globoplay',
    aliases: ['globo', 'globoplay', 'gplay'],
    category: 'Streaming',
    color: '#FB0036',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 10,
  },
  {
    key: 'notion',
    name: 'Notion',
    aliases: ['notion', 'workspace'],
    category: 'Produtividade',
    color: '#000000',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 1,
  },
  {
    key: 'canva',
    name: 'Canva Pro',
    aliases: ['canva', 'canva pro', 'design'],
    category: 'Design',
    color: '#00C4CC',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 5,
  },
  {
    key: 'adobe-cc',
    name: 'Adobe Creative Cloud',
    aliases: ['adobe', 'creative cloud', 'photoshop', 'illustrator'],
    category: 'Design',
    color: '#FF0000',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 15,
  },
  {
    key: 'smart-fit',
    name: 'Smart Fit',
    aliases: ['smartfit', 'smart fit', 'academia', 'fitness'],
    category: 'Saúde / Esporte',
    color: '#FFB800',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 10,
  },
  {
    key: 'deezer',
    name: 'Deezer',
    aliases: ['deezer', 'musica'],
    category: 'Música',
    color: '#EF5466',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 5,
  },
  {
    key: 'paramount-plus',
    name: 'Paramount+',
    aliases: ['paramount', 'paramount+', 'paramount plus'],
    category: 'Streaming',
    color: '#0064FF',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 14,
  },
  {
    key: 'crunchyroll',
    name: 'Crunchyroll',
    aliases: ['crunchyroll', 'anime'],
    category: 'Anime',
    color: '#F47521',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 18,
  },
  {
    key: 'github-copilot',
    name: 'GitHub Copilot',
    aliases: ['github', 'copilot', 'dev', 'code'],
    category: 'Desenvolvimento',
    color: '#6E40C9',
    defaultCycle: 'MONTHLY',
    defaultDueDay: 1,
  },
];

const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
};

export const searchCatalog = (query: string): SubscriptionCatalogItem[] => {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return [];

  return SUBSCRIPTION_CATALOG.filter((item) => {
    const normName = normalizeText(item.name);
    if (normName.includes(normalizedQuery)) return true;
    return item.aliases.some((alias) => normalizeText(alias).includes(normalizedQuery));
  });
};
