from playwright.sync_api import sync_playwright


def log(msg):
    print(msg, flush=True)


def test_fluxo_financeiro():
    errors = []
    with sync_playwright() as p:
        log("Abrindo navegador")
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(viewport={"width": 1440, "height": 1000})

        page.on("console", lambda msg: errors.append(f"[{msg.type}] {msg.text}") if msg.type in ["error"] else None)
        page.on("pageerror", lambda err: errors.append(f"[pageerror] {err}"))

        log("Abrindo app")
        page.goto("http://localhost:8080", wait_until="domcontentloaded", timeout=20000)
        page.wait_for_timeout(3000)

        log("Limpando dados locais")
        page.evaluate("""() => {
            if (window.firebaseSync && typeof window.firebaseSync.skipLogin === 'function') {
                window.firebaseSync.skipLogin();
            } else {
                var login = document.getElementById('login-screen');
                if (login) login.classList.add('hidden');
                if (window.app && typeof window.app._initModules === 'function') {
                    window.app._initModules();
                }
            }
            var onboarding = document.getElementById('ux-onboarding');
            if (onboarding) onboarding.style.display = 'none';
            localStorage.clear();
            if (window.data && typeof window.data.init === 'function') {
                window.data.init();
            }
            if (window.app && typeof window.app.navigate === 'function') {
                window.app.navigate('home');
            }
        }""")
        page.wait_for_timeout(1000)

        log("Criando pastos base")
        page.evaluate("""() => {
            if (!window.data) throw new Error('window.data indisponivel');
            window.data.saveEvent({ type: 'PASTO', nome: 'Pasto Norte', area: 12, statusPasto: 'ativo', date: '2026-04-08' });
            window.data.saveEvent({ type: 'PASTO', nome: 'Pasto Sul', area: 8, statusPasto: 'ativo', date: '2026-04-08' });
            if (window.app && window.app.navigate) {
                window.app.navigate('compra');
            }
        }""")
        page.wait_for_timeout(1000)

        log("Preenchendo compra")
        page.fill("#compra-qty", "30")
        page.fill("#compra-peso", "220")
        page.fill("#compra-valor", "120000")
        page.fill("#compra-desc", "Compra teste bezerros")
        page.fill("#compra-fornecedor", "Fazenda Teste")
        page.select_option("#compra-pasto", label="Pasto Norte")
        page.fill("#compra-data", "2026-04-08")
        page.evaluate("window.financeiro.saveCompra()")
        page.wait_for_timeout(1200)
        log("Compra de gado enviada")

        log("Preenchendo estoque")
        page.evaluate("window.app.navigate('estoque')")
        page.wait_for_timeout(800)
        page.select_option("#est-categoria", value="racao_sal")
        page.fill("#est-produto", "Sal Mineral Teste")
        page.fill("#est-qty", "10")
        page.fill("#est-peso-saco", "25")
        page.fill("#est-valor", "85")
        page.evaluate("window.estoque.saveEntrada()")
        page.wait_for_timeout(1200)
        log("Entrada de insumo enviada")

        log("Preenchendo venda")
        page.evaluate("window.app.navigate('venda')")
        page.wait_for_timeout(1000)
        page.select_option("#venda-lote", index=1)
        page.wait_for_timeout(500)
        page.fill("#venda-qty", "10")
        page.fill("#venda-peso", "240")
        page.fill("#venda-valor", "55000")
        page.fill("#venda-comprador", "Frigorifico Teste")
        page.fill("#venda-desc", "Venda teste")
        page.fill("#venda-data", "2026-04-08")
        page.evaluate("window.financeiro.saveVenda()")
        page.wait_for_timeout(1200)
        log("Venda de gado enviada")

        log("Validando eventos")
        result = page.evaluate("""() => {
            const all = window.data.events || [];
            const byType = {};
            all.forEach(ev => { byType[ev.type] = (byType[ev.type] || 0) + 1; });
            const lotes = all.filter(ev => ev.type === 'LOTE');
            const lastLote = lotes[lotes.length - 1] || null;
            const compra = all.find(ev => ev.type === 'COMPRA');
            const venda = all.find(ev => ev.type === 'VENDA');
            const estoque = all.find(ev => ev.type === 'ESTOQUE_ENTRADA');
            return {
                byType,
                compraPasto: compra ? compra.pasto : '',
                vendaPasto: venda ? venda.pasto : '',
                estoqueCategoria: estoque ? (estoque.category || estoque.categoria) : '',
                ultimoLoteQtd: lastLote ? lastLote.qtdAnimais : null,
                fluxoHtml: (document.getElementById('fluxo-content') || {}).innerText || ''
            };
        }""")

        assert result["byType"].get("COMPRA", 0) >= 1, "Compra nao registrada"
        assert result["byType"].get("VENDA", 0) >= 1, "Venda nao registrada"
        assert result["byType"].get("ESTOQUE_ENTRADA", 0) >= 1, "Entrada de estoque nao registrada"
        assert result["compraPasto"] == "Pasto Norte", f"Pasto da compra incorreto: {result['compraPasto']}"
        assert result["vendaPasto"] == "Pasto Norte", f"Pasto da venda incorreto: {result['vendaPasto']}"
        assert result["estoqueCategoria"] == "racao_sal", f"Categoria de estoque incorreta: {result['estoqueCategoria']}"
        assert result["ultimoLoteQtd"] == 20, f"Quantidade do lote apos venda incorreta: {result['ultimoLoteQtd']}"

        log("Abrindo fluxo")
        page.evaluate("window.app.navigate('fluxo')")
        page.wait_for_timeout(1200)
        fluxo_texto = page.locator("#fluxo-content").inner_text()
        assert "Compra de Gado" in fluxo_texto, "Fluxo nao mostra compra de gado"
        assert "Entrada de Insumo" in fluxo_texto, "Fluxo nao mostra insumo"
        assert "Venda de Gado" in fluxo_texto, "Fluxo nao mostra venda de gado"
        assert "Fazenda Teste" in fluxo_texto, "Fluxo nao permite rastrear fornecedor"
        assert "Frigorifico Teste" in fluxo_texto, "Fluxo nao permite rastrear comprador"

        if errors:
            raise AssertionError("Erros de runtime encontrados: " + " | ".join(errors[:10]))

        browser.close()
        log("Fluxo financeiro principal validado com sucesso")


if __name__ == '__main__':
    test_fluxo_financeiro()
