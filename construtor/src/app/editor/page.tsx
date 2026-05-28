'use client'

import Link from 'next/link'

export default function EditorPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="bg-white border-b sticky top-0 z-40 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <Link href="/dashboard" className="text-xl font-bold gradient-text">
            Construtor — Editor
          </Link>
          <div className="space-x-4">
            <button className="px-4 py-2 border rounded-lg hover:bg-gray-50" disabled>
              Pré-visualizar
            </button>
            <button className="px-4 py-2 bg-dourado text-white rounded-lg" disabled>
              Publicar
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-16 px-4 text-center">
        <h1 className="text-3xl font-bold mb-4">Editor Visual</h1>
        <p className="text-gray-600 mb-8">
          O editor com Puck será implementado no Sprint 4
        </p>
        <div className="glass rounded-xl p-12">
          <p className="text-gray-500">Em construção...</p>
          <Link
            href="/dashboard"
            className="inline-block mt-4 px-4 py-2 bg-azul text-white rounded-lg hover:bg-azul-light"
          >
            Voltar ao Dashboard
          </Link>
        </div>
      </div>
    </div>
  )
}
