// ====== LEITOR DE COCHO — Análise de Imagem com Gemini Vision ======
window.leitorCocho = {
    STORAGE_KEY: 'agromacro_analises_cocho',
    ANALISE_CACHE_TTL: 3600000, // 1 hora

    init: function () {
        console.log('LeitorCocho ready');
    },

    capturarFoto: function (callback) {
        var self = this;
        
        // Criar input file dinamicamente
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment'; // Preferir câmera traseira em mobile
        
        input.onchange = function (event) {
            var file = event.target.files[0];
            if (!file) return;
            
            // Ler arquivo como Data URL
            var reader = new FileReader();
            reader.onload = function (e) {
                var base64Data = e.target.result;
                
                // Mostrar toast de análise
                if (window.app && window.app.showToast) {
                    window.app.showToast('📸 Analisando cocho...', 'info');
                }
                
                // Analisar imagem
                self.analisarImagem(base64Data, callback);
            };
            reader.readAsDataURL(file);
        };
        
        // Disparar clique para abrir seletor de arquivo
        input.click();
    },

    analisarImagem: function (base64Data, callback) {
        var self = this;
        
        if (!base64Data) return;
        
        // Extrair MIME type da Data URL
        var mimeMatch = base64Data.match(/data:([^;]+);/);
        var mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        var base64String = base64Data.replace(/^data:[^;]+;base64,/, '');
        
        // Preparar payload para Gemini Vision API
        var payload = {
            contents: [{
                role: 'user',
                parts: [
                    {
                        inline_data: {
                            mime_type: mimeType,
                            data: base64String
                        }
                    },
                    {
                        text: self._buildPromptCocho()
                    }
                ]
            }],
            generationConfig: {
                max_output_tokens: 1000
            }
        };
        
        // Chamar Gemini Vision
        self._chamarGeminiVision(payload, callback);
    },

    _buildPromptCocho: function () {
        return `Você é um especialista em nutrição e manejo de bovinos. 
Analise a imagem deste cocho e forneça uma avaliação detalhada em formato JSON.

Identifique e retorne EXATAMENTE neste formato JSON:
{
  "nivelSobra": <número 0-100>,
  "qualidade": "<boa|regular|ruim>",
  "seletividade": <true|false>,
  "fungos": <true|false>,
  "animaisPresentes": <número>,
  "observacoes": "<resumo breve>",
  "alertas": [<lista de alertas se houver>],
  "recomendacoes": [<lista de recomendações práticas>]
}

Análise rápida:
- Se há muita sobra (>70%): qualidade ruim ou baixa palatabilidade
- Se há partes úmidas ou com bolor: risco de fungos
- Se os animais estão seletivos (comendo só partes): desequilíbrio nutricional
- Se cocho sujo: risco sanitário`;
    },

    _chamarGeminiVision: function (payload, callback) {
        var self = this;
        
        // Verificar qual provedor está disponível
        var apiKey = window.iaConsultor ? window.iaConsultor.API_KEY : '';
        var workerUrl = window.iaConsultor ? window.iaConsultor.WORKER_URL : '';
        
        if (!apiKey && !workerUrl) {
            if (window.app && window.app.showToast) {
                window.app.showToast('❌ Configure uma chave API (Gemini) primeiro.', 'error');
            }
            return;
        }
        
        // Usar Worker se disponível, senão Gemini direto
        var url = workerUrl 
            ? workerUrl 
            : 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
        
        var options = {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        };
        
        fetch(url, options)
            .then(function (response) {
                if (!response.ok) throw new Error('API error: ' + response.status);
                return response.json();
            })
            .then(function (data) {
                self._processarRespostaVision(data, callback);
            })
            .catch(function (error) {
                console.error('LeitorCocho error:', error);
                if (window.app && window.app.showToast) {
                    window.app.showToast('❌ Erro ao analisar imagem: ' + error.message, 'error');
                }
            });
    },

    _processarRespostaVision: function (data, callback) {
        var self = this;
        
        // Extrair texto da resposta
        var textoResposta = '';
        if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
            data.candidates[0].content.parts.forEach(function (part) {
                if (part.text) {
                    textoResposta += part.text;
                }
            });
        }
        
        if (!textoResposta) {
            if (window.app && window.app.showToast) {
                window.app.showToast('❌ Sem resposta da análise.', 'error');
            }
            return;
        }
        
        // Extrair JSON da resposta
        var jsonMatch = textoResposta.match(/\{[\s\S]*\}/);
        var analiseJSON = null;
        
        if (jsonMatch) {
            try {
                analiseJSON = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.warn('JSON parse error:', e);
            }
        }
        
        // Formatar resultado para exibição no chat
        var resultadoFormatado = self._formatarResultado(analiseJSON, textoResposta);
        
        // Salvar análise no localStorage
        self._salvarAnalise(analiseJSON || {});
        
        // Exibir no chat como mensagem da IA
        if (window.iaConsultor) {
            window.iaConsultor.historico.push({
                role: 'model',
                content: resultadoFormatado,
                time: Date.now(),
                source: 'leitorCocho'
            });
            window.iaConsultor._salvarHistorico();
            window.iaConsultor._renderMensagens();
            
            if (window.app && window.app.showToast) {
                window.app.showToast('✅ Análise do cocho concluída!', 'success');
            }
        }
        
        if (typeof callback === 'function') {
            callback(analiseJSON, resultadoFormatado);
        }
    },

    _formatarResultado: function (analise, textoRaw) {
        if (!analise) {
            return '📸 **Análise do Cocho**\n\n' + textoRaw;
        }
        
        var linhas = [];
        linhas.push('📸 **Análise do Cocho Realizada**\n');
        
        // Nível de sobra
        if (analise.nivelSobra != null) {
            var gauge = this._criarGauge(analise.nivelSobra);
            linhas.push('🍽️ **Nível de Sobra:** ' + gauge + ' ' + analise.nivelSobra + '%');
        }
        
        // Qualidade
        if (analise.qualidade) {
            var emoji = analise.qualidade === 'boa' ? '✅' : analise.qualidade === 'regular' ? '⚠️' : '❌';
            linhas.push(emoji + ' **Qualidade:** ' + analise.qualidade);
        }
        
        // Alertas
        if (Array.isArray(analise.alertas) && analise.alertas.length > 0) {
            linhas.push('\n🚨 **Alertas:**');
            analise.alertas.forEach(function (alerta) {
                linhas.push('  • ' + alerta);
            });
        }
        
        // Recomendações
        if (Array.isArray(analise.recomendacoes) && analise.recomendacoes.length > 0) {
            linhas.push('\n💡 **Recomendações:**');
            analise.recomendacoes.forEach(function (rec) {
                linhas.push('  • ' + rec);
            });
        }
        
        // Observações
        if (analise.observacoes) {
            linhas.push('\n📝 **Observações:** ' + analise.observacoes);
        }
        
        // Detalhes extras
        if (analise.seletividade) linhas.push('\n⚠️ Animais apresentando seletividade');
        if (analise.fungos) linhas.push('🍄 Presença de fungos detectada');
        if (analise.animaisPresentes != null) {
            linhas.push('🐂 ' + analise.animaisPresentes + ' animais presentes');
        }
        
        return linhas.join('\n');
    },

    _criarGauge: function (valor) {
        // Criar gauge visual simples
        var barras = Math.round(valor / 10);
        var vazio = 10 - barras;
        return '[' + new Array(barras + 1).join('█') + new Array(vazio + 1).join('░') + ']';
    },

    _salvarAnalise: function (analise) {
        try {
            var lista = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            
            // Adicionar nova análise com timestamp
            lista.push({
                timestamp: new Date().toISOString(),
                analise: analise
            });
            
            // Manter últimas 50
            if (lista.length > 50) {
                lista = lista.slice(-50);
            }
            
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(lista));
        } catch (e) {
            console.warn('LeitorCocho _salvarAnalise error:', e);
        }
    },

    // API pública: obter histórico de análises
    obterAnalises: function (limite) {
        try {
            var lista = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]');
            if (limite) {
                lista = lista.slice(-limite);
            }
            return lista;
        } catch (e) {
            return [];
        }
    },

    // API pública: obter estatísticas das últimas análises
    obterEstatisticas: function (diasAtras) {
        var diasAtras = diasAtras || 7;
        var analises = this.obterAnalises();
        var cutoff = Date.now() - (diasAtras * 86400000);
        
        var recentes = analises.filter(function (item) {
            return new Date(item.timestamp).getTime() >= cutoff;
        });
        
        if (recentes.length === 0) {
            return { total: 0, mediaQualidade: 'N/A', mediasobra: 'N/A' };
        }
        
        var mediaQualidade = recentes.reduce(function (acc, item) {
            var sobra = item.analise && item.analise.nivelSobra ? item.analise.nivelSobra : 0;
            return acc + sobra;
        }, 0) / recentes.length;
        
        return {
            total: recentes.length,
            mediaQualidade: (100 - mediaQualidade).toFixed(1) + '%',
            mediaSobra: mediaQualidade.toFixed(1) + '%',
            periodo: diasAtras + ' dias'
        };
    }
};
