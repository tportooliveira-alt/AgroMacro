// ====== MÓDULO: FOTOS — Upload de Fotos (Câmera + Galeria) ======
// Permite anexar fotos a animais, lotes, pastos, manejos e obras
// Armazena como base64 no localStorage (data URL comprimida)
window.fotos = {
    MAX_SIZE: 800,      // Max largura/altura em px
    QUALITY: 0.6,       // Qualidade JPEG (0-1)
    STORAGE_KEY: 'agromacro_fotos_v1',
    fotos: {},          // { entityId: [{ id, data, desc, date }] }

    init: function () {
        console.log('Fotos Module Ready');
        this.load();
    },

    load: function () {
        try {
            var raw = localStorage.getItem(this.STORAGE_KEY);
            this.fotos = raw ? JSON.parse(raw) : {};
        } catch (e) {
            console.error('Erro ao carregar fotos:', e);
            this.fotos = {};
        }
    },

    save: function () {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.fotos));
        } catch (e) {
            console.error('Erro ao salvar fotos:', e);
            // Se localStorage estiver cheio, alertar
            if (e.name === 'QuotaExceededError') {
                window.app.showToast('⚠️ Memória cheia! Apague algumas fotos.', 'error');
            }
        }
    },

    // ══ Abrir modal de captura (câmera ou galeria) ══
    abrirCaptura: function (entityId, entityType, entityName) {
        var self = this;
        var html = '<div class="modal-overlay" id="modal-foto">'
            + '<div class="modal-content" style="max-width:380px;">'
            + '<div class="modal-header"><h3>📸 Adicionar Foto</h3>'
            + '<button onclick="window.fotos.fecharModal()" class="modal-close">✕</button></div>'
            + '<div class="modal-body" style="text-align:center;">'
            + '<div style="color:var(--text-2);font-size:13px;margin-bottom:16px;">'
            + (entityName || entityType || 'Item') + '</div>'
            // Input file oculto — aceita imagem da câmera ou galeria
            + '<input type="file" id="foto-input" accept="image/*" capture="environment" '
            + 'style="display:none;" onchange="window.fotos.processarFoto(this, \'' + entityId + '\', \'' + (entityType || '') + '\')">'
            // Botão câmera
            + '<div style="display:flex;gap:12px;justify-content:center;margin-bottom:16px;">'
            + '<button class="submit-btn" style="flex:1;display:flex;align-items:center;justify-content:center;gap:8px;" '
            + 'onclick="document.getElementById(\'foto-input\').setAttribute(\'capture\',\'environment\');document.getElementById(\'foto-input\').click();">'
            + '📷 Câmera</button>'
            + '<button class="submit-btn" style="flex:1;background:var(--bg-2);color:var(--text-0);border:1px solid var(--border-subtle);'
            + 'display:flex;align-items:center;justify-content:center;gap:8px;" '
            + 'onclick="document.getElementById(\'foto-input\').removeAttribute(\'capture\');document.getElementById(\'foto-input\').click();">'
            + '🖼️ Galeria</button>'
            + '</div>'
            // Descrição
            + '<div class="form-group" style="text-align:left;">'
            + '<label>Descrição (opcional)</label>'
            + '<input type="text" id="foto-desc" placeholder="Ex: Lote 1 - entrada"></div>'
            // Preview
            + '<div id="foto-preview" style="display:none;margin:12px 0;border-radius:12px;overflow:hidden;'
            + 'border:2px solid var(--border-subtle);">'
            + '<img id="foto-preview-img" style="width:100%;display:block;">'
            + '</div>'
            + '<button id="foto-save-btn" class="submit-btn" style="display:none;width:100%;background:#059669;" '
            + 'onclick="window.fotos.salvarFoto(\'' + entityId + '\', \'' + (entityType || '') + '\')">💾 Salvar Foto</button>'
            + '</div></div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    // ══ Processar imagem selecionada — redimensionar + comprimir ══
    processarFoto: function (input, entityId, entityType) {
        if (!input.files || !input.files[0]) return;
        var file = input.files[0];
        var self = this;

        var reader = new FileReader();
        reader.onload = function (e) {
            var img = new Image();
            img.onload = function () {
                // Redimensionar
                var w = img.width;
                var h = img.height;
                if (w > self.MAX_SIZE || h > self.MAX_SIZE) {
                    if (w > h) {
                        h = Math.round(h * self.MAX_SIZE / w);
                        w = self.MAX_SIZE;
                    } else {
                        w = Math.round(w * self.MAX_SIZE / h);
                        h = self.MAX_SIZE;
                    }
                }

                // Canvas para comprimir
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);

                // Converter para JPEG comprimido
                var dataUrl = canvas.toDataURL('image/jpeg', self.QUALITY);
                self._pendingData = dataUrl;

                // Mostrar preview
                var preview = document.getElementById('foto-preview');
                var previewImg = document.getElementById('foto-preview-img');
                var saveBtn = document.getElementById('foto-save-btn');
                if (preview && previewImg) {
                    previewImg.src = dataUrl;
                    preview.style.display = 'block';
                    if (saveBtn) saveBtn.style.display = 'block';
                }
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    // ══ Salvar foto processada ══
    salvarFoto: function (entityId, entityType) {
        if (!this._pendingData) return;

        var desc = document.getElementById('foto-desc');
        var foto = {
            id: 'F' + Date.now(),
            data: this._pendingData,
            desc: desc ? desc.value : '',
            date: new Date().toISOString().split('T')[0],
            type: entityType
        };

        if (!this.fotos[entityId]) this.fotos[entityId] = [];
        this.fotos[entityId].push(foto);
        this.save();

        this._pendingData = null;
        this.fecharModal();
        window.app.showToast('📸 Foto salva com sucesso!');
    },

    // ══ Obter fotos de uma entidade ══
    getFotos: function (entityId) {
        return this.fotos[entityId] || [];
    },

    // ══ Remover foto ══
    removerFoto: function (entityId, fotoId) {
        if (!this.fotos[entityId]) return;
        this.fotos[entityId] = this.fotos[entityId].filter(function (f) {
            return f.id !== fotoId;
        });
        if (this.fotos[entityId].length === 0) delete this.fotos[entityId];
        this.save();
        window.app.showToast('🗑️ Foto removida.');
    },

    // ══ Render galeria de fotos de uma entidade ══
    renderGaleria: function (containerId, entityId, entityType, entityName) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var fotos = this.getFotos(entityId);
        var html = '<div style="margin:12px 0;">'
            + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
            + '<div style="font-size:14px;font-weight:700;color:var(--text-0);">📸 Fotos (' + fotos.length + ')</div>'
            + '<button class="btn-sm" style="font-size:12px;" '
            + 'onclick="window.fotos.abrirCaptura(\'' + entityId + '\', \'' + (entityType || '') + '\', \'' + (entityName || '').replace(/'/g, "\\'") + '\')">+ Foto</button>'
            + '</div>';

        if (fotos.length > 0) {
            html += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(100px,1fr));gap:8px;">';
            fotos.forEach(function (f) {
                html += '<div style="position:relative;border-radius:10px;overflow:hidden;border:1px solid var(--border-subtle);'
                    + 'aspect-ratio:1;cursor:pointer;" onclick="window.fotos.abrirViewer(\'' + entityId + '\', \'' + f.id + '\')">'
                    + '<img src="' + f.data + '" style="width:100%;height:100%;object-fit:cover;">'
                    + '<div style="position:absolute;bottom:0;left:0;right:0;background:linear-gradient(transparent,rgba(0,0,0,0.7));'
                    + 'padding:4px 6px;font-size:9px;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">'
                    + (f.desc || f.date) + '</div></div>';
            });
            html += '</div>';
        } else {
            html += '<div style="text-align:center;padding:20px;color:var(--text-3);font-size:13px;">'
                + 'Nenhuma foto ainda. Toque em "+ Foto" para adicionar.</div>';
        }

        html += '</div>';
        container.innerHTML = html;
    },

    // ══ Viewer de foto em tela cheia ══
    abrirViewer: function (entityId, fotoId) {
        var fotos = this.getFotos(entityId);
        var foto = fotos.find(function (f) { return f.id === fotoId; });
        if (!foto) return;

        var html = '<div class="modal-overlay" id="modal-foto-viewer" onclick="window.fotos.fecharViewer(event)" '
            + 'style="background:rgba(0,0,0,0.95);display:flex;flex-direction:column;align-items:center;justify-content:center;">'
            + '<div style="position:absolute;top:12px;right:12px;display:flex;gap:8px;">'
            + '<button onclick="window.fotos.removerFoto(\'' + entityId + '\', \'' + fotoId + '\');document.getElementById(\'modal-foto-viewer\').remove();" '
            + 'style="background:rgba(220,38,38,0.8);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-size:12px;cursor:pointer;">🗑️ Excluir</button>'
            + '<button onclick="document.getElementById(\'modal-foto-viewer\').remove();" '
            + 'style="background:rgba(255,255,255,0.2);color:#fff;border:none;border-radius:8px;padding:8px 12px;font-size:16px;cursor:pointer;">✕</button>'
            + '</div>'
            + '<img src="' + foto.data + '" style="max-width:95%;max-height:80vh;border-radius:8px;object-fit:contain;">'
            + '<div style="color:#fff;padding:12px;text-align:center;font-size:13px;">'
            + (foto.desc ? foto.desc + ' · ' : '') + foto.date
            + '</div></div>';

        document.body.insertAdjacentHTML('beforeend', html);
    },

    fecharViewer: function (e) {
        if (e.target.id === 'modal-foto-viewer') {
            document.getElementById('modal-foto-viewer').remove();
        }
    },

    fecharModal: function () {
        var el = document.getElementById('modal-foto');
        if (el) el.remove();
        this._pendingData = null;
    },

    // ══ Botão rápido de foto para usar em cards ══
    btnFoto: function (entityId, entityType, entityName) {
        return '<button class="btn-sm" style="font-size:11px;" '
            + 'onclick="event.stopPropagation();window.fotos.abrirCaptura(\'' + entityId + '\', \'' + (entityType || '') + '\', \'' + (entityName || '').replace(/'/g, "\\'") + '\')">'
            + '📸</button>';
    },

    // ══ Badge de quantidade de fotos ══
    badge: function (entityId) {
        var count = this.getFotos(entityId).length;
        if (count === 0) return '';
        return '<span style="font-size:10px;background:rgba(212,168,67,0.2);color:#D4A843;padding:2px 6px;border-radius:6px;font-weight:600;">'
            + '📸 ' + count + '</span>';
    }
};
