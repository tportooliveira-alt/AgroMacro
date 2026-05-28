import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-blue-50 to-white">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="text-2xl font-serif font-bold gradient-text">
            Construtor
          </div>
          <div className="space-x-6">
            <Link href="/auth/login" className="text-sm hover:text-dourado">
              Entrar
            </Link>
            <Link href="/auth/signup" className="text-sm px-4 py-2 bg-dourado text-white rounded-lg hover:bg-dourado-deep">
              Começar Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 text-center reveal">
        <h1 className="text-5xl md:text-6xl font-serif font-bold mb-6">
          Landing Pages Profissionais
          <br />
          <span className="gradient-text">em Minutos com IA</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Crie e publique landing pages para seus e-books. Sem código. Sem designer. Só você e a IA.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/editor"
            className="px-8 py-3 bg-dourado text-white rounded-lg hover:bg-dourado-deep font-semibold"
          >
            Abrir Editor
          </Link>
          <Link
            href="#demo"
            className="px-8 py-3 border-2 border-azul text-azul rounded-lg hover:bg-azul/10"
          >
            Ver Demo
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 grid md:grid-cols-3 gap-8">
        {[
          { title: 'Texto → Landing', desc: 'Descreva seu e-book em poucas linhas' },
          { title: 'IA Gera Conteúdo', desc: 'Claude escreve copy, Flux cria imagens' },
          { title: 'Publica em 1 clique', desc: 'Conecta com Kiwify/Hotmart' },
        ].map((feature, i) => (
          <div key={i} className="glass p-8 rounded-xl">
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-gray-600">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center bg-gradient-to-r from-dourado/10 to-azul/10 rounded-2xl">
        <h2 className="text-4xl font-serif font-bold mb-4">Pronto para começar?</h2>
        <p className="text-gray-600 mb-8">Teste grátis. 1 landing page por mês. Sem cartão de crédito.</p>
        <Link
          href="/auth/signup"
          className="inline-block px-8 py-4 bg-azul text-white rounded-lg hover:bg-azul-light font-semibold"
        >
          Criar Conta
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t mt-20 py-8 text-center text-sm text-gray-600">
        <p>© 2026 Construtor. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
