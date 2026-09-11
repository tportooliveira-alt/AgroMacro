// ====== AGENT-ORCHESTRATOR.JS - Roteamento inicial entre agentes ======
window.agentOrchestrator = {
    _agents: {},
    _missions: [],

    init: function () {
        this._registerBuiltInAgents();
        console.log('AgentOrchestrator ready - ' + this.listAgents().length + ' agentes');
    },

    registerAgent: function (definition) {
        if (!definition || !definition.id) return;
        this._agents[definition.id] = definition;
    },

    listAgents: function () {
        return Object.keys(this._agents).map(function (agentId) {
            return window.agentOrchestrator._agents[agentId];
        });
    },

    classifyIntent: function (text) {
        var normalized = this._normalize(text);
        var domains = [];
        var rules = {
            rebanho: ['lote', 'gado', 'rebanho', 'boi', 'vaca', 'bezerro', 'cabeca', 'cabecas', 'pasto'],
            financeiro: ['venda', 'compra', 'caixa', 'margem', 'receita', 'custo', 'arroba', 'meta', 'mercado'],
            nutricao: ['racao', 'racao', 'cocho', 'suplemento', 'milho', 'dieta', 'nutricao'],
            auditoria: ['auditoria', 'anomalia', 'risco', 'conformidade'],
            rastreabilidade: ['gta', 'sisbov', 'rastreabilidade', 'brinco'],
            visao: ['video', 'camera', 'contagem', 'contar', 'curral', 'imagem']
        };

        Object.keys(rules).forEach(function (domain) {
            var keywords = rules[domain];
            for (var index = 0; index < keywords.length; index++) {
                if (normalized.indexOf(keywords[index]) >= 0) {
                    domains.push(domain);
                    break;
                }
            }
        });

        if (domains.length === 0) domains.push('geral');
        return domains;
    },

    selectAgents: function (domains) {
        return this.listAgents().filter(function (agent) {
            if (!agent.domains || agent.domains.length === 0) return false;
            return agent.domains.some(function (domain) {
                return domains.indexOf(domain) >= 0 || domain === 'geral';
            });
        });
    },

    planMission: function (text, options) {
        var domains = this.classifyIntent(text || '');
        var agents = this.selectAgents(domains);
        var snapshot = window.contextBuilder && typeof window.contextBuilder.getSnapshot === 'function'
            ? window.contextBuilder.getSnapshot()
            : null;
        var mission = {
            id: 'mission_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7),
            createdAt: new Date().toISOString(),
            intent: text || '',
            domains: domains,
            agents: agents.map(function (agent) { return agent.id; }),
            requiresConfirmation: this._requiresConfirmation(text),
            contextVersion: snapshot ? snapshot.version : null,
            contextGeneratedAt: snapshot ? snapshot.generatedAt : null,
            status: 'planned'
        };

        this._missions.unshift(mission);
        if (this._missions.length > 50) this._missions = this._missions.slice(0, 50);
        return mission;
    },

    getMissions: function () {
        return this._missions.slice();
    },

    _requiresConfirmation: function (text) {
        var normalized = this._normalize(text || '');
        return /(registrar|lancar|baixar|mover|vender|comprar|apagar|alterar|criar)/.test(normalized);
    },

    _registerBuiltInAgents: function () {
        this.registerAgent({
            id: 'consultor-geral',
            label: 'Consultor Geral',
            domains: ['geral', 'rebanho', 'financeiro', 'rastreabilidade'],
            source: 'window.iaConsultor',
            canWrite: true
        });
        this.registerAgent({
            id: 'nutricao-especialista',
            label: 'Nutricao',
            domains: ['nutricao'],
            source: 'window.nutricaoIA',
            canWrite: false
        });
        this.registerAgent({
            id: 'auditoria-especialista',
            label: 'Auditoria',
            domains: ['auditoria', 'financeiro'],
            source: 'window.iaAuditoria',
            canWrite: false
        });
        this.registerAgent({
            id: 'visao-contagem',
            label: 'Visao de Rebanho',
            domains: ['visao'],
            source: 'future.visionAgent',
            canWrite: false
        });
    },

    _normalize: function (value) {
        var text = String(value || '').toLowerCase();
        if (typeof text.normalize === 'function') {
            text = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        }
        return text;
    }
};
