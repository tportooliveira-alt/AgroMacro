// ====== UX HELPERS — Usabilidade para qualquer pessoa usar sem problemas ======
window.uxHelpers = {

    ONBOARDING_KEY: 'agromacro_onboarding_done',
    TOUR_KEY: 'agromacro_tour_step',

    init: function () {
        this._addEmptyStates();
        this._addFormHelpers();
        this._addConfirmDialogs();

        // Tutorial no primeiro uso
        if (!localStorage.getItem(this.ONBOARDING_KEY)) {
            setTimeout(function () {
                window.uxHelpers.showOnboarding();
            }, 800);
        }

        console.log('UX Helpers initialized');
    },

    // ══════════════════════════════════════════════════════
    // 1) ONBOARDING — Tutorial de primeiro uso
    // ══════════════════════════════════════════════════════
    showOnboarding: function () {
        var overlay = document.createElement('div');
        overlay.id = 'ux-onboarding';
        overlay.className = 'ux-onboarding';

        var steps = [
            {
                icon: '🐄',
                title: 'Bem-vindo ao AgroMacro!',
                text: 'O app mais completo para gestão da sua fazenda. Vamos te guiar nos primeiros passos!'
            },
            {
                icon: '📋',
                title: '1. Cadastre seus Pastos',
                text: 'Comece pela aba Rebanho → Pastos. Cadastre o nome e área (hectares) de cada piquete.'
            },
            {
                icon: '🐂',
                title: '2. Crie os Lotes',
                text: 'Em Rebanho → Lotes, crie lotes como "Garrotes", "Vacas Cria". Informe quantidade e pasto.'
            },
            {
                icon: '💰',
                title: '3. Registre Compras e Vendas',
                text: 'Na aba Financeiro, registre cada entrada e saída de gado. O app faz todas as contas.'
            },
            {
                icon: '📦',
                title: '4. Controle o Estoque',
                text: 'Na aba Operações → Estoque, cadastre vacinas, sal, ração. O app avisa quando acabar!'
            },
            {
                icon: '🤖',
                title: '5. Use o Consultor IA',
                text: 'Toque no botão 🤖 no canto direito. A IA analisa seus dados e dá conselhos de verdade!'
            }
        ];

        var currentStep = 0;

        function render() {
            var s = steps[currentStep];
            var isLast = currentStep === steps.length - 1;
            var progress = '';
            for (var i = 0; i < steps.length; i++) {
                progress += '<span class="ux-dot' + (i === currentStep ? ' active' : '') + '"></span>';
            }

            overlay.innerHTML = '<div class="ux-onboarding-card">'
                + '<div class="ux-onboarding-icon">' + s.icon + '</div>'
                + '<div class="ux-onboarding-title">' + s.title + '</div>'
                + '<div class="ux-onboarding-text">' + s.text + '</div>'
                + '<div class="ux-dots">' + progress + '</div>'
                + '<div class="ux-onboarding-actions">'
                + (currentStep > 0 ? '<button class="ux-btn-secondary" id="ux-prev">← Anterior</button>' : '<div></div>')
                + '<button class="ux-btn-primary" id="ux-next">' + (isLast ? '✅ Começar!' : 'Próximo →') + '</button>'
                + '</div>'
                + '<button class="ux-skip" id="ux-skip">Pular tutorial</button>'
                + '</div>';

            var nextBtn = document.getElementById('ux-next');
            var prevBtn = document.getElementById('ux-prev');
            var skipBtn = document.getElementById('ux-skip');

            if (nextBtn) nextBtn.onclick = function () {
                if (isLast) {
                    finish();
                } else {
                    currentStep++;
                    render();
                }
            };
            if (prevBtn) prevBtn.onclick = function () {
                currentStep--;
                render();
            };
            if (skipBtn) skipBtn.onclick = finish;
        }

        function finish() {
            localStorage.setItem(window.uxHelpers.ONBOARDING_KEY, 'true');
            overlay.classList.add('ux-fadeout');
            setTimeout(function () { overlay.remove(); }, 300);
        }

        document.body.appendChild(overlay);
        render();
    },

    // ══════════════════════════════════════════════════════
    // 2) EMPTY STATES — Telas vazias com instruções claras
    // ══════════════════════════════════════════════════════
    _addEmptyStates: function () {
        // Observar mudanças nas listas para mostrar empty states
        var self = this;
        var observer = new MutationObserver(function () {
            self._checkEmptyLists();
        });

        // Observar o container principal
        var container = document.getElementById('app-container');
        if (container) {
            observer.observe(container, { childList: true, subtree: true, attributes: true });
        }

        // Check inicial
        setTimeout(function () { self._checkEmptyLists(); }, 1000);
    },

    _checkEmptyLists: function () {
        var emptyConfigs = [
            { listId: 'lotes-list', icon: '🐂', msg: 'Nenhum lote cadastrado', action: 'Toque no formulário acima para criar seu primeiro lote' },
            { listId: 'pastos-list', icon: '🌿', msg: 'Nenhum pasto cadastrado', action: 'Preencha nome e hectares para adicionar um pasto' },
            { listId: 'estoque-list', icon: '📦', msg: 'Estoque vazio', action: 'Cadastre vacinas, sal, ração e outros insumos' },
            { listId: 'manejo-history', icon: '💉', msg: 'Nenhum manejo registrado', action: 'Registre vacinações, vermífugos e tratamentos' },
            { listId: 'obras-list', icon: '🔨', msg: 'Nenhuma obra registrada', action: 'Registre reformas de cerca, curral e melhorias' },
            { listId: 'funcionarios-list', icon: '👷', msg: 'Nenhum funcionário cadastrado', action: 'Adicione peões e funcionários da fazenda' },
            { listId: 'contas-list', icon: '💰', msg: 'Nenhuma conta registrada', action: 'Registre contas a pagar para controle financeiro' },
            { listId: 'cabecas-list', icon: '🏷️', msg: 'Nenhum animal individual', action: 'Cadastre animais com brinco para rastreio individual' }
        ];

        emptyConfigs.forEach(function (cfg) {
            var list = document.getElementById(cfg.listId);
            if (!list) return;

            // Remover empty state anterior se existir
            var existingEmpty = list.parentNode.querySelector('.ux-empty-state');

            if (list.children.length === 0 || (list.innerHTML.trim() === '')) {
                if (!existingEmpty) {
                    var empty = document.createElement('div');
                    empty.className = 'ux-empty-state';
                    empty.innerHTML = '<div class="ux-empty-icon">' + cfg.icon + '</div>'
                        + '<div class="ux-empty-msg">' + cfg.msg + '</div>'
                        + '<div class="ux-empty-action">' + cfg.action + '</div>';
                    list.parentNode.insertBefore(empty, list.nextSibling);
                }
            } else {
                if (existingEmpty) existingEmpty.remove();
            }
        });
    },

    // ══════════════════════════════════════════════════════
    // 3) FORM HELPERS — Auto-preenchimento e validação visual
    // ══════════════════════════════════════════════════════
    _addFormHelpers: function () {
        // Auto-preencher data de hoje em todos os campos date vazios
        document.querySelectorAll('input[type="date"]').forEach(function (input) {
            if (!input.value) {
                input.value = new Date().toISOString().split('T')[0];
            }
        });

        // Validação visual em tempo real
        document.querySelectorAll('.card-form input[required], .card-form select[required]').forEach(function (input) {
            input.addEventListener('blur', function () {
                if (!this.value) {
                    this.style.borderColor = '#EF4444';
                    // Adicionar mensagem de ajuda
                    var help = this.parentNode.querySelector('.ux-field-help');
                    if (!help) {
                        help = document.createElement('div');
                        help.className = 'ux-field-help';
                        help.textContent = 'Campo obrigatório';
                        this.parentNode.appendChild(help);
                    }
                } else {
                    this.style.borderColor = '';
                    var help = this.parentNode.querySelector('.ux-field-help');
                    if (help) help.remove();
                }
            });

            input.addEventListener('input', function () {
                if (this.value) {
                    this.style.borderColor = '#10B981';
                    var help = this.parentNode.querySelector('.ux-field-help');
                    if (help) help.remove();
                    // Clear success color after 1s
                    var el = this;
                    setTimeout(function () { el.style.borderColor = ''; }, 1000);
                }
            });
        });

        // Adicionar feedback de sucesso nos forms
        document.querySelectorAll('.card-form').forEach(function (form) {
            form.addEventListener('submit', function () {
                // Sacode o botão de submit para confirmar visualmente
                var btn = form.querySelector('.submit-btn');
                if (btn) {
                    btn.classList.add('ux-btn-success');
                    setTimeout(function () { btn.classList.remove('ux-btn-success'); }, 1500);
                }
            });
        });
    },

    // ══════════════════════════════════════════════════════
    // 4) CONFIRMAÇÃO — Prevenir acidentes
    // ══════════════════════════════════════════════════════
    _addConfirmDialogs: function () {
        // Interceptar todos os botões de estorno/exclusão
        document.addEventListener('click', function (e) {
            var btn = e.target.closest('[data-confirm]');
            if (!btn) return;

            e.preventDefault();
            e.stopPropagation();

            var msg = btn.getAttribute('data-confirm') || 'Tem certeza?';
            window.uxHelpers.showConfirm(msg, function () {
                btn.removeAttribute('data-confirm');
                btn.click();
                btn.setAttribute('data-confirm', msg);
            });
        });
    },

    showConfirm: function (message, onConfirm) {
        var overlay = document.createElement('div');
        overlay.className = 'ux-confirm-overlay';
        overlay.innerHTML = '<div class="ux-confirm-card">'
            + '<div class="ux-confirm-icon">⚠️</div>'
            + '<div class="ux-confirm-msg">' + message + '</div>'
            + '<div class="ux-confirm-actions">'
            + '<button class="ux-btn-secondary" id="ux-cancel">Cancelar</button>'
            + '<button class="ux-btn-primary ux-btn-danger" id="ux-confirm">Confirmar</button>'
            + '</div>'
            + '</div>';

        document.body.appendChild(overlay);

        document.getElementById('ux-confirm').onclick = function () {
            overlay.remove();
            if (onConfirm) onConfirm();
        };
        document.getElementById('ux-cancel').onclick = function () {
            overlay.remove();
        };
        overlay.onclick = function (e) {
            if (e.target === overlay) overlay.remove();
        };
    },

    // ══════════════════════════════════════════════════════
    // 5) ACESSIBILIDADE — Touch targets + feedback háptico
    // ══════════════════════════════════════════════════════
    hapticFeedback: function () {
        if (navigator.vibrate) navigator.vibrate(10);
    },

    // Resetar tutorial
    resetOnboarding: function () {
        localStorage.removeItem(this.ONBOARDING_KEY);
        window.app.showToast('Tutorial resetado — recarregue o app', 'info');
    }
};
