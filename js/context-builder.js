// ====== CONTEXT-BUILDER.JS - Snapshot compartilhado da fazenda ======
window.contextBuilder = {
    SCHEMA_VERSION: '1.0.0',
    CACHE_TTL_MS: 30000,
    _cache: null,
    _cacheAt: 0,

    init: function () {
        console.log('ContextBuilder ready');
    },

    invalidate: function () {
        this._cache = null;
        this._cacheAt = 0;
    },

    getSnapshot: function (forceRefresh) {
        var now = Date.now();
        if (!forceRefresh && this._cache && (now - this._cacheAt) < this.CACHE_TTL_MS) {
            return this._cache;
        }

        this._cache = this.buildSnapshot();
        this._cacheAt = now;
        return this._cache;
    },

    buildSnapshot: function () {
        var events = (window.data && Array.isArray(window.data.events)) ? window.data.events : [];
        var activeLotes = events.filter(function (eventItem) {
            return eventItem.type === 'LOTE' && eventItem.status === 'ATIVO' && !eventItem.estornado;
        });
        var snapshot = {
            version: this.SCHEMA_VERSION,
            generatedAt: new Date().toISOString(),
            location: this._buildLocation(),
            herd: this._buildHerd(activeLotes),
            pastures: this._buildPastures(activeLotes),
            climate: this._buildClimate(),
            financial: this._buildFinancial(events),
            inventory: this._buildInventory(events),
            management: this._buildManagement(events),
            indicators: this._buildIndicators(),
            market: this._buildMarket(),
            goals: this._buildGoals(events),
            audit: this._buildAudit(events)
        };

        snapshot.summary = {
            totalHeads: snapshot.herd.totalHeads,
            activeLotes: snapshot.herd.activeLotes.length,
            overdueAccounts: snapshot.financial.overdueAccounts.length,
            lowInventoryItems: snapshot.inventory.lowItems.length,
            pendingAnomalies: snapshot.audit.pending.length
        };

        return snapshot;
    },

    getPromptContext: function (forceRefresh) {
        var snapshot = this.getSnapshot(forceRefresh);
        var lines = [];

        if (snapshot.location.lat != null && snapshot.location.lon != null) {
            lines.push('LOCALIZACAO: Lat ' + snapshot.location.lat.toFixed(4) + ', Lon ' + snapshot.location.lon.toFixed(4));
        }

        lines.push('REBANHO: ' + snapshot.herd.totalHeads + ' cabecas em ' + snapshot.herd.activeLotes.length + ' lotes');
        snapshot.herd.activeLotes.forEach(function (lote) {
            lines.push('  - Lote "' + lote.nome + '": ' + lote.qtdAnimais + ' cab, categoria: ' + lote.categoria + ', pasto: ' + lote.pasto);
            if (lote.pesoMedio) lines.push('    Peso medio: ' + lote.pesoMedio + ' kg');
        });

        if (snapshot.pastures.items.length > 0) {
            lines.push('');
            lines.push('PASTOS: area total ' + snapshot.pastures.totalAreaHa.toFixed(1) + ' ha');
            lines.push('LOTACAO GERAL: ' + snapshot.pastures.stockingRateUaHa.toFixed(2) + ' UA/ha');
            snapshot.pastures.items.forEach(function (pasto) {
                lines.push('  - ' + pasto.nome + ': ' + pasto.area.toFixed(1) + ' ha, status: ' + pasto.status);
            });
        }

        if (snapshot.climate.rain30dMm != null) {
            lines.push('');
            lines.push('CHUVA 30 DIAS: ' + snapshot.climate.rain30dMm.toFixed(0) + ' mm');
            if (snapshot.climate.lastRain) {
                lines.push('ULTIMA CHUVA: ' + snapshot.climate.lastRain.mm + ' mm em ' + snapshot.climate.lastRain.dateLabel);
            }
        }

        lines.push('');
        lines.push('FINANCEIRO:');
        lines.push('  Compras totais: R$ ' + this._formatCurrency(snapshot.financial.totalCompras));
        lines.push('  Vendas totais: R$ ' + this._formatCurrency(snapshot.financial.totalVendas));
        lines.push('  Saldo: R$ ' + this._formatCurrency(snapshot.financial.saldo));
        if (snapshot.financial.overdueAccounts.length > 0) {
            lines.push('  Contas vencidas: ' + snapshot.financial.overdueAccounts.length);
        }

        if (snapshot.inventory.items.length > 0) {
            lines.push('');
            lines.push('ESTOQUE: ' + snapshot.inventory.items.length + ' itens');
            snapshot.inventory.items.forEach(function (item) {
                var warning = item.isLow ? ' BAIXO' : '';
                lines.push('  - ' + item.nome + ': ' + item.qtd + ' ' + item.unidade + warning);
            });
        }

        if (snapshot.management.recent.length > 0) {
            lines.push('');
            lines.push('ULTIMOS MANEJOS:');
            snapshot.management.recent.forEach(function (manejo) {
                lines.push('  - ' + manejo.tipo + ' em ' + manejo.dateLabel);
            });
        }

        if (snapshot.indicators.gmdGeral != null) {
            lines.push('');
            lines.push('GMD MEDIO: ' + snapshot.indicators.gmdGeral.toFixed(3) + ' kg/dia');
        }

        if (snapshot.market.data) {
            lines.push('');
            lines.push('MERCADO (' + snapshot.market.data + '):');
            if (snapshot.market.arrobaSP) lines.push('  Arroba SP: R$ ' + Number(snapshot.market.arrobaSP).toFixed(2));
            if (snapshot.market.arrobaBA) lines.push('  Arroba BA: R$ ' + Number(snapshot.market.arrobaBA).toFixed(2));
            if (snapshot.market.arrobaGO) lines.push('  Arroba GO: R$ ' + Number(snapshot.market.arrobaGO).toFixed(2));
            if (snapshot.market.arrobaMT) lines.push('  Arroba MT: R$ ' + Number(snapshot.market.arrobaMT).toFixed(2));
            if (snapshot.market.arrobaMS) lines.push('  Arroba MS: R$ ' + Number(snapshot.market.arrobaMS).toFixed(2));
            if (snapshot.market.tendencia) lines.push('  Tendencia: ' + snapshot.market.tendencia);
        }

        if (snapshot.goals.items.length > 0) {
            lines.push('');
            lines.push('METAS ATIVAS:');
            snapshot.goals.items.forEach(function (goal) {
                lines.push('  - ' + goal.tipoMeta.toUpperCase() + ': R$ ' + goal.precoAlvo.toFixed(2) + '/@, ' + goal.qtdArrobas + '@');
            });
        }

        if (snapshot.audit.pending.length > 0) {
            lines.push('');
            lines.push('AUDITORIA: ' + snapshot.audit.pending.length + ' anomalia(s) pendente(s)');
            snapshot.audit.pending.slice(0, 5).forEach(function (anomalia, index) {
                lines.push('  ' + (index + 1) + '. [' + anomalia.severidade + '] ' + anomalia.indicador + ': ' + anomalia.descricao);
            });
        }

        return lines.join('\n');
    },

    _buildLocation: function () {
        if (!window.clima || window.clima.LAT == null || window.clima.LON == null) {
            return { lat: null, lon: null };
        }

        return {
            lat: Number(window.clima.LAT),
            lon: Number(window.clima.LON)
        };
    },

    _buildHerd: function (activeLotes) {
        var totalHeads = activeLotes.reduce(function (accumulator, lote) {
            return accumulator + (lote.qtdAnimais || 0);
        }, 0);

        return {
            totalHeads: totalHeads,
            activeLotes: activeLotes.map(function (lote) {
                return {
                    id: lote.id || '',
                    nome: lote.nome || '--',
                    qtdAnimais: lote.qtdAnimais || 0,
                    categoria: lote.categoria || '--',
                    pasto: lote.pasto || '--',
                    pesoMedio: lote.pesoMedio || 0,
                    raca: lote.raca || '--'
                };
            })
        };
    },

    _buildPastures: function (activeLotes) {
        var items = [];
        var totalAreaHa = 0;
        var totalUa = activeLotes.reduce(function (accumulator, lote) {
            return accumulator + (((lote.qtdAnimais || 0) * (lote.pesoMedio || 0)) / 450);
        }, 0);

        if (window.pastos && typeof window.pastos.getPastos === 'function') {
            items = window.pastos.getPastos().map(function (pasto) {
                totalAreaHa += Number(pasto.area || 0);
                return {
                    nome: pasto.nome || '--',
                    area: Number(pasto.area || 0),
                    status: pasto.status || 'ativo'
                };
            });
        }

        return {
            totalAreaHa: totalAreaHa,
            totalUa: totalUa,
            stockingRateUaHa: totalAreaHa > 0 ? (totalUa / totalAreaHa) : 0,
            items: items
        };
    },

    _buildClimate: function () {
        var climate = { rain30dMm: null, lastRain: null };

        if (!window.clima) return climate;

        if (typeof window.clima.getAcumulado30Dias === 'function') {
            climate.rain30dMm = Number(window.clima.getAcumulado30Dias() || 0);
        }

        if (typeof window.clima.getUltimaChuva === 'function') {
            var lastRain = window.clima.getUltimaChuva();
            if (lastRain) {
                climate.lastRain = {
                    mm: Number(lastRain.mm || 0),
                    date: lastRain.date || '',
                    dateLabel: lastRain.date ? new Date(lastRain.date).toLocaleDateString('pt-BR') : ''
                };
            }
        }

        return climate;
    },

    _buildFinancial: function (events) {
        var today = new Date().toISOString().split('T')[0];
        var compras = events.filter(function (eventItem) { return eventItem.type === 'COMPRA' && !eventItem.estornado; });
        var vendas = events.filter(function (eventItem) { return eventItem.type === 'VENDA' && !eventItem.estornado; });
        var overdueAccounts = events.filter(function (eventItem) {
            return eventItem.type === 'CONTA_PAGAR' && !eventItem.pago && eventItem.vencimento && eventItem.vencimento < today && !eventItem.estornado;
        });

        return {
            totalCompras: compras.reduce(function (accumulator, eventItem) {
                return accumulator + Number(eventItem.valorTotal || eventItem.value || eventItem.valor || 0);
            }, 0),
            totalVendas: vendas.reduce(function (accumulator, eventItem) {
                return accumulator + Number(eventItem.valorTotal || eventItem.value || eventItem.valor || 0);
            }, 0),
            saldo: vendas.reduce(function (accumulator, eventItem) {
                return accumulator + Number(eventItem.valorTotal || eventItem.value || eventItem.valor || 0);
            }, 0) - compras.reduce(function (accumulator, eventItem) {
                return accumulator + Number(eventItem.valorTotal || eventItem.value || eventItem.valor || 0);
            }, 0),
            overdueAccounts: overdueAccounts
        };
    },

    _buildInventory: function (events) {
        var items = events.filter(function (eventItem) {
            return eventItem.type === 'ESTOQUE_ITEM' && eventItem.status === 'ATIVO' && !eventItem.estornado;
        }).map(function (eventItem) {
            var qtd = Number(eventItem.qtd || eventItem.qty || 0);
            var minimo = Number(eventItem.minimo || 0);
            return {
                nome: eventItem.nome || eventItem.product || '--',
                qtd: qtd,
                unidade: eventItem.unidade || eventItem.unit || 'un',
                minimo: minimo,
                isLow: qtd <= minimo
            };
        });

        return {
            items: items,
            lowItems: items.filter(function (item) { return item.isLow; })
        };
    },

    _buildManagement: function (events) {
        var recent = events.filter(function (eventItem) {
            return eventItem.type === 'MANEJO' && !eventItem.estornado;
        }).slice(-3).map(function (eventItem) {
            return {
                tipo: eventItem.tipoManejo || eventItem.descricao || 'Manejo',
                dateLabel: eventItem.date ? new Date(eventItem.date).toLocaleDateString('pt-BR') : '--'
            };
        });

        return { recent: recent };
    },

    _buildIndicators: function () {
        var indicators = { gmdGeral: null };

        if (window.indicadores && typeof window.indicadores.calcGMDGeral === 'function') {
            try {
                indicators.gmdGeral = Number(window.indicadores.calcGMDGeral());
            } catch (error) {
                indicators.gmdGeral = null;
            }
        }

        return indicators;
    },

    _buildMarket: function () {
        if (window.iaConsultor && typeof window.iaConsultor.getMercado === 'function') {
            return window.iaConsultor.getMercado() || {};
        }

        return {};
    },

    _buildGoals: function (events) {
        return {
            items: events.filter(function (eventItem) {
                return eventItem.type === 'META_MERCADO' && eventItem.status === 'ATIVA' && !eventItem.estornado;
            }).map(function (eventItem) {
                return {
                    tipoMeta: eventItem.tipoMeta || 'venda',
                    precoAlvo: Number(eventItem.precoAlvo || 0),
                    qtdArrobas: Number(eventItem.qtdArrobas || 0),
                    dataLimite: eventItem.dataLimite || ''
                };
            })
        };
    },

    _buildAudit: function (events) {
        return {
            pending: events.filter(function (eventItem) {
                return eventItem.type === 'ANOMALIA' && eventItem.status === 'PENDENTE';
            }).map(function (eventItem) {
                return {
                    severidade: eventItem.severidade || '?',
                    indicador: eventItem.indicador || '',
                    descricao: eventItem.descricao || ''
                };
            })
        };
    },

    _formatCurrency: function (value) {
        return Number(value || 0).toLocaleString('pt-BR');
    }
};
