# 🔧 PLANO DE LIMPEZA — AgroMacro CSS & Funcionários

## DIAGNÓSTICO DO CAOS

### 1. **CSS em Conflito** (3 camadas!)
```
┌─────────────────────────────────────────────┐
│ styles.css (light theme — "Campo Vivo")     │ ← Carregado PRIMEIRO
├─────────────────────────────────────────────┤
│ brutalismo-premium.css (dark + !important)  │ ← SOBRESCREVE
├─────────────────────────────────────────────┤
│ <style id="brutalismo-force"> (inline)      │ ← SOBRESCREVE TUDO
└─────────────────────────────────────────────┘
```

**Resultado**: Classe da "Campo Vivo" ignorada. Tema misturado. Sobreposições visuais.

### 2. **Módulos Carregando Corretamente**
✅ 36/36 módulos carregam (incluindo `window.funcionarios`)
✅ NavBar funciona
✅ App.navigate() responde
❌ Visualização de cards em seções está bugada por CSS overlap

### 3. **Funcionários Module Status**
```javascript
window.funcionarios = {
    getAll(),
    getAtivos(), 
    save(),
    inativar(),
    render()  // ← Procura por #funcionarios-list (existe, mas invisível por CSS)
}
```

---

## PLANO DE CONSERTO (PRIORIDADE)

### **FASE 1: CSS CLEANUP** (~15 min) ⏱️

**Task 1.1**: Consolidar em UM único arquivo CSS
- ❌ Deletar `brutalismo-premium.css`
- ❌ Deletar `<style id="brutalismo-force">` do index.html
- ✅ Manter **styles.css** como FONTE ÚNICA
- ✅ Mover variáveis escuro do Brutalismo pro styles.css com novo `:root[data-theme="brutalismo"]`

**Task 1.2**: Limpar styles.css
- Remover CSS duplicado
- Adicionar tema "brutalismo" como opção (não default)
- Manter theme-switching lógica

**Antes:**
```html
<link rel="stylesheet" href="styles.css?v=20260407">
<link rel="stylesheet" href="brutalismo-premium.css?v=20260412">
<style id="brutalismo-force"><!-- CAOS COM !important --></style>
```

**Depois:**
```html
<link rel="stylesheet" href="styles.css?v=20260412"> <!-- ÚNICA FONTE DE VERDADE -->
```

---

### **FASE 2: FIX FUNCIONÁRIOS VISIBILITY** (~10 min) ⏱️

**Task 2.1**: Garantir render no navigate
```javascript
// Em app.js, após criar a view ativa
if (pageName === 'funcionarios' && window.funcionarios?.render) {
    window.funcionarios.render();
}
```

**Task 2.2**: Verificar CSS de visibilidade da seção
- `.view` precisa de `display: block !important` quando `.active`
- Nenhum `visibility: hidden` ou `opacity: 0` no view-funcionarios

**Task 2.3**: Testar navegação
- Clicar "Funcionários" → deve mostrar form + lista vazia
- Adicionar funcionário → deve atualizar lista

---

### **FASE 3: FIX ia-consultor.js ERROR** (~5 min) ⏱️

**Error**:
```
ReferenceError: "suggestions is not defined" at ia-consultor.js:2168
```

**Fix**: 
- Abrir `js/ia-consultor.js` linha 2168
- Procurar por uso de `suggestions` sem inicialização
- Adicionar `suggestions = suggestions || []` ou verificação nula

---

### **FASE 4: IMPLEMENT OFFLINE/ONLINE HYBRID** (~2 hours) 🚀

**Pre-work files READY**:
- `/refatoracao/services/SyncManager.js` ✅ 
- `/refatoracao/services/SyncConfig.js` ✅

**Requirements**:
```
OFFLINE (cached): 
- Dashboard
- Lotes (leitura)
- Histórico de operações
- Cálculos zootecnia

ONLINE (requires sync):
- Firebase Firestore
- Upload de fotos
- IA Analysis (Clara)
- Chat (Boteco)
```

**Integration Steps**:
1. Import SyncManager em app.js
2. Initialize na sequence: Auth → Device → LocalData → SyncManager
3. Add toggle UI: "Modo Offline" button in settings
4. Test sync conflicts via WorkManager

---

## EXECUTION ORDER

```
1️⃣  PHASE 1: CSS Consolidation (CRITICAL)
    ├─ Backup styles.css + brutalismo-premium.css
    ├─ Merge Brutalismo vars into styles.css
    ├─ Remove inline <style>
    └─ Remove brutalismo-premium.css import
    
2️⃣  PHASE 2: Fix Funcionários Visibility (HIGH)
    ├─ Verify render() hook in app.navigate()
    ├─ Check .view.active + .view CSS rules
    └─ Test add/list functionality
    
3️⃣  PHASE 3: Fix ia-consultor.js (MEDIUM)
    ├─ Find line 2168
    ├─ Add null checks on "suggestions"
    └─ Test Clara module loads
    
4️⃣  PHASE 4: Hybrid Offline/Online (NEXT SPRINT)
    ├─ Integrate SyncManager
    ├─ Build M2M conflict resolution
    └─ User test sync scenarios
```

---

## SUCCESS METRICS

✅ **Phase 1**: 
- Only 1 CSS file imported
- No `!important` force override in inline styles
- Theme switcher works (light/dark/brutalismo)

✅ **Phase 2**:
- Funcionários section visible after navigate
- Add form functional
- List renders employees

✅ **Phase 3**:
- Clara module init without errors
- Console clean of ReferenceErrors

✅ **Phase 4**:
- Offline mode toggleable
- Data persists between reconnects
- No data loss on sync

---

## FILES TO MODIFY

### Phase 1
- `index.html` (remove brutalismo link + inline style)
- `styles.css` (add brutalismo theme variables)
- ❌ `brutalismo-premium.css` (delete or archive)

### Phase 2
- `js/app.js` (add render hook on navigate)
- `index.html` (verify view-funcionarios CSS)
- `js/funcionarios.js` (if needed, debug render)

### Phase 3
- `js/ia-consultor.js` (line 2168, null check)

### Phase 4
- `js/app.js` (integrate SyncManager)
- `/refatoracao/services/` (already ready)

---

## NEXT IMMEDIATE ACTION

Ready to START PHASE 1? Yes → consolidate CSS into single functional file
