export const nav = [
  { label: 'Início', href: '/', key: 'home' },
  { label: 'Cosmic Blue', href: '/cosmic-blue/', key: 'cosmic-blue' },
  { label: 'Eclipse Grey', href: '/eclipse-grey/', key: 'eclipse-grey' },
  { label: 'Design', href: '/design/', key: 'design' },
  { label: 'Universo', href: '/universe/', key: 'universe' },
  { label: 'Contato', href: '/contact/', key: 'contact' },
] as const;

export const legal = [
  { label: 'Política de Privacidade', href: '/privacy/' },
  { label: 'Termos e Condições', href: '/terms/' },
] as const;

// Perfis oficiais ainda não divulgados. Preencha `url` quando existirem;
// até lá, o rodapé renderiza marcadores inativos (sem links fictícios).
export const social: { label: string; url: string | null }[] = [
  { label: 'Instagram', url: null },
  { label: 'YouTube', url: null },
  { label: 'LinkedIn', url: null },
  { label: 'X', url: null },
];

export const tagline = 'Além do extraordinário.';
