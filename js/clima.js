// ====== MÓDULO: CLIMA & PLUVIOMETRIA ======
window.clima = {
    init: function () {
        console.log('Clima Module Ready');
        // No unique view binding needed yet, used by Pasto Mgmt
    },

    registrarChuva: function (mm, data) {
        if (!mm) return;
        var event = {
            type: 'CHUVA_REGISTRO',
            mm: parseFloat(mm),
            date: data || new Date().toISOString()
        };
        window.data.saveEvent(event);
        console.log('Chuva registrada:', mm, 'mm');

        // Refresh pasto calculations if module exists
        if (window.pastoMgmt) window.pastoMgmt.recalcularRecuperacao();
    },

    getAcumulado30Dias: function () {
        var limit = new Date();
        limit.setDate(limit.getDate() - 30);

        var chuvas = window.data.events.filter(function (ev) {
            return ev.type === 'CHUVA_REGISTRO' && new Date(ev.date) >= limit;
        });

        return chuvas.reduce(function (acc, ev) { return acc + (ev.mm || 0); }, 0);
    },

    getUltimaChuva: function () {
        var chuvas = window.data.events.filter(function (ev) { return ev.type === 'CHUVA_REGISTRO'; });
        if (chuvas.length === 0) return null;
        return chuvas[chuvas.length - 1]; // Last registered
    }
};
