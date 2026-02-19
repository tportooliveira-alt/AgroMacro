"""Automated error detection for AgroMacro app using Playwright"""
from playwright.sync_api import sync_playwright
import json

def test_all_views():
    errors = []
    warnings = []
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        
        # Capture console errors
        def on_console(msg):
            if msg.type == 'error':
                errors.append(f"[{msg.type}] {msg.text}")
            elif msg.type == 'warning':
                warnings.append(f"[{msg.type}] {msg.text}")
        
        page.on('console', on_console)
        
        # Capture page errors (uncaught exceptions)
        def on_pageerror(err):
            errors.append(f"[UNCAUGHT] {err.message}")
        
        page.on('pageerror', on_pageerror)
        
        # Navigate to app
        print("=== Opening AgroMacro ===")
        page.goto('http://localhost:8080')
        page.wait_for_load_state('networkidle')
        page.wait_for_timeout(2000)
        
        # Get all view IDs
        views = page.evaluate('''() => {
            return Array.from(document.querySelectorAll('[id^="view-"]')).map(el => ({
                id: el.id,
                pageId: el.id.replace('view-', '')
            }));
        }''')
        
        print(f"\n=== Found {len(views)} views ===")
        for v in views:
            print(f"  - {v['id']}")
        
        # Navigate to each view and check for errors
        print("\n=== Testing each view ===")
        for v in views:
            page_id = v['pageId']
            before_errors = len(errors)
            
            try:
                page.evaluate(f"window.app.navigate('{page_id}')")
                page.wait_for_timeout(500)
            except Exception as e:
                errors.append(f"[NAVIGATE] Failed to navigate to {page_id}: {str(e)}")
            
            new_errors = len(errors) - before_errors
            status = f"❌ {new_errors} errors" if new_errors > 0 else "✅ OK"
            print(f"  {page_id}: {status}")
        
        # Test specific functions that might fail
        print("\n=== Testing Critical Functions ===")
        
        # Test 1: abrirDetalhes
        before = len(errors)
        try:
            result = page.evaluate('''() => {
                try {
                    if (typeof window.lotes.abrirDetalhes === 'function') return 'EXISTS';
                    return 'MISSING';
                } catch(e) {
                    return 'ERROR: ' + e.message;
                }
            }''')
            print(f"  lotes.abrirDetalhes: {result}")
        except Exception as e:
            print(f"  lotes.abrirDetalhes: ERROR - {e}")
        
        # Test 2: Check lot data
        try:
            lots = page.evaluate('''() => {
                if (!window.lotes) return 'lotes module missing';
                var l = window.lotes.getLotes();
                return l.map(function(lot) {
                    return {nome: lot.nome, qtd: lot.qtdAnimais, pasto: lot.pasto || 'SEM PASTO'};
                });
            }''')
            print(f"\n  Active Lots: {json.dumps(lots, indent=2, ensure_ascii=False)}")
        except Exception as e:
            print(f"  getLotes: ERROR - {e}")
        
        # Test 3: Check data events count by type
        try:
            event_counts = page.evaluate('''() => {
                if (!window.data) return 'data module missing';
                var counts = {};
                window.data.events.forEach(function(ev) {
                    counts[ev.type] = (counts[ev.type] || 0) + 1;
                });
                return counts;
            }''')
            print(f"\n  Event Counts: {json.dumps(event_counts, indent=2)}")
        except Exception as e:
            print(f"  Event counts: ERROR - {e}")
        
        # Test 4: Check pastos from FAZENDA_PASTOS
        try:
            pastos_info = page.evaluate('''() => {
                var result = {fazendaPastos: 0, pastosModule: 0, lotesComPasto: 0};
                if (window.FAZENDA_PASTOS) result.fazendaPastos = window.FAZENDA_PASTOS.length;
                if (window.pastos && window.pastos.getPastos) result.pastosModule = window.pastos.getPastos().length;
                if (window.lotes) {
                    var lotes = window.lotes.getLotes();
                    lotes.forEach(function(l) { if (l.pasto) result.lotesComPasto++; });
                }
                return result;
            }''')
            print(f"\n  Pastos Info: {json.dumps(pastos_info, indent=2)}")
        except Exception as e:
            print(f"  Pastos info: ERROR - {e}")
        
        # Test 5: Check if clicking lot card causes error
        try:
            page.evaluate("window.app.navigate('lotes')")
            page.wait_for_timeout(500)
            before = len(errors)
            page.evaluate('''() => {
                var cards = document.querySelectorAll('.lot-card');
                if (cards.length > 0) cards[0].click();
            }''')
            page.wait_for_timeout(500)
            new_errors = len(errors) - before
            print(f"\n  Click lot card: {'❌ ' + str(new_errors) + ' errors' if new_errors > 0 else '✅ OK'}")
            if new_errors > 0:
                for e in errors[before:]:
                    print(f"    → {e}")
        except Exception as e:
            print(f"  Click lot card: ERROR - {e}")
        
        # Test 6: Check all undefined function references
        try:
            undefined_funcs = page.evaluate('''() => {
                var checks = [
                    ['window.lotes.abrirDetalhes', typeof window.lotes?.abrirDetalhes],
                    ['window.nutricao.abrirLeitura', typeof window.nutricao?.abrirLeitura],
                    ['window.rebanhoOps.abrirTransferencia', typeof window.rebanhoOps?.abrirTransferencia],
                    ['window.rebanhoOps.abrirMortalidade', typeof window.rebanhoOps?.abrirMortalidade],
                    ['window.rebanhoOps.abrirTimeline', typeof window.rebanhoOps?.abrirTimeline],
                    ['window.fotos.badge', typeof window.fotos?.badge],
                    ['window.indicadores.getLoteKPIs', typeof window.indicadores?.getLoteKPIs],
                    ['window.mapa.filterMap', typeof window.mapa?.filterMap],
                    ['window.balanca.abrirModoPesagem', typeof window.balanca?.abrirModoPesagem],
                    ['window.calendario.verificarCarenciaVenda', typeof window.calendario?.verificarCarenciaVenda],
                ];
                return checks.filter(function(c) { return c[1] !== 'function'; });
            }''')
            print(f"\n  Missing Functions:")
            if len(undefined_funcs) == 0:
                print("    ✅ All functions exist")
            else:
                for f in undefined_funcs:
                    print(f"    ❌ {f[0]} = {f[1]}")
        except Exception as e:
            print(f"  Function check: ERROR - {e}")
        
        # Summary
        print(f"\n{'='*50}")
        print(f"=== SUMMARY ===")
        print(f"  Total Errors: {len(errors)}")
        print(f"  Total Warnings: {len(warnings)}")
        if errors:
            print(f"\n  All Errors:")
            for e in errors:
                print(f"    ❌ {e}")
        
        browser.close()

if __name__ == '__main__':
    test_all_views()
