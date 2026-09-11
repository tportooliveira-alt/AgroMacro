// Compat shim for legacy IA Chefa entrypoint.
// The active implementation lives in ia-consultor.js.
window.iaChefa = window.iaChefa || {
    init: function () {
        if (window.iaConsultor && typeof window.iaConsultor.init === 'function') {
            window.iaConsultor.init();
        }
    }
};
