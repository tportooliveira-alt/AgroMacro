"""
AgroMacro — Teste Completo Automatizado
Testa: navegação, botões, console errors, links, funcionalidade
"""
from playwright.sync_api import sync_playwright
import json, time

RESULTS = {
    'console_errors': [],
    'page_errors': [],
    'buttons_tested': 0,
    'tabs_tested': 0,
    'issues': [],
    'screenshots': []
}

def log_issue(area, desc):
    RESULTS['issues'].append({'area': area, 'issue': desc})
    print(f"  ❌ [{area}] {desc}")

def log_ok(msg):
    print(f"  ✅ {msg}")

def click_if_visible(el, area, label):
    if not el:
        log_issue(area, f'"{label}" não encontrado')
        return False
    if not el.is_visible():
        log_issue(area, f'"{label}" está invisível')
        return False
    try:
        el.click()
        return True
    except Exception as e:
        log_issue(area, f'"{label}" falhou: {str(e)[:80]}')
        return False

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page = browser.new_page(viewport={'width': 414, 'height': 896})  # iPhone size

    # Capture console errors
    page.on('console', lambda msg: RESULTS['console_errors'].append({
        'type': msg.type, 'text': msg.text, 'location': str(msg.location)
    }) if msg.type in ['error', 'warning'] else None)

    page.on('pageerror', lambda err: RESULTS['page_errors'].append(str(err)))

    print("\n" + "="*60)
    print("🐂 AgroMacro — TESTE COMPLETO")
    print("="*60)

    # 1. Load app
    print("\n📱 1. CARREGANDO APP...")
    page.goto('http://localhost:8080', wait_until='domcontentloaded', timeout=60000)
    page.wait_for_timeout(2000)
    page.evaluate('''() => {
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
        if (onboarding) {
            onboarding.style.display = 'none';
            onboarding.style.pointerEvents = 'none';
            onboarding.remove();
        }
        document.querySelectorAll('.ux-onboarding').forEach(function (el) {
            el.style.display = 'none';
            el.style.pointerEvents = 'none';
            el.remove();
        });
    }''')
    page.wait_for_timeout(2000)
    page.screenshot(path='/tmp/01_home.png', full_page=True)
    log_ok("App carregou com sucesso")

    # 2. Check Home KPIs
    print("\n📊 2. HOME — VERIFICANDO KPIs...")
    kpi_ids = ['total-rebanho', 'total-pastos', 'total-hectares', 'valor-rebanho', 'peso-medio']
    for kid in kpi_ids:
        el = page.query_selector(f'#{kid}')
        if el:
            val = el.inner_text()
            if val == '0' or val == '0.0' or val == '' or val == 'NaN':
                log_issue('Home KPI', f'#{kid} = "{val}" (pode ser bug)')
            else:
                log_ok(f'#{kid} = {val}')
        else:
            # Try alternate selectors
            pass

    # Also check KPI cards by class
    kpi_cards = page.query_selector_all('.kpi-card, .stat-card, .home-kpi, .dash-card')
    print(f"  📋 {len(kpi_cards)} KPI cards encontrados na home")

    # 3. Check bottom navigation tabs
    print("\n🗂️ 3. TESTANDO NAVEGAÇÃO (TABS)...")
    tabs = page.query_selector_all('.tab-btn, .nav-tab, nav button, .bottom-nav button, [data-view]')
    print(f"  📋 {len(tabs)} tabs encontrados")

    for i, tab in enumerate(tabs):
        if not tab.is_visible():
            continue
        try:
            label = tab.inner_text().strip()
            tab.click()
            page.wait_for_timeout(800)
            RESULTS['tabs_tested'] += 1
            page.screenshot(path=f'/tmp/02_tab_{i}_{label[:10].replace(" ", "_")}.png', full_page=True)
            log_ok(f'Tab {i}: "{label}" - clicou OK')
        except Exception as e:
            log_issue('Navegação', f'Tab {i} falhou: {str(e)[:80]}')

    # 4. Go back to home
    print("\n🏠 4. VOLTANDO PARA HOME...")
    home_tab = page.query_selector('[data-view="home"], .tab-btn:first-child, nav button:first-child')
    if home_tab and home_tab.is_visible():
        home_tab.click()
        page.wait_for_timeout(500)

    # 5. Check all buttons in the page
    print("\n🔘 5. VERIFICANDO TODOS OS BOTÕES...")
    all_buttons = page.query_selector_all('button')
    print(f"  📋 {len(all_buttons)} botões totais no DOM")

    # Check for duplicate button text
    button_texts = {}
    for btn in all_buttons:
        try:
            txt = btn.inner_text().strip()
            if txt:
                view = btn.evaluate('el => el.closest("[id]")?.id || "unknown"')
                key = f"{view}::{txt}"
                if key in button_texts:
                    button_texts[key] += 1
                else:
                    button_texts[key] = 1
        except:
            pass

    duplicates = {k: v for k, v in button_texts.items() if v > 1}
    if duplicates:
        for k, v in duplicates.items():
            log_issue('Botões Duplicados', f'"{k}" aparece {v}x')
    else:
        log_ok("Nenhum botão duplicado detectado")

    # 6. Test each major view
    print("\n📋 6. TESTANDO CADA VIEW...")
    views = page.query_selector_all('[id^="view-"]')
    print(f"  📋 {len(views)} views encontradas")
    for v in views:
        vid = v.get_attribute('id')
        print(f"    → {vid}")

    # 7. Test Rebanho section
    print("\n🐂 7. TESTANDO REBANHO...")
    # Click rebanho tab
    rebanho_btn = page.query_selector('[data-view="rebanho"], button:has-text("Rebanho")')
    rebanho_ok = False
    if click_if_visible(rebanho_btn, 'Rebanho', 'tab Rebanho'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/03_rebanho.png', full_page=True)
        # Check sub-tabs/buttons in rebanho
        sub_btns = page.query_selector_all('.view-active button, [id*="rebanho"] button')
        print(f"  📋 {len(sub_btns)} botões no Rebanho")
        rebanho_ok = True

    # 8. Test Pastos section
    print("\n🌿 8. TESTANDO PASTOS...")
    pastos_btn = page.query_selector('[data-view="pastos"], button:has-text("Pastos")')
    if click_if_visible(pastos_btn, 'Pastos', 'tab Pastos'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/04_pastos.png', full_page=True)

    # 9. Test Financeiro
    print("\n💰 9. TESTANDO FINANCEIRO...")
    fin_btn = page.query_selector('[data-view="financeiro"], button:has-text("Financeiro"), button:has-text("Finance")')
    if click_if_visible(fin_btn, 'Financeiro', 'tab Financeiro'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/05_financeiro.png', full_page=True)

    # 10. Test Mais/Menu
    print("\n📋 10. TESTANDO MAIS/MENU...")
    mais_btn = page.query_selector('[data-view="mais"], button:has-text("Mais"), button:has-text("Menu")')
    if click_if_visible(mais_btn, 'Mais', 'tab Mais'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/06_mais.png', full_page=True)
        
        # Check all hub buttons in mais
        hub_btns = page.query_selector_all('.hub-card, .menu-item, .mais-btn')
        print(f"  📋 {len(hub_btns)} itens no menu Mais")

    # 11. Test Mapa
    print("\n🗺️ 11. TESTANDO MAPA...")
    mapa_btn = page.query_selector('[data-view="mapa"], button:has-text("Mapa")')
    if not mapa_btn:
        mapa_btn = page.query_selector('[onclick*="mapa"], [onclick*="Mapa"]')
    if click_if_visible(mapa_btn, 'Mapa', 'botão Mapa'):
        page.wait_for_timeout(2000)
        page.screenshot(path='/tmp/07_mapa.png', full_page=True)
        
        # Check hectares value
        hectares_el = page.query_selector('#dash-total-hectares')
        if hectares_el:
            hval = hectares_el.inner_text()
            if hval == '0' or hval == '0.0' or hval == 'NaN':
                log_issue('Mapa', f'Hectares = "{hval}" (bug confirmado)')
            else:
                log_ok(f'Hectares = {hval}')

    # 12. Test Cabeças (individual cattle)
    print("\n🐄 12. TESTANDO CABEÇAS INDIVIDUAIS...")
    cab_btn = page.query_selector('[data-view="cabecas"], button:has-text("Cabeças"), button:has-text("Individual"), [onclick*="cabecas"]')
    if click_if_visible(cab_btn, 'Cabeças', 'botão Cabeças'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/08_cabecas.png', full_page=True)
        
        # Check form fields
        brinco_input = page.query_selector('#cab-brinco, input[placeholder*="brinco"], input[placeholder*="Brinco"]')
        chip_input = page.query_selector('#cab-chip, input[placeholder*="chip"], input[placeholder*="Chip"], input[placeholder*="RFID"]')
        if brinco_input:
            log_ok("Campo brinco encontrado")
        else:
            log_issue('Cabeças', 'Sem campo brinco/identificação')
        if chip_input:
            log_ok("Campo chip/RFID encontrado")
        else:
            log_issue('Cabeças', 'Sem campo chip/RFID (user pediu cadastro por código/chip)')

    # 13. Test Estoque
    print("\n📦 13. TESTANDO ESTOQUE...")
    est_btn = page.query_selector('[data-view="estoque"], button:has-text("Estoque"), [onclick*="estoque"]')
    if click_if_visible(est_btn, 'Estoque', 'tab Estoque'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/09_estoque.png', full_page=True)

    # 14. Test Calendario
    print("\n📅 14. TESTANDO CALENDÁRIO...")
    cal_btn = page.query_selector('[data-view="calendario"], button:has-text("Calendário"), button:has-text("Calendario"), [onclick*="calendario"]')
    if click_if_visible(cal_btn, 'Calendário', 'tab Calendário'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/10_calendario.png', full_page=True)

    # 15. Test IA button
    print("\n🤖 15. TESTANDO IA CONSULTOR...")
    ia_btn = page.query_selector('#ia-fab, .ia-fab, button:has-text("🤖")')
    if click_if_visible(ia_btn, 'IA', 'botão IA FAB'):
        page.wait_for_timeout(1000)
        page.screenshot(path='/tmp/11_ia.png', full_page=True)
        log_ok("IA FAB button funciona")
        
        # Close modal
        close_btn = page.query_selector('.ia-close, #ia-close, [onclick*="toggle"]')
        if close_btn:
            close_btn.click()
            page.wait_for_timeout(300)

    # 16. Check onclick handlers that reference non-existent functions
    print("\n🔗 16. VERIFICANDO ONCLICKS INVÁLIDOS...")
    onclick_els = page.query_selector_all('[onclick]')
    for el in onclick_els:
        try:
            handler = el.get_attribute('onclick')
            # Try evaluating if the function exists
            result = page.evaluate(f'''() => {{
                try {{
                    var fn = {handler.split('(')[0]};
                    return fn ? "ok" : "missing";
                }} catch(e) {{ return "error: " + e.message; }}
            }}''')
            if 'error' in str(result) or 'missing' in str(result):
                log_issue('onclick', f'Handler inválido: {handler[:60]}')
        except:
            pass

    # 17. Check for hidden views with content
    print("\n👁️ 17. VERIFICANDO VIEWS ESCONDIDAS...")
    hidden_views = page.evaluate('''() => {
        var views = document.querySelectorAll('[id^="view-"]');
        var result = [];
        views.forEach(v => {
            var btns = v.querySelectorAll('button');
            var inputs = v.querySelectorAll('input, select, textarea');
            result.push({
                id: v.id,
                visible: v.style.display !== 'none' && !v.classList.contains('hidden'),
                buttons: btns.length,
                inputs: inputs.length
            });
        });
        return result;
    }''')
    for v in hidden_views:
        print(f"    {v['id']}: {'👁️' if v['visible'] else '🙈'} | {v['buttons']} btns | {v['inputs']} inputs")

    # 18. Check all script tags are loaded
    print("\n📜 18. VERIFICANDO SCRIPTS CARREGADOS...")
    scripts = page.evaluate('''() => {
        var scripts = document.querySelectorAll('script[src]');
        return Array.from(scripts).map(s => s.src);
    }''')
    print(f"  📋 {len(scripts)} scripts carregados")
    for s in scripts:
        print(f"    → {s.split('/')[-1]}")

    # 19. Check for broken images/icons
    print("\n🖼️ 19. VERIFICANDO IMAGENS/ÍCONES...")
    broken_imgs = page.evaluate('''() => {
        var imgs = document.querySelectorAll('img');
        var broken = [];
        imgs.forEach(img => {
            if (!img.complete || img.naturalWidth === 0) {
                broken.push(img.src);
            }
        });
        return broken;
    }''')
    if broken_imgs:
        for img in broken_imgs:
            log_issue('Imagem', f'Imagem quebrada: {img}')
    else:
        log_ok(f"Nenhuma imagem quebrada")

    # 20. Final summary
    print("\n" + "="*60)
    print("📊 RESULTADO FINAL")
    print("="*60)
    print(f"\n  Tabs testados: {RESULTS['tabs_tested']}")
    print(f"  Console errors: {len(RESULTS['console_errors'])}")
    print(f"  Page errors: {len(RESULTS['page_errors'])}")
    print(f"  Issues encontrados: {len(RESULTS['issues'])}")

    if RESULTS['console_errors']:
        print("\n  🔴 CONSOLE ERRORS:")
        for err in RESULTS['console_errors'][:20]:
            print(f"    [{err['type']}] {err['text'][:120]}")

    if RESULTS['page_errors']:
        print("\n  🔴 PAGE ERRORS:")
        for err in RESULTS['page_errors'][:10]:
            print(f"    {err[:120]}")

    if RESULTS['issues']:
        print("\n  🔴 ISSUES:")
        for iss in RESULTS['issues']:
            print(f"    [{iss['area']}] {iss['issue']}")

    # Save results
    with open('/tmp/agromacro_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(RESULTS, f, indent=2, ensure_ascii=False)

    print(f"\n📸 Screenshots salvas em /tmp/01_home.png ... 11_ia.png")
    print("✅ Teste completo!")

    browser.close()
