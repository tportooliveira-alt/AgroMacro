// ====== MÓDULO: BLOCKCHAIN (SAFE BEEF) ======
// Rastreabilidade Imutável do Pasto ao Prato
window.safebeef = {
    init: function () {
        console.log('Blockchain Module Ready');
    },

    gerarHash: function (dados) {
        // Simulação de hash SHA-256
        var str = JSON.stringify(dados) + new Date().toISOString();
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            var char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return '0x' + Math.abs(hash).toString(16) + Math.random().toString(36).substring(2, 15);
    },

    gerarPassaporte: function (brinco) {
        // Busca histórico do animal
        var eventos = window.data.events.filter(function (ev) {
            return (ev.brinco === brinco || ev.lote === window.rebanhoOps.getLoteDe(brinco));
        });

        var html = '<div class="modal-overlay" id="modal-blockchain">'
            + '<div class="modal-content" style="max-width:400px; background:#0F172A; color:white; border:1px solid #334155;">'
            + '<div class="modal-header" style="border-bottom:1px solid #334155;">'
            + '<h3 style="color:#0EA5E9;">⛓️ SafeBeef Blockchain</h3>'
            + '<button onclick="window.safebeef.fechar()" class="modal-close" style="color:white;">✕</button></div>'
            + '<div class="modal-body">'

            // QR Code Mock
            + '<div style="text-align:center; margin-bottom:20px; padding:20px; background:white; border-radius:12px;">'
            + '<img src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=SafeBeef-' + brinco + '" alt="QR Code" style="width:150px; height:150px;">'
            + '<div style="color:#333; font-weight:bold; margin-top:10px;">' + brinco + '</div>'
            + '</div>'

            // Timeline
            + '<div style="max-height:300px; overflow-y:auto; padding-right:5px;">';

        if (eventos.length === 0) {
            html += '<div style="text-align:center; color:#64748B;">Nenhum registro encontrado na chain.</div>';
        } else {
            eventos.reverse().forEach(function (ev) {
                var hash = window.safebeef.gerarHash(ev);
                html += '<div style="position:relative; padding-left:20px; margin-bottom:15px; border-left:2px solid #334155;">'
                    + '<div style="position:absolute; left:-6px; top:0; width:10px; height:10px; background:#0EA5E9; border-radius:50%;"></div>'
                    + '<div style="font-size:12px; font-weight:bold; color:#E2E8F0;">' + ev.type + '</div>'
                    + '<div style="font-size:10px; color:#94A3B8;">' + (ev.date || 'Data N/A').split('T')[0] + '</div>'
                    + '<div style="font-size:9px; font-family:monospace; color:#475569; margin-top:2px;">Hash: ' + hash.substring(0, 16) + '...</div>'
                    + '</div>';
            });
        }

        html += '</div>' // Timeline
            + '<div style="margin-top:20px; text-align:center;">'
            + '<button class="submit-btn" onclick="alert(\'Link copiado!\')" style="background:#0EA5E9; width:100%;">🔗 Compartilhar Link Público</button>'
            + '</div>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    fechar: function () {
        document.getElementById('modal-blockchain').remove();
    }
};
