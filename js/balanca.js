// ====== MÓDULO: BALANÇA & RFID (PESAGEM RÁPIDA) ======
window.balanca = {
    init: function () {
        console.log('Balança Module Ready');
    },

    abrirModoPesagem: function () {
        // Remove existing modal if any
        if (document.getElementById('modal-balanca')) {
            document.getElementById('modal-balanca').remove();
        }

        var html = '<div class="modal-overlay" id="modal-balanca" style="background:black; z-index:9999;">'
            + '<div style="height:100%; display:flex; flex-direction:column; padding:20px; color:white;">'

            // Header
            + '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">'
            + '<h2 style="margin:0; font-size:24px;">⚖️ Modo Pesagem</h2>'
            + '<button onclick="window.balanca.fechar()" style="background:none; border:none; color:white; font-size:32px;">✕</button>'
            + '</div>'

            // Peso Display (Big) with Bluetooth Indicator
            + '<div style="background:#111; border:2px solid #333; border-radius:16px; padding:30px; text-align:center; margin-bottom:20px; position:relative;">'
            + '<div style="font-size:14px; color:#888; text-transform:uppercase; letter-spacing:1px; margin-bottom:10px;">PESO ATUAL</div>'
            + '<div id="balanca-display" style="font-size:72px; font-weight:bold; font-family:monospace; color:#059669;">0.0</div>'
            + '<div style="font-size:24px; color:#666;">kg</div>'
            + '<button id="btn-bluetooth" onclick="window.balanca.conectarBluetooth()" style="position:absolute; top:10px; right:10px; background:#333; border:1px solid #555; color:white; padding:6px 12px; border-radius:20px; font-size:12px; cursor:pointer;">🔵 Conectar Bluetooth</button>'
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
            // Se já tiver peso lido via bluetooth, usa ele. Senão simula.
            var novoPeso = window.balanca.pesoLido || (pesoAtual + (Math.random() * 15));
            // Ensure proper simulation if no bluetooth
            if (!window.balanca.device) {
                window.balanca.pesoLido = parseFloat(novoPeso.toFixed(1));
            }

            // Update UI
            document.getElementById('animal-card').style.display = 'block';
            document.getElementById('animal-brinco').innerText = animal.brinco + (animal.nome ? ' (' + animal.nome + ')' : '');
            document.getElementById('animal-lote').innerText = animal.lote;
            document.getElementById('animal-ult-peso').innerText = pesoAtual.toFixed(1) + ' kg';
            document.getElementById('animal-ganho').innerText = '+' + (novoPeso - pesoAtual).toFixed(1) + ' kg';

            // Animate weight display if NOT connected to bluetooth
            if (!window.balanca.device) {
                var display = document.getElementById('balanca-display');
                display.innerText = window.balanca.pesoLido.toFixed(1);
                document.getElementById('btn-salvar-peso').disabled = false;
            }

            btn.innerHTML = originalText;
            btn.disabled = false;

        }, 1500); // 1.5s delay simulation
    },

    // ====== BLUETOOTH SUPPORT ======
    device: null,
    server: null,
    intervaloLeitura: null,

    conectarBluetooth: function () {
        if (!navigator.bluetooth) {
            alert('Seu navegador não suporta Web Bluetooth API (Use Chrome/Edge).');
            return;
        }

        navigator.bluetooth.requestDevice({
            acceptAllDevices: true,
            optionalServices: ['battery_service', '00001800-0000-1000-8000-00805f9b34fb']
        })
            .then(device => {
                console.log('Dispositivo selecionado:', device.name);
                window.balanca.device = device;
                return device.gatt.connect();
            })
            .then(server => {
                window.balanca.server = server;
                window.app.showToast('✅ Conectado: ' + (window.balanca.device.name || 'Dispositivo'));
                var btn = document.getElementById('btn-bluetooth');
                if (btn) {
                    btn.innerHTML = '🔵 Conectado';
                    btn.style.background = '#2563EB';
                    btn.style.borderColor = '#2563EB';
                }

                window.balanca.iniciarLeituraContínua();
            })
            .catch(error => {
                console.error('Erro Bluetooth:', error);
                alert('Erro na conexão: ' + error);
            });
    },

    iniciarLeituraContínua: function () {
        if (window.balanca.intervaloLeitura) clearInterval(window.balanca.intervaloLeitura);

        window.balanca.intervaloLeitura = setInterval(function () {
            if (window.balanca.server && window.balanca.server.connected) {
                // Simulação de leitura da balança (hardware real requereria ler Characteristic value)
                var pesoBase = 450 + Math.random() * 50;
                var ruido = (Math.random() - 0.5) * 0.5;
                var leitura = pesoBase + ruido;

                var display = document.getElementById('balanca-display');
                if (display) {
                    display.innerText = leitura.toFixed(1);

                    // Estabilização simulada
                    if (Math.abs(ruido) < 0.1) {
                        display.style.color = '#059669'; // Verde
                        window.balanca.pesoLido = parseFloat(leitura.toFixed(1));
                        var btnSalvar = document.getElementById('btn-salvar-peso');
                        if (btnSalvar) btnSalvar.disabled = false;
                    } else {
                        display.style.color = '#D97706'; // Laranja
                        // Disable saving if unstable
                        // var btnSalvar = document.getElementById('btn-salvar-peso');
                        // if (btnSalvar) btnSalvar.disabled = true;
                    }
                }
            }
        }, 500);
    },

    salvar: function () {
        if (!this.animalAtual && !this.pesoLido) {
            var brinco = prompt("Informe o brinco para salvar este peso:");
            if (brinco) {
                this.animalAtual = { brinco: brinco, lote: 'Avulso' };
            } else {
                return;
            }
        }

        if (!this.pesoLido) return;

        var event = {
            type: 'PESAGEM',
            brinco: this.animalAtual ? this.animalAtual.brinco : 'Desconhecido',
            peso: this.pesoLido,
            lote: this.animalAtual ? this.animalAtual.lote : 'Avulso',
            via: window.balanca.device ? 'BLUETOOTH' : 'MANUAL',
            date: new Date().toISOString()
        };

        window.data.saveEvent(event);
        window.app.showToast('✅ Peso salvo: ' + this.pesoLido.toFixed(1) + ' kg');

        // Reset Logic
        this.animalAtual = null;
        this.pesoLido = null;
        document.getElementById('animal-card').style.display = 'none';

        // If bluetooth, keep reading but reset display color optionally
        if (!window.balanca.device) {
            document.getElementById('balanca-display').innerText = '0.0';
            document.getElementById('balanca-display').style.color = '#059669';
        }

        document.getElementById('btn-salvar-peso').disabled = true;
    },

    fechar: function () {
        if (this.device && this.device.gatt.connected) {
            this.device.gatt.disconnect();
        }
        if (window.balanca.intervaloLeitura) clearInterval(window.balanca.intervaloLeitura);
        var el = document.getElementById('modal-balanca');
        if (el) el.remove();
    }
};
