// ====== DATA.JS — Camada de Persistência ======
window.data = {
    events: [],
    STORAGE_KEY: 'agromacro_events_v2',

    init: function () {
        this.load();
        console.log('Data: ' + this.events.length + ' eventos carregados.');
    },

    load: function () {
        try {
            var raw = localStorage.getItem(this.STORAGE_KEY);
            this.events = raw ? JSON.parse(raw) : [];
        } catch (e) {
            console.error('Erro ao carregar dados:', e);
            this.events = [];
        }
    },

    save: function () {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
        } catch (e) {
            console.error('Erro ao salvar dados:', e);
        }
    },

    saveEvent: function (ev) {
        if (!ev.id) ev.id = 'E' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        if (!ev.timestamp) ev.timestamp = new Date().toISOString();
        this.events.push(ev);
        this.save();
        return ev;
    },

    getByType: function (type) {
        return this.events.filter(function (ev) { return ev.type === type; });
    },

    resetAll: function () {
        this.events = [];
        localStorage.removeItem(this.STORAGE_KEY);
        console.log('Todos os dados apagados.');
    }
};
