// ====== MÓDULO: BALANÇA & RFID (PESAGEM RÁPIDA) ======
window.balanca = {
    init: function () {
        console.log('Balança Module Ready');
    },

    abrirModoPesagem: function () {
        var html = '<div class="modal-overlay" id="modal-balanca" style="background:black; z-index:9999;">'
            + '<div style="height:100%; display:flex; flex-direction:column; padding:20px; color:white;">'

            // Header
            + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">'
            + '<h2 style="margin:0; font-size:24px;">⚖️ Modo Pesagem</h2>'
            + '<button onclick="window.balanca.fechar()" style="background:none; border:none; color:white; font-size:32px;">✕</button>'
            + '</div>'

            // Peso Display (Big)
            + '<div style="background:#111; border:2px solid #333; border-radius:16px; padding:30px; text-align:center; margin-bottom:20px;">'
            + '<div style="font-size:14px; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">PESO ATUAL</div>'
            + '<div id="balanca-display" style="font-size:72px; font-weight:bold; font-family:monospace; color:#059669;">0.0</div>'
            + '<div style="font-size:24px; color:#666;">kg</div>'
            + '</div>'

            // Animal Card (Initially hidden)
            + '<div id="animal-card" style="display:none; background:#222; border-radius:12px; padding:16px; margin-bottom:20px;">'
            + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">'
            + '<div style="font-size:20px; font-weight:bold;">🐂 <span id="animal-brinco"></span></div>'
            + '<div class="badge" style="background:#2563EB; color:white;" id="animal-lote"></div>'
            + '</div>'
            + '<div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; font-size:14px; color:#AAA;">'
            + '<div>Últ. Peso: <span id="animal-ult-peso" style="color:white;"></span></div>'
            + '<div>Ganho: <span id="animal-ganho" style="color:#10B981;"></span></div>'
            + '</div>'
            + '</div>'

            // Actions
            + '<div style="margin-top:auto; display:grid; grid-template-columns:1fr 1fr; gap:12px;">'
            + '<button onclick="window.balanca.lerRFID()" class="submit-btn" style="background:#2563EB; font-size:18px; padding:20px;">📡 Ler RFID</button>'
            + '<button id="btn-salvar-peso" onclick="window.balanca.salvar()" class="submit-btn" style="background:#059669; font-size:18px; padding:20px;" disabled>💾 Salvar</button>'
            + '</div>'

            + '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    lerRFID: function () {
        // Simulação: Busca um animal aleatório
        var animais = window.cabecas ? window.cabecas.getAll() : [];
        if (animais.length === 0) {
            alert("Nenhum animal cadastrado para simular leitura.");
            return;
        }

        var btn = event.target;
        var originalText = btn.innerHTML;
        btn.innerHTML = "📡 Buscando...";
        btn.disabled = true;

        setTimeout(function () {
            var animal = animais[Math.floor(Math.random() * animais.length)];
            window.balanca.animalAtual = animal;

            // Simular peso (peso atual + ganho aleatório 0-15kg)
            var pesoAtual = animal.pesoAtual || 300;
            var novoPeso = pesoAtual + (Math.random() * 15);
            window.balanca.pesoLido = novoPeso;

            // Update UI
            document.getElementById('animal-card').style.display = 'block';
            document.getElementById('animal-brinco').innerText = animal.brinco + (animal.nome ? ' (' + animal.nome + ')' : '');
            document.getElementById('animal-lote').innerText = animal.lote;
            document.getElementById('animal-ult-peso').innerText = pesoAtual.toFixed(1) + ' kg';
            document.getElementById('animal-ganho').innerText = '+' + (novoPeso - pesoAtual).toFixed(1) + ' kg';

            // Animate weight display
            var display = document.getElementById('balanca-display');
            var current = 0;
            var interval = setInterval(function () {
                current += (novoPeso / 20); // 20 steps
                if (current >= novoPeso) {
                    current = novoPeso;
                    clearInterval(interval);
                    document.getElementById('btn-salvar-peso').disabled = false;
                }
                display.innerText = current.toFixed(1);
            }, 50);

            btn.innerHTML = originalText;
            btn.disabled = false;

        }, 1500); // 1.5s delay simulation
    },

    salvar: function () {
        if (!this.animalAtual || !this.pesoLido) return;

        var event = {
            type: 'PESAGEM',
            brinco: this.animalAtual.brinco,
            peso: this.pesoLido,
            lote: this.animalAtual.lote,
            date: new Date().toISOString()
        };

        window.data.saveEvent(event);
        window.app.showToast('✅ Peso salvo: ' + this.pesoLido.toFixed(1) + ' kg');

        // Reset
        this.animalAtual = null;
        this.pesoLido = null;
        document.getElementById('animal-card').style.display = 'none';
        document.getElementById('balanca-display').innerText = '0.0';
        document.getElementById('btn-salvar-peso').disabled = true;
    },

    fechar: function () {
        var el = document.getElementById('modal-balanca');
        if (el) el.remove();
    }
};
