// ====== CONFIG-LOADER.JS — Carrega Credenciais de .env.local para DEV ======
// Em PRODUÇÃO, as credenciais virão do backend (via Cloud Function/Secret Manager)
// Em DEV, este loader facilita o acesso à .env.local sem build tools

window.agromacroConfig = {
    // Default values (will be overridden by .env.local or localStorage)
    firebase: {
        apiKey: 'AIzaSyAQgFA5Ea3AYkk1IZ-0d3Jb1j8aiaugX5U',
        authDomain: 'fazenda-antares.firebaseapp.com',
        projectId: 'fazenda-antares',
        storageBucket: 'fazenda-antares.firebasestorage.app',
        messagingSenderId: '1019641259951',
        appId: '1:1019641259951:web:c0bd2c970c1001b740f15a'
    },
    ia: {
        gemini: '',
        groq: '',
        cerebras: '',
        openrouter: ''
    },
    api: {
        openMeteo: 'https://api.open-meteo.com/v1/forecast',
        cepea: 'https://www.cepea.esalq.usp.br/api'
    },
    app: {
        mode: 'development',
        syncInterval: 300000,
        batchSize: 50,
        enableOfflineFirst: true
    },

    // Load config from localStorage (set manually via DevTools or .env load script)
    loadFromStorage: function() {
        try {
            var stored = localStorage.getItem('agromacro_config');
            if (stored) {
                var parsed = JSON.parse(stored);
                console.log('[Config] Loaded from localStorage:', parsed);
                Object.assign(this.firebase, parsed.firebase || {});
                Object.assign(this.ia, parsed.ia || {});
                Object.assign(this.api, parsed.api || {});
                Object.assign(this.app, parsed.app || {});
            }
        } catch (err) {
            console.warn('[Config] Failed to load from localStorage:', err.message);
        }
    },

    // Save to localStorage (for manual entry or .env import)
    saveToStorage: function() {
        try {
            var config = {
                firebase: this.firebase,
                ia: this.ia,
                api: this.api,
                app: this.app
            };
            localStorage.setItem('agromacro_config', JSON.stringify(config));
            console.log('[Config] Saved to localStorage');
        } catch (err) {
            console.warn('[Config] Failed to save to localStorage:', err.message);
        }
    },

    // Get specific value
    get: function(path, defaultValue) {
        var keys = path.split('.');
        var obj = this;
        for (var i = 0; i < keys.length; i++) {
            obj = obj[keys[i]];
            if (obj === undefined) return defaultValue;
        }
        return obj;
    },

    // Set specific value
    set: function(path, value) {
        var keys = path.split('.');
        var obj = this;
        for (var i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in obj)) obj[keys[i]] = {};
            obj = obj[keys[i]];
        }
        obj[keys[keys.length - 1]] = value;
        this.saveToStorage();
        console.log('[Config] Set ' + path + ' = ' + value);
    },

    // Init: attempt to load from localStorage
    init: function() {
        this.loadFromStorage();
        console.log('[Config] Initialized:', {
            firebase: this.firebase,
            hasGemini: !!this.ia.gemini,
            mode: this.app.mode
        });
    }
};

// Auto-init when script loads
window.agromacroConfig.init();

// Helper for manual entry (paste in DevTools console):
// window.agromacroConfig.set('ia.gemini', 'YOUR_KEY_HERE');
// window.agromacroConfig.set('firebase.apiKey', 'YOUR_KEY_HERE');
