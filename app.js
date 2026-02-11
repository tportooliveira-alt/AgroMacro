// ====== APP.JS — AgroMacro Controller ======
window.app = {
    currentPage: 'home',

    // Toast notification system
    showToast: function (msg, type) {
        var toast = document.getElementById('toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'toast-notification';
            toast.style.cssText = 'position:fixed;top:60px;left:50%;transform:translateX(-50%);z-index:9999;padding:14px 24px;border-radius:12px;font-size:14px;font-weight:600;color:white;box-shadow:0 4px 20px rgba(0,0,0,0.25);transition:opacity 0.3s,transform 0.3s;max-width:90%;text-align:center;';
            document.body.appendChild(toast);
        }
        var bgColor = type === 'error' ? '#D32F2F' : type === 'warning' ? '#FF8F00' : '#2E7D32';
        toast.style.background = bgColor;
        toast.textContent = msg;
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(-50%) translateY(0)';
        clearTimeout(window._toastTimer);
        window._toastTimer = setTimeout(function () {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(-20px)';
        }, 3000);
    },

    init: function () {
        console.log('AgroMacro v2.0');

        // Data layer first
        if (window.data) window.data.init();

        // Feature modules
        if (window.rebanho) window.rebanho.init();
        if (window.pastos) window.pastos.init();
        if (window.lotes) window.lotes.init();
        if (window.financeiro) window.financeiro.init();
        if (window.estoque) window.estoque.init();
        if (window.manejo) window.manejo.init();
        if (window.obras) window.obras.init();
        if (window.funcionarios) window.funcionarios.init();

        this.navigate('home');
    },

    navigate: function (pageId) {
        // Hide all views
        document.querySelectorAll('.view').forEach(function (el) {
            el.classList.remove('active');
            el.classList.add('hidden');
        });

        // Show target
        var target = document.getElementById('view-' + pageId);
        if (!target) {
            console.error('View not found: view-' + pageId);
            return;
        }

        target.classList.remove('hidden');
        target.classList.add('active');
        this.currentPage = pageId;
        window.scrollTo(0, 0);

        // Update bottom nav active state
        document.querySelectorAll('.bottom-nav .nav-item').forEach(function (btn) {
            btn.classList.remove('active');
        });
        var navMap = { 'home': 'nav-home', 'lotes': 'nav-lotes', 'manejo': 'nav-manejo', 'financeiro': 'nav-financeiro', 'compra': 'nav-financeiro', 'venda': 'nav-financeiro', 'fluxo': 'nav-financeiro', 'balanco': 'nav-financeiro', 'config': 'nav-config' };
        var activeNav = navMap[pageId] || 'nav-home';
        var navEl = document.getElementById(activeNav);
        if (navEl) navEl.classList.add('active');

        // Render data-driven views
        switch (pageId) {
            case 'home':
                this.renderKPIs();
                this.renderAlerts();
                break;
            case 'rebanho':
                if (window.rebanho) window.rebanho.renderList();
                if (window.lotes) {
                    window.lotes.populateSelect('reb-lote');
                    window.lotes.populateSelect('reb-lote-destino');
                }
                break;
            case 'lotes':
                if (window.lotes) window.lotes.renderList();
                this.populatePastosSelect('lote-pasto');
                if (window.estoque) window.estoque.populateLoteNutrition();
                break;
            case 'pastos':
                if (window.pastos) window.pastos.renderList();
                break;
            case 'estoque':
                if (window.estoque) window.estoque.render();
                break;
            case 'fluxo':
                if (window.financeiro) window.financeiro.updateFluxoUI();
                break;
            case 'manejo':
                if (window.manejo) window.manejo.renderHistory();
                if (window.lotes) window.lotes.populateSelect('manejo-lote');
                if (window.estoque) window.estoque.renderMaterialCheckboxes('manejo-materials-list', 'remedios');
                if (window.estoque) window.estoque.populateManejoProducts();
                break;
            case 'compra':
                if (window.lotes) window.lotes.populateSelect('compra-lote');
                break;
            case 'venda':
                if (window.lotes) window.lotes.populateSelect('venda-lote');
                break;
            case 'obras':
                if (window.estoque) window.estoque.renderMaterialCheckboxes('obra-materials-list', 'obras');
                if (window.funcionarios) window.funcionarios.renderWorkersForObra();
                break;
            case 'funcionarios':
                if (window.funcionarios) window.funcionarios.render();
                break;
            case 'balanco':
                if (window.financeiro) window.financeiro.renderBalanco();
                break;
        }
    },

    populatePastosSelect: function (selectId) {
        var select = document.getElementById(selectId);
        if (!select || !window.pastos) return;
        var pastosData = window.pastos.getPastos();
        var html = '<option value="">Selecionar...</option>';
        pastosData.forEach(function (p) {
            html += '<option value="' + p.nome + '">' + p.nome + ' (' + (p.area || 0) + ' ha)</option>';
        });
        select.innerHTML = html;
    },

    renderKPIs: function () {
        var container = document.getElementById('kpi-grid');
        if (!container || !window.data) return;

        var events = window.data.events;

        // Operational KPIs only — no financial values
        var totalAnimais = 0;
        var totalLotes = 0;
        var totalPastos = 0;
        var pesoTotal = 0;
        var pesados = 0;

        events.forEach(function (ev) {
            if (ev.type === 'ANIMAL' && ev.status !== 'VENDIDO') {
                totalAnimais++;
                if (ev.peso) { pesoTotal += ev.peso; pesados++; }
            }
            if (ev.type === 'LOTE' && ev.status === 'ATIVO') totalLotes++;
            if (ev.type === 'PASTO') totalPastos++;
        });

        var pesoMedio = pesados > 0 ? (pesoTotal / pesados).toFixed(0) : '--';

        container.innerHTML = ''
            + '<div class="kpi-card"><div class="kpi-label">Rebanho</div><div class="kpi-value positive">' + totalAnimais + ' cab</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Lotes Ativos</div><div class="kpi-value">' + totalLotes + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Pastos</div><div class="kpi-value">' + totalPastos + '</div></div>'
            + '<div class="kpi-card"><div class="kpi-label">Peso Médio</div><div class="kpi-value">' + pesoMedio + ' kg</div></div>';
    },

    renderAlerts: function () {
        var container = document.getElementById('alerts-list');
        if (!container || !window.data) return;

        var alerts = [];
        var events = window.data.events;

        // Animals without lot
        var semLote = events.filter(function (ev) {
            return ev.type === 'ANIMAL' && ev.status !== 'VENDIDO' && !ev.lote;
        }).length;
        if (semLote > 0) alerts.push('🐄 ' + semLote + ' animais sem lote atribuído.');

        // Pastos em descanso
        var descanso = events.filter(function (ev) {
            return ev.type === 'PASTO' && ev.statusPasto === 'descanso';
        }).length;
        if (descanso > 0) alerts.push('🌾 ' + descanso + ' pastos em descanso.');

        // Pending manejos (vacinations coming up)
        var manejos = events.filter(function (ev) { return ev.type === 'MANEJO'; });
        if (manejos.length === 0) {
            alerts.push('💉 Nenhum manejo registrado. Lembre-se de registrar vacinações.');
        }

        if (alerts.length === 0) {
            alerts.push('✅ Tudo em dia! Nenhum alerta no momento.');
        }

        container.innerHTML = alerts.map(function (msg) {
            return '<div class="alert-item"><span class="alert-icon">⚠️</span><span>' + msg + '</span></div>';
        }).join('');
    },

    resetData: function () {
        if (confirm('Tem certeza que deseja APAGAR todos os dados?\n\nEsta ação não pode ser desfeita.')) {
            if (window.data) {
                window.data.resetAll();
                alert('Dados apagados com sucesso!');
                location.reload();
            }
        }
    }
};

document.addEventListener('DOMContentLoaded', function () {
    window.app.init();
});
