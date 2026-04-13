// ====== MÓDULO: CLIMA & PLUVIOMETRIA + PREVISÃO DO TEMPO ======
window.clima = {
    CACHE_KEY: 'agromacro_clima_cache',
    CACHE_DURATION: 3600000, // 1 hora em ms

    // Coordenadas — calculadas automaticamente da fazenda cadastrada
    LAT: null,
    LON: null,

    init: function () {
        this._calcCoordsFromFazenda();
        console.log('Clima Module Ready — coords:', this.LAT.toFixed(4), this.LON.toFixed(4));
        this.carregarPrevisao();
    },

    // Calcula o centro geográfico dos pastos cadastrados
    _calcCoordsFromFazenda: function () {
        var lat = -15.10, lon = -40.748; // fallback

        // Prioridade 1: Polígonos do mapa (fazenda-data.js)
        if (window.FAZENDA_PASTOS && window.FAZENDA_PASTOS.length > 0) {
            var totalLat = 0, totalLon = 0, count = 0;
            window.FAZENDA_PASTOS.forEach(function (pasto) {
                if (pasto.coords && pasto.coords.length > 0) {
                    // Usar primeiro ponto de cada polígono (mais rápido que todos)
                    totalLat += pasto.coords[0][0];
                    totalLon += pasto.coords[0][1];
                    count++;
                }
            });
            if (count > 0) {
                lat = totalLat / count;
                lon = totalLon / count;
            }
        }

        // Prioridade 2: Configuração manual salva pelo usuário
        try {
            var cfg = JSON.parse(localStorage.getItem('agromacro_config') || '{}');
            if (cfg.lat && cfg.lon) {
                lat = parseFloat(cfg.lat);
                lon = parseFloat(cfg.lon);
            }
        } catch (e) { /* ignore */ }

        this.LAT = lat;
        this.LON = lon;
    },

    // ══ REGISTRO DE CHUVA MANUAL ══
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
        return chuvas[chuvas.length - 1];
    },

    // ══ PREVISÃO DO TEMPO — Open-Meteo (gratuita, sem chave) ══
    carregarPrevisao: function () {
        var self = this;

        // Garantir coords inicializadas (caso chamado antes de init())
        if (this.LAT === null || this.LON === null) {
            this._calcCoordsFromFazenda();
        }

        // Tentar cache primeiro
        var cached = this._getCache();
        if (cached) {
            this.renderWidget(cached);
            return;
        }

        // Buscar da API
        var url = 'https://api.open-meteo.com/v1/forecast'
            + '?latitude=' + this.LAT
            + '&longitude=' + this.LON
            + '&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode'
            + '&current=temperature_2m,relative_humidity_2m,weathercode,wind_speed_10m'
            + '&timezone=America/Sao_Paulo'
            + '&forecast_days=5';

        fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
                if (data && data.current && data.daily) {
                    self._setCache(data);
                    self.renderWidget(data);
                }
            })
            .catch(function (err) {
                console.warn('⚠️ Clima offline, usando cache anterior');
                // Tentar cache expirado
                try {
                    var raw = localStorage.getItem(self.CACHE_KEY);
                    if (raw) {
                        var obj = JSON.parse(raw);
                        self.renderWidget(obj.data);
                    }
                } catch (e) { /* sem dados */ }
            });
    },

    _getCache: function () {
        try {
            var raw = localStorage.getItem(this.CACHE_KEY);
            if (!raw) return null;
            var obj = JSON.parse(raw);
            if (Date.now() - obj.timestamp < this.CACHE_DURATION) {
                return obj.data;
            }
        } catch (e) { }
        return null;
    },

    _setCache: function (data) {
        try {
            localStorage.setItem(this.CACHE_KEY, JSON.stringify({
                timestamp: Date.now(),
                data: data
            }));
        } catch (e) { }
    },

    // ══ WMO Weather Code → Emoji + Descrição ══
    _weatherIcon: function (code) {
        if (code === 0) return { icon: '☀️', desc: 'Céu limpo' };
        if (code <= 3) return { icon: '⛅', desc: 'Parcialmente nublado' };
        if (code <= 48) return { icon: '🌫️', desc: 'Neblina' };
        if (code <= 55) return { icon: '🌦️', desc: 'Chuvisco' };
        if (code <= 65) return { icon: '🌧️', desc: 'Chuva' };
        if (code <= 67) return { icon: '🌧️', desc: 'Chuva gelada' };
        if (code <= 77) return { icon: '❄️', desc: 'Neve' };
        if (code <= 82) return { icon: '🌧️', desc: 'Pancadas' };
        if (code <= 86) return { icon: '❄️', desc: 'Neve forte' };
        if (code <= 99) return { icon: '⛈️', desc: 'Tempestade' };
        return { icon: '🌤️', desc: '--' };
    },

    _diaSemana: function (dateStr) {
        var dias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        var d = new Date(dateStr + 'T12:00:00');
        return dias[d.getDay()];
    },

    // ══ RENDER WIDGET DE CLIMA NA HOME ══
    renderWidget: function (data) {
        var container = document.getElementById('clima-widget');
        if (!container) return;

        var current = data.current;
        var daily = data.daily;
        var w = this._weatherIcon(current.weathercode);

        // Acumulado de chuva registrada manualmente
        var acumulado = this.getAcumulado30Dias();

        var html = '<div class="clima-atual">'
            + '<div class="clima-temp-box">'
            + '<span class="clima-icon-big">' + w.icon + '</span>'
            + '<span class="clima-temp">' + Math.round(current.temperature_2m) + '°</span>'
            + '</div>'
            + '<div class="clima-details">'
            + '<span class="clima-desc">' + w.desc + '</span>'
            + '<span class="clima-info">💧 ' + current.relative_humidity_2m + '% · 💨 ' + Math.round(current.wind_speed_10m) + ' km/h</span>'
            + '<span class="clima-info">🌧️ Acum. 30d: ' + acumulado.toFixed(0) + ' mm</span>'
            + '</div>'
            + '</div>';

        // Previsão 5 dias
        html += '<div class="clima-forecast">';
        for (var i = 0; i < Math.min(5, daily.time.length); i++) {
            var dw = this._weatherIcon(daily.weathercode[i]);
            var chuva = daily.precipitation_sum[i];
            var dia = i === 0 ? 'Hoje' : this._diaSemana(daily.time[i]);
            html += '<div class="clima-day">'
                + '<span class="clima-day-label">' + dia + '</span>'
                + '<span class="clima-day-icon">' + dw.icon + '</span>'
                + '<span class="clima-day-temps">'
                + '<span class="clima-max">' + Math.round(daily.temperature_2m_max[i]) + '°</span>'
                + '<span class="clima-min">' + Math.round(daily.temperature_2m_min[i]) + '°</span>'
                + '</span>'
                + (chuva > 0 ? '<span class="clima-day-rain">💧' + chuva.toFixed(0) + '</span>' : '')
                + '</div>';
        }
        html += '</div>';

        container.innerHTML = html;
        container.style.display = 'block';
    }
};
