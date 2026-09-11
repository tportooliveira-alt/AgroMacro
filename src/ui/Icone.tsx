const caminhos: Record<string, string> = {
  casa: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  pasto: 'M3 20c3-6 6-9 9-9s6 3 9 9M12 11V3M8 7l4-4 4 4',
  gado: 'M4 8c-2-2-2-5 0-6 2 2 4 3 6 3h4c2 0 4-1 6-3 2 1 2 4 0 6l-3 2v5a5 5 0 0 1-10 0v-5z',
  seringa: 'M18 2l4 4M14 6l4 4M10 10l-6 6 4 4 6-6M14 6l-4 4 4 4 4-4',
  dinheiro: 'M2 7h20v10H2zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6M6 12h.01M18 12h.01',
  equipe: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8',
  config: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
  balanca: 'M12 3v18M3 7h18M6 7l-3 7a3 3 0 0 0 6 0zM18 7l-3 7a3 3 0 0 0 6 0z',
  mover: 'M5 12h14M13 6l6 6-6 6',
  mais: 'M12 5v14M5 12h14',
  compra: 'M3 3h2l3 12h11l3-8H7M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2M18 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2',
  venda: 'M3 3h2l3 12h11l3-8H7M12 8v5M10 11l2 2 2-2',
  alerta: 'M12 9v4M12 17h.01M10.3 3.9L2.5 17.5A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
}

export function Icone({ nome, tamanho = 22 }: { nome: keyof typeof caminhos | string; tamanho?: number }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={caminhos[nome] ?? caminhos.mais} />
    </svg>
  )
}
