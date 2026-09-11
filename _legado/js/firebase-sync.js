// ====== FIREBASE-SYNC.JS — Auth + Firestore Sync (Offline-First) ======
window.firebaseSync = {
    db: null,
    auth: null,
    user: null,
    fazendaId: null,
    fazendaNome: null,
    isOnline: navigator.onLine,
    SYNC_KEY: 'agromacro_sync_config',
    DEVICE_KEY: 'agromacro_device_id',
    MERGE_LOG_KEY: 'agromacro_sync_merge_log',
    unsubscribe: null,
    _isRegisterMode: false,
    _appReady: false,
    _isSyncing: false,

    _normalizePerfil: function (perfil) {
        if (!perfil) return 'admin';
        var p = ('' + perfil).toLowerCase();
        if (p === 'campo') return 'peao';
        if (p === 'gerencia') return 'admin';
        if (p === 'peao' || p === 'admin' || p === 'dono') return p;
        return 'admin';
    },

    // ══ INIT ══
    init: function () {
        var self = this;

        var cfg = window.agromacroConfig || {};
        var cfgFirebase = cfg.firebase || {};

        // Firebase config
        var firebaseConfig = {
            apiKey: cfgFirebase.apiKey || "AIzaSyAQgFA5Ea3AYkk1IZ-0d3Jb1j8aiaugX5U",
            authDomain: cfgFirebase.authDomain || "fazenda-antares.firebaseapp.com",
            projectId: cfgFirebase.projectId || "fazenda-antares",
            storageBucket: cfgFirebase.storageBucket || "fazenda-antares.firebasestorage.app",
            messagingSenderId: cfgFirebase.messagingSenderId || "1019641259951",
            appId: cfgFirebase.appId || "1:1019641259951:web:c0bd2c970c1001b740f15a"
        };

        // Initialize Firebase
        if (!firebase.apps.length) {
            firebase.initializeApp(firebaseConfig);
        }

        this.auth = firebase.auth();
        this.db = firebase.firestore();

        // Enable Firestore offline persistence
        this.db.enablePersistence({ synchronizeTabs: true })
            .catch(function (err) {
                console.warn('[Sync] Offline persistence failed:', err.code);
            });

        // Track online status
        window.addEventListener('online', function () {
            self.isOnline = true;
            console.log('[Sync] Online — syncing...');
            self._updateSyncDot('syncing');
            self.syncLocalToFirestore();
        });
        window.addEventListener('offline', function () {
            self.isOnline = false;
            self._updateSyncDot('offline');
            console.log('[Sync] Offline — using local data');
        });

        // Monitor auth state — AUTH GATE
        this.auth.onAuthStateChanged(function (user) {
            self.user = user;
            if (user) {
                console.log('[Auth] Logged in:', user.displayName || user.email);
                self._loadSyncConfig();
                self._updateLoginUI(true);

                // Check if user has a fazenda linked
                if (self.fazendaId) {
                    self._showApp();
                } else {
                    // Auto-join from deep-link if pending code
                    if (self._pendingJoinCode) {
                        var code = self._pendingJoinCode;
                        self._pendingJoinCode = null;
                        if (window.app && window.app.showToast) {
                            window.app.showToast('Entrando na fazenda com código ' + code + '…', 'info');
                        }
                        self.entrarFazenda(code).then(function () {
                            self._showApp();
                        }).catch(function () {
                            self._showFazendaSelect([]);
                        });
                        return;
                    }

                    // Check Firestore for user's fazendas
                    self.getMinhasFazendas().then(function (fazendas) {
                        if (fazendas.length === 1) {
                            // Auto-select single farm
                            self.trocarFazenda(fazendas[0].id, fazendas[0].nome);
                            self._showApp();
                        } else if (fazendas.length > 0) {
                            self._showFazendaSelect(fazendas);
                        } else {
                            self._showFazendaSelect([]);
                        }
                    }).catch(function () {
                        self._showFazendaSelect([]);
                    });
                }
            } else {
                console.log('[Auth] Not logged in');
                self._updateLoginUI(false);
                self._showLogin();
            }
        });

        // Load saved sync config
        this._loadSyncConfig();

        // Deep-link: ?join=CODE auto-fill on load
        var joinCode = (new URLSearchParams(window.location.search)).get('join');
        if (joinCode) {
            var cleanCode = ('' + joinCode).replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 8);
            if (cleanCode) {
                // Remove param from URL without reload
                var newUrl = window.location.pathname + window.location.hash;
                if (window.history && window.history.replaceState) {
                    window.history.replaceState(null, '', newUrl);
                }
                console.log('[Sync] Deep-link join code detected:', cleanCode);
                this._pendingJoinCode = cleanCode;
            }
        }

        console.log('[Sync] Firebase initialized (offline-first)');
    },

    // ══ LOGIN COM GOOGLE ══
    loginGoogle: function () {
        var self = this;
        var provider = new firebase.auth.GoogleAuthProvider();
        self._showLoginError('');

        // Try popup first, fallback to redirect for mobile
        this.auth.signInWithPopup(provider).catch(function (err) {
            if (err.code === 'auth/popup-blocked' || err.code === 'auth/popup-closed-by-user') {
                // Fallback to redirect for mobile
                return self.auth.signInWithRedirect(provider);
            }
            console.error('[Auth] Login error:', err);
            var msg = self._translateAuthError(err.code);
            self._showLoginError(msg + ' (' + err.code + ')');
        });
    },

    // ══ LOGIN COM EMAIL/SENHA ══
    loginEmail: function () {
        var self = this;
        var email = (document.getElementById('login-email') || {}).value || '';
        var senha = (document.getElementById('login-senha') || {}).value || '';
        var nome = (document.getElementById('login-nome') || {}).value || '';

        if (!email || !senha) {
            self._showLoginError('Preencha email e senha.');
            return;
        }
        if (senha.length < 6) {
            self._showLoginError('Senha deve ter no mínimo 6 caracteres.');
            return;
        }

        self._showLoginError('');

        if (self._isRegisterMode) {
            // CREATE ACCOUNT
            this.auth.createUserWithEmailAndPassword(email, senha)
                .then(function (cred) {
                    if (nome && cred.user) {
                        return cred.user.updateProfile({ displayName: nome });
                    }
                })
                .catch(function (err) {
                    var msg = self._translateAuthError(err.code);
                    self._showLoginError(msg);
                });
        } else {
            // SIGN IN
            this.auth.signInWithEmailAndPassword(email, senha)
                .catch(function (err) {
                    var msg = self._translateAuthError(err.code);
                    self._showLoginError(msg);
                });
        }
    },

    // ══ TOGGLE LOGIN/REGISTER MODE ══
    toggleLoginMode: function () {
        this._isRegisterMode = !this._isRegisterMode;
        var nomeGroup = document.getElementById('login-nome-group');
        var submitBtn = document.getElementById('login-submit-btn');
        var toggleText = document.getElementById('login-toggle-text');
        var toggleLink = document.getElementById('login-toggle-link');

        if (this._isRegisterMode) {
            if (nomeGroup) nomeGroup.style.display = 'block';
            if (submitBtn) submitBtn.textContent = 'Criar Conta';
            if (toggleText) toggleText.textContent = 'Já tem conta?';
            if (toggleLink) toggleLink.textContent = 'Fazer login';
        } else {
            if (nomeGroup) nomeGroup.style.display = 'none';
            if (submitBtn) submitBtn.textContent = 'Entrar';
            if (toggleText) toggleText.textContent = 'Não tem conta?';
            if (toggleLink) toggleLink.textContent = 'Criar conta';
        }
        this._showLoginError('');
    },

    // ══ SKIP LOGIN (offline mode) ══
    skipLogin: function () {
        this._showApp();
    },

    // ══ AUTH GATE HELPERS ══
    _showLogin: function () {
        var login = document.getElementById('login-screen');
        var fazenda = document.getElementById('fazenda-select-screen');
        if (login) login.classList.remove('hidden');
        if (fazenda) fazenda.classList.add('hidden');
    },

    _showFazendaSelect: function (fazendas) {
        var login = document.getElementById('login-screen');
        var fazendaScreen = document.getElementById('fazenda-select-screen');
        if (login) login.classList.add('hidden');
        if (fazendaScreen) fazendaScreen.classList.remove('hidden');
        this._renderFazendaSelectUI(fazendas);
    },

    _showApp: function () {
        var login = document.getElementById('login-screen');
        var fazenda = document.getElementById('fazenda-select-screen');
        if (login) login.classList.add('hidden');
        if (fazenda) fazenda.classList.add('hidden');

        // Initialize app if not yet ready
        if (!this._appReady) {
            this._appReady = true;
            if (window.app && window.app._initModules) {
                window.app._initModules();
            }
        }
    },

    _showLoginError: function (msg) {
        var el = document.getElementById('login-error');
        if (!el) return;
        if (msg) {
            el.textContent = msg;
            el.classList.add('visible');
        } else {
            el.textContent = '';
            el.classList.remove('visible');
        }
    },

    _translateAuthError: function (code) {
        var map = {
            'auth/invalid-email': 'Email inválido.',
            'auth/user-disabled': 'Conta desativada.',
            'auth/user-not-found': 'Usuário não encontrado.',
            'auth/wrong-password': 'Senha incorreta.',
            'auth/email-already-in-use': 'Este email já está em uso.',
            'auth/weak-password': 'Senha muito fraca (mín. 6 caracteres).',
            'auth/too-many-requests': 'Muitas tentativas. Aguarde um momento.',
            'auth/invalid-credential': 'Email ou senha incorretos.',
            'auth/unauthorized-domain': 'Domínio não autorizado no Firebase Auth. Adicione localhost e 127.0.0.1 em Authentication > Settings > Authorized domains.'
        };
        return map[code] || 'Erro: ' + code;
    },

    // ══ RENDER FAZENDA SELECTION UI ══
    _renderFazendaSelectUI: function (fazendas) {
        var self = this;
        var _esc = window.data.escapeHtml;

        // User bar
        var userBar = document.getElementById('fazenda-user-bar');
        if (userBar && this.user) {
            userBar.innerHTML = ''
                + (this.user.photoURL ? '<img src="' + _esc(this.user.photoURL) + '" onerror="this.style.display=\'none\'">' : '<div style="width:40px;height:40px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;">👤</div>')
                + '<div><div class="user-name">' + _esc(this.user.displayName || 'Usuário') + '</div>'
                + '<div class="user-email">' + _esc(this.user.email || '') + '</div></div>';
        }

        // Content
        var container = document.getElementById('fazenda-select-content');
        if (!container) return;

        var html = '';

        if (fazendas && fazendas.length > 0) {
            // ── Has farms: show list ──
            html += '<div class="fazenda-option-card"><h3>🏠 Suas Fazendas</h3>';
            fazendas.forEach(function (f) {
                var nomeEsc = _esc(f.nome || 'Sem nome');
                var idEsc = _esc(f.id || '');
                var codigoEsc = _esc(f.codigo || '--');
                html += '<button class="fazenda-list-item" data-id="' + idEsc + '" data-nome="' + nomeEsc + '">'
                    + nomeEsc
                    + '<div class="fazenda-meta">' + (f.membros ? f.membros.length : 0) + ' membro(s) • Código: ' + codigoEsc + '</div>'
                    + '</button>';
            });
            html += '</div>';

            // Join another farm
            html += '<div class="fazenda-option-card"><h3>🔗 Entrar em Outra Fazenda</h3>'
                + '<div class="form-group"><input type="text" id="fazenda-code-input" placeholder="Código de convite (ex: ABC123)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;border-radius:12px;padding:12px 16px;text-transform:uppercase;"></div>'
                + '<button class="login-btn-submit" style="background:linear-gradient(135deg,#2563EB,#3B82F6);" id="fazenda-join-btn">Entrar na Fazenda</button>'
                + '</div>';

        } else {
            // ── No farms: INVITE-ONLY screen ──
            html += '<div style="text-align:center;padding:20px 0;">';
            html += '<div style="font-size:48px;margin-bottom:12px;">🔐</div>';
            html += '<h3 style="color:#fff;font-size:18px;margin-bottom:8px;">Acesso por Convite</h3>';
            html += '<p style="color:rgba(255,255,255,0.5);font-size:13px;line-height:1.6;margin-bottom:24px;">Para acessar o AgroMacro, você precisa de um<br><strong style="color:rgba(255,255,255,0.8);">código de convite</strong> do administrador da fazenda.</p>';
            html += '</div>';

            html += '<div class="fazenda-option-card">';
            html += '<h3>🔗 Digite o Código de Acesso</h3>';
            html += '<div class="form-group"><input type="text" id="fazenda-code-input" placeholder="Código de convite (ex: ABC123)" style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;border-radius:12px;padding:14px 16px;text-transform:uppercase;font-size:16px;text-align:center;letter-spacing:2px;"></div>';
            html += '<button class="login-btn-submit" style="background:linear-gradient(135deg,#2563EB,#3B82F6);" id="fazenda-join-btn">Entrar na Fazenda</button>';
            html += '<div id="fazenda-join-error" style="color:#EF4444;font-size:12px;margin-top:8px;text-align:center;"></div>';
            html += '</div>';

            // Admin-only: create farm (hidden behind small link)
            html += '<div id="fazenda-admin-section" style="display:none;margin-top:16px;">';
            html += '<div class="fazenda-option-card"><h3>➕ Criar Nova Fazenda</h3>';
            html += '<div class="form-group"><input type="text" id="fazenda-new-nome" placeholder="Nome da fazenda..." style="background:rgba(255,255,255,0.08);border:1px solid rgba(255,255,255,0.12);color:#fff;border-radius:12px;padding:12px 16px;"></div>';
            html += '<button class="login-btn-submit" id="fazenda-create-btn">Criar Fazenda</button>';
            html += '</div></div>';

            html += '<p style="text-align:center;margin-top:20px;">';
            html += '<a id="fazenda-show-admin" style="color:rgba(255,255,255,0.25);font-size:11px;cursor:pointer;text-decoration:none;">Sou administrador</a>';
            html += '</p>';
        }

        // Logout
        html += '<button style="margin-top:12px;padding:10px 20px;background:none;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.5);border-radius:10px;font-size:12px;cursor:pointer;font-family:inherit;width:100%;max-width:380px;" onclick="window.firebaseSync.logout()">Sair da conta</button>';

        container.innerHTML = html;

        // Bind events — Farm list
        container.querySelectorAll('.fazenda-list-item').forEach(function (btn) {
            btn.addEventListener('click', function () {
                var id = this.getAttribute('data-id');
                var nome = this.getAttribute('data-nome');
                self.trocarFazenda(id, nome);
                self._showApp();
            });
        });

        // Bind — Create farm
        var createBtn = document.getElementById('fazenda-create-btn');
        if (createBtn) {
            createBtn.addEventListener('click', function () {
                var nome = (document.getElementById('fazenda-new-nome') || {}).value;
                if (!nome) { if (window.app) window.app.showToast('Digite o nome da fazenda', 'error'); return; }
                self.criarFazenda(nome).then(function () {
                    self._showApp();
                });
            });
        }

        // Bind — Join by code
        var joinBtn = document.getElementById('fazenda-join-btn');
        if (joinBtn) {
            joinBtn.addEventListener('click', function () {
                var code = (document.getElementById('fazenda-code-input') || {}).value;
                if (!code) {
                    var errEl = document.getElementById('fazenda-join-error');
                    if (errEl) errEl.textContent = 'Digite o código de convite';
                    else if (window.app) window.app.showToast('Digite o código', 'error');
                    return;
                }
                self.entrarFazenda(code).then(function () {
                    self._showApp();
                }).catch(function (err) {
                    var errEl = document.getElementById('fazenda-join-error');
                    if (errEl) errEl.textContent = 'Código inválido ou fazenda não encontrada';
                    else if (window.app) window.app.showToast('Código inválido', 'error');
                });
            });
        }

        // Bind — Show admin section
        var showAdmin = document.getElementById('fazenda-show-admin');
        if (showAdmin) {
            showAdmin.addEventListener('click', function () {
                var sec = document.getElementById('fazenda-admin-section');
                if (sec) sec.style.display = sec.style.display === 'none' ? 'block' : 'none';
            });
        }
    },

    // ══ LOGOUT ══
    logout: function () {
        var self = this;
        this.auth.signOut().then(function () {
            self.user = null;
            self.fazendaId = null;
            self.fazendaNome = null;
            self._appReady = false;
            if (self.unsubscribe) {
                self.unsubscribe();
                self.unsubscribe = null;
            }
            localStorage.removeItem(self.SYNC_KEY);
            localStorage.removeItem('agromacro_user_perfil');
            localStorage.removeItem('agromacro_perfil_override');
            self._updateLoginUI(false);
            self._showLogin();
        });
    },

    // ══ CRIAR FAZENDA ══
    criarFazenda: function (nomeFazenda) {
        var self = this;
        if (!this.user) {
            if (window.app) window.app.showToast('Faça login primeiro', 'error');
            return Promise.reject('Not logged in');
        }

        // Generate 6-char invite code
        var codigo = this._gerarCodigo();

        return this.db.collection('fazendas').add({
            nome: nomeFazenda,
            codigo: codigo,
            dono: this.user.uid,
            donoEmail: this.user.email,
            membros: [this.user.uid],
            membrosInfo: [{
                uid: this.user.uid,
                email: this.user.email,
                nome: this.user.displayName || this.user.email,
                perfil: 'dono'
            }],
            criadoEm: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function (docRef) {
            self.fazendaId = docRef.id;
            self.fazendaNome = nomeFazenda;
            self._saveSyncConfig();

            // Save user profile
            self.db.collection('usuarios').doc(self.user.uid).set({
                email: self.user.email,
                nome: self.user.displayName,
                fazendaAtual: docRef.id,
                fazendas: firebase.firestore.FieldValue.arrayUnion(docRef.id)
            }, { merge: true });

            // Sync existing local data to this farm
            self.syncLocalToFirestore();

            if (window.app) window.app.showToast('✅ Fazenda "' + nomeFazenda + '" criada! Código: ' + codigo);
            return { id: docRef.id, codigo: codigo };
        });
    },

    // ══ ENTRAR EM FAZENDA (por código) ══
    entrarFazenda: function (codigo) {
        var self = this;
        if (!this.user) {
            if (window.app) window.app.showToast('Faça login primeiro', 'error');
            return Promise.reject('Not logged in');
        }

        return this.db.collection('fazendas')
            .where('codigo', '==', codigo.toUpperCase())
            .get()
            .then(function (snapshot) {
                if (snapshot.empty) {
                    if (window.app) window.app.showToast('❌ Código não encontrado', 'error');
                    return Promise.reject('Code not found');
                }

                var doc = snapshot.docs[0];
                var fazenda = doc.data();

                // Add user as member
                return doc.ref.update({
                    membros: firebase.firestore.FieldValue.arrayUnion(self.user.uid),
                    membrosInfo: firebase.firestore.FieldValue.arrayUnion({
                        uid: self.user.uid,
                        email: self.user.email,
                        nome: self.user.displayName || self.user.email,
                        perfil: 'peao'
                    })
                }).then(function () {
                    self.fazendaId = doc.id;
                    self.fazendaNome = fazenda.nome;
                    self._saveSyncConfig();

                    // Save user profile
                    self.db.collection('usuarios').doc(self.user.uid).set({
                        email: self.user.email,
                        nome: self.user.displayName,
                        fazendaAtual: doc.id,
                        fazendas: firebase.firestore.FieldValue.arrayUnion(doc.id)
                    }, { merge: true });

                    // Load farm data from Firestore
                    self.loadFromFirestore();

                    if (window.app) window.app.showToast('✅ Entrou em "' + fazenda.nome + '"!');
                    return { id: doc.id, nome: fazenda.nome };
                });
            });
    },

    // ══ SYNC LOCAL → FIRESTORE ══
    syncLocalToFirestore: function () {
        if (!this.db || !this.fazendaId || !this.user || this._isSyncing) return;

        var self = this;
        var events = window.data ? window.data.events : [];
        if (events.length === 0) return;

        var cfg = window.agromacroConfig || {};
        var appCfg = cfg.app || {};
        var chunkSize = parseInt(appCfg.batchSize, 10) || 50;
        if (chunkSize > 500) chunkSize = 500;
        if (chunkSize < 1) chunkSize = 50;

        console.log('[Sync] Uploading ' + events.length + ' events to Firestore (chunkSize=' + chunkSize + ')...');

        self._isSyncing = true;
        self._updateSyncDot('syncing');

        var prepared = events.map(function (ev) {
            return self._prepareEventForSync(ev);
        });

        var ref = this.db.collection('fazendas').doc(this.fazendaId).collection('events');
        var totalChunks = Math.ceil(prepared.length / chunkSize);
        var chunkIndex = 0;

        var commitNextChunk = function () {
            if (chunkIndex >= totalChunks) {
                self._isSyncing = false;
                self._updateSyncDot('synced');
                console.log('[Sync] ✅ ' + prepared.length + ' events synced to Firestore in ' + totalChunks + ' batch(es)');
                return;
            }

            var start = chunkIndex * chunkSize;
            var end = Math.min(start + chunkSize, prepared.length);
            var chunk = prepared.slice(start, end);
            var batch = self.db.batch();

            chunk.forEach(function (ev) {
                var docRef = ref.doc(ev.id);
                batch.set(docRef, ev, { merge: true });
            });

            batch.commit().then(function () {
                chunkIndex++;
                console.log('[Sync] Batch ' + chunkIndex + '/' + totalChunks + ' committed (' + chunk.length + ' events)');
                commitNextChunk();
            }).catch(function (err) {
                self._isSyncing = false;
                self._updateSyncDot('error');
                console.error('[Sync] ❌ Upload failed on batch ' + (chunkIndex + 1) + '/' + totalChunks + ':', err);
            });
        };

        commitNextChunk();
    },

    _prepareEventForSync: function (ev) {
        var prepared = Object.assign({}, ev);
        if (!prepared.id) {
            prepared.id = 'ev_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
        }
        if (!prepared.fazendaId && this.fazendaId) {
            prepared.fazendaId = this.fazendaId;
        }
        if (!prepared.updatedAt) {
            prepared.updatedAt = prepared.timestamp || Date.now();
        }

        if (!prepared._syncUpdatedAt) {
            prepared._syncUpdatedAt = this._toMillis(prepared.updatedAt || prepared.timestamp);
        }
        if (!prepared._syncUpdatedAt) prepared._syncUpdatedAt = Date.now();
        if (!prepared._syncDeviceId) prepared._syncDeviceId = this._getDeviceId();
        if (!prepared._syncUserId && this.user && this.user.uid) prepared._syncUserId = this.user.uid;
        if (!prepared._syncUserEmail && this.user && this.user.email) prepared._syncUserEmail = this.user.email;
        if (!prepared._syncUserPerfil) prepared._syncUserPerfil = this._getPerfilForSync();
        return prepared;
    },

    _toMillis: function (value) {
        if (value == null) return 0;
        if (typeof value === 'number') return value;
        if (typeof value === 'string') {
            var parsed = Date.parse(value);
            return isNaN(parsed) ? 0 : parsed;
        }
        return 0;
    },

    _getPerfilForSync: function () {
        try {
            var cached = localStorage.getItem('agromacro_user_perfil');
            if (cached) return this._normalizePerfil(cached);
        } catch (e) { }
        return 'admin';
    },

    _perfilRank: function (perfil) {
        var p = this._normalizePerfil(perfil);
        if (p === 'dono') return 3;
        if (p === 'admin') return 2;
        return 1;
    },

    _getDeviceId: function () {
        try {
            var existing = localStorage.getItem(this.DEVICE_KEY);
            if (existing) return existing;
            var generated = 'dv_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
            localStorage.setItem(this.DEVICE_KEY, generated);
            return generated;
        } catch (e) {
            return 'dv_fallback';
        }
    },

    // Regras deterministicas: updatedAt -> perfil -> deviceId -> source(remote)
    _resolveConflict: function (localEv, remoteEv) {
        if (!localEv) return { winner: remoteEv, reason: 'new_remote' };
        if (!remoteEv) return { winner: localEv, reason: 'keep_local' };

        var localPrepared = this._prepareEventForSync(localEv);
        var remotePrepared = this._prepareEventForSync(remoteEv);

        var localTs = localPrepared._syncUpdatedAt || this._toMillis(localPrepared.timestamp);
        var remoteTs = remotePrepared._syncUpdatedAt || this._toMillis(remotePrepared.timestamp);
        if (remoteTs > localTs) return { winner: remotePrepared, reason: 'remote_newer_timestamp' };
        if (localTs > remoteTs) return { winner: localPrepared, reason: 'local_newer_timestamp' };

        var localPerfilRank = this._perfilRank(localPrepared._syncUserPerfil);
        var remotePerfilRank = this._perfilRank(remotePrepared._syncUserPerfil);
        if (remotePerfilRank > localPerfilRank) return { winner: remotePrepared, reason: 'remote_higher_role' };
        if (localPerfilRank > remotePerfilRank) return { winner: localPrepared, reason: 'local_higher_role' };

        var localDevice = '' + (localPrepared._syncDeviceId || '');
        var remoteDevice = '' + (remotePrepared._syncDeviceId || '');
        if (remoteDevice > localDevice) return { winner: remotePrepared, reason: 'remote_device_tiebreak' };
        if (localDevice > remoteDevice) return { winner: localPrepared, reason: 'local_device_tiebreak' };

        return { winner: remotePrepared, reason: 'remote_default_tiebreak' };
    },

    _recordMergeDecision: function (id, winnerSource, reason, localEv, remoteEv) {
        try {
            var logs = JSON.parse(localStorage.getItem(this.MERGE_LOG_KEY) || '[]');
            var prevLen = logs.length;
            logs.push({
                id: id,
                winner: winnerSource,
                reason: reason,
                timestamp: new Date().toISOString(),
                localUpdatedAt: localEv ? (localEv._syncUpdatedAt || localEv.updatedAt || localEv.timestamp || '') : '',
                remoteUpdatedAt: remoteEv ? (remoteEv._syncUpdatedAt || remoteEv.updatedAt || remoteEv.timestamp || '') : '',
                localDevice: localEv ? (localEv._syncDeviceId || '') : '',
                remoteDevice: remoteEv ? (remoteEv._syncDeviceId || '') : ''
            });
            if (logs.length > 2000) logs = logs.slice(-2000);
            localStorage.setItem(this.MERGE_LOG_KEY, JSON.stringify(logs));
            if (prevLen <= 1500 && logs.length > 1500) {
                if (window.app && window.app.showToast) {
                    window.app.showToast('⚠️ Histórico de merge: ' + logs.length + '/2000 entradas', 'warning');
                }
            }
        } catch (e) { }
    },

    _updateSyncDot: function (state) {
        var dot = document.getElementById('sync-dot');
        if (!dot) return;
        var states = ['offline', 'syncing', 'synced', 'error'];
        states.forEach(function (s) { dot.classList.remove('sync-dot--' + s); });
        dot.classList.add('sync-dot--' + state);
        var labels = { offline: 'Offline', syncing: 'Sincronizando…', synced: 'Sincronizado', error: 'Erro de sync' };
        dot.title = labels[state] || state;
        // Auto-reset 'synced' to subtle after 4s
        if (state === 'synced') {
            clearTimeout(this._syncDotTimer);
            var self = this;
            this._syncDotTimer = setTimeout(function () {
                var d = document.getElementById('sync-dot');
                if (d) { d.classList.remove('sync-dot--synced'); }
            }, 4000);
        }
        // Update pending-events badge
        this._updateSyncBadge();
    },

    _updateSyncBadge: function () {
        var dot = document.getElementById('sync-dot');
        if (!dot) return;
        var badge = document.getElementById('sync-pending-badge');
        var pending = 0;
        if (window.data && window.data.events && !this.isOnline) {
            // Count events modified after last known sync (no _syncDeviceId from remote = locally created)
            var deviceId = this._getDeviceId();
            pending = window.data.events.filter(function (ev) {
                return ev._syncDeviceId === deviceId && !ev._remoteConfirmed;
            }).length;
        }
        if (pending > 0) {
            if (!badge) {
                badge = document.createElement('span');
                badge.id = 'sync-pending-badge';
                badge.style.cssText = 'position:absolute;top:-3px;right:-3px;min-width:14px;height:14px;'
                    + 'background:#EF4444;color:#fff;border-radius:10px;font-size:9px;font-weight:800;'
                    + 'display:flex;align-items:center;justify-content:center;padding:0 3px;'
                    + 'box-shadow:0 0 0 2px var(--bg-1,#fff);pointer-events:none;';
                // Wrap dot in relative container if not already
                if (!dot.parentElement || dot.parentElement.style.position !== 'relative') {
                    var wrap = document.createElement('span');
                    wrap.style.cssText = 'position:relative;display:inline-flex;align-items:center;';
                    dot.parentNode.insertBefore(wrap, dot);
                    wrap.appendChild(dot);
                }
                dot.parentElement.appendChild(badge);
            }
            badge.textContent = pending > 99 ? '99+' : ('' + pending);
            badge.style.display = 'flex';
        } else if (badge) {
            badge.style.display = 'none';
        }
    },

    // ══ LOAD FROM FIRESTORE → LOCAL ══
    loadFromFirestore: function () {
        if (!this.db || !this.fazendaId) return;

        var self = this;
        var ref = this.db.collection('fazendas').doc(this.fazendaId).collection('events');

        ref.get().then(function (snapshot) {
            if (snapshot.empty) {
                console.log('[Sync] No events in Firestore');
                return;
            }

            var events = [];
            snapshot.forEach(function (doc) {
                events.push(doc.data());
            });

            // Merge with local: deterministic conflict resolution
            var localEvents = window.data ? window.data.events : [];
            var mergedMap = {};

            // Add all local events
            localEvents.forEach(function (ev) {
                mergedMap[ev.id] = ev;
            });

            // Merge remote events with deterministic tie-breaks
            events.forEach(function (ev) {
                var localEv = mergedMap[ev.id];
                var remoteEv = Object.assign({}, ev, { _remoteConfirmed: true });
                var result = self._resolveConflict(localEv, remoteEv);
                if (result.winner) result.winner._remoteConfirmed = true;
                mergedMap[ev.id] = result.winner;
                if (localEv && result.winner && result.reason.indexOf('remote_') === 0) {
                    self._recordMergeDecision(ev.id, 'remote', result.reason, localEv, ev);
                }
            });

            // Save merged events to local
            var merged = Object.values(mergedMap);
            if (window.data) {
                window.data.events = merged;
                window.data.save();
                self._updateSyncDot('synced');
                console.log('[Sync] ✅ Loaded ' + merged.length + ' events (merged)');

                // Refresh current view
                if (window.app && window.app.currentPage) {
                    window.app.navigate(window.app.currentPage);
                }
            }
        }).catch(function (err) {
            self._updateSyncDot('error');
            console.error('[Sync] ❌ Load from Firestore failed:', err);
        });
    },

    // ══ REAL-TIME LISTENER ══
    startRealtimeSync: function () {
        if (!this.db || !this.fazendaId) return;
        if (this.unsubscribe) this.unsubscribe();

        var self = this;
        var ref = this.db.collection('fazendas').doc(this.fazendaId).collection('events');

        this.unsubscribe = ref.onSnapshot(function (snapshot) {
            if (snapshot.metadata.hasPendingWrites) return; // Skip local writes

            var changes = 0;
            snapshot.docChanges().forEach(function (change) {
                if (change.type === 'added' || change.type === 'modified') {
                    var ev = change.doc.data();
                    var idx = -1;
                    for (var i = 0; i < window.data.events.length; i++) {
                        if (window.data.events[i].id === ev.id) { idx = i; break; }
                    }
                    if (idx >= 0) {
                        var localEv = window.data.events[idx];
                        var remoteEvRt = Object.assign({}, ev, { _remoteConfirmed: true });
                        var result = self._resolveConflict(localEv, remoteEvRt);
                        if (result.winner) result.winner._remoteConfirmed = true;
                        window.data.events[idx] = result.winner;
                        if (result.winner && result.reason.indexOf('remote_') === 0) {
                            self._recordMergeDecision(ev.id, 'remote', result.reason, localEv, ev);
                        }
                    } else {
                        var newEv = Object.assign({}, self._prepareEventForSync(ev), { _remoteConfirmed: true });
                        window.data.events.push(newEv);
                                self._updateSyncBadge();
                                self._updateSyncBadge();
                    }
                    changes++;
                }
            });

            if (changes > 0) {
                window.data.save();
                console.log('[Sync] Real-time: ' + changes + ' changes received');
                // Refresh view
                if (window.app && window.app.currentPage) {
                    window.app.navigate(window.app.currentPage);
                }
            }
        }, function (err) {
            console.error('[Sync] Real-time listener error:', err);
        });
    },

    // ══ HOOK INTO DATA.JS — intercept saves ══
    hookDataSave: function () {
        var self = this;
        var originalSaveEvent = window.data.saveEvent.bind(window.data);

        window.data.saveEvent = function (ev) {
            var savedEv = originalSaveEvent(ev);
            var preparedEv = self._prepareEventForSync(savedEv);

            // Persist migração local para novos eventos sem fazendaId
            if (window.data && Array.isArray(window.data.events)) {
                for (var i = 0; i < window.data.events.length; i++) {
                    if (window.data.events[i].id === preparedEv.id) {
                        window.data.events[i] = preparedEv;
                        break;
                    }
                }
            }

            // Also save to Firestore if connected
            if (self.db && self.fazendaId && self.user) {
                var ref = self.db.collection('fazendas').doc(self.fazendaId).collection('events');
                ref.doc(preparedEv.id).set(preparedEv, { merge: true }).catch(function (err) {
                    console.warn('[Sync] Firestore write queued (offline):', err.code);
                });
            }

            return preparedEv;
        };
    },

    // ══ GET MINHAS FAZENDAS ══
    getMinhasFazendas: function () {
        if (!this.user || !this.db) return Promise.resolve([]);

        return this.db.collection('fazendas')
            .where('membros', 'array-contains', this.user.uid)
            .get()
            .then(function (snapshot) {
                var fazendas = [];
                snapshot.forEach(function (doc) {
                    var data = doc.data();
                    data.id = doc.id;
                    fazendas.push(data);
                });
                return fazendas;
            });
    },

    // ══ GET USER PROFILE FROM FIRESTORE ══
    getUserPerfil: function () {
        if (!this.user || !this.db || !this.fazendaId) return 'admin';

        // Check membrosInfo for this user's profile
        var self = this;
        try {
            var cachedPerfil = localStorage.getItem('agromacro_user_perfil');
            if (cachedPerfil) return this._normalizePerfil(cachedPerfil);
        } catch (e) { }

        return 'admin'; // Default until async load
    },

    // ══ LOAD USER PROFILE ASYNC ══
    loadUserPerfil: function (callback) {
        if (!this.user || !this.db || !this.fazendaId) {
            if (callback) callback('admin');
            return;
        }

        var self = this;
        this.db.collection('fazendas').doc(this.fazendaId).get().then(function (doc) {
            if (!doc.exists) { if (callback) callback('admin'); return; }

            var data = doc.data();
            var perfil = 'peao'; // Default for non-owners

            // Owner is always dono
            if (data.dono === self.user.uid) {
                perfil = 'dono';
            } else if (data.membrosInfo) {
                // Check membrosInfo
                for (var i = 0; i < data.membrosInfo.length; i++) {
                    if (data.membrosInfo[i].uid === self.user.uid) {
                        perfil = data.membrosInfo[i].perfil || 'peao';
                        break;
                    }
                }
            }

            perfil = self._normalizePerfil(perfil);
            try { localStorage.setItem('agromacro_user_perfil', perfil); } catch (e) { }
            if (callback) callback(perfil);
        }).catch(function () {
            if (callback) callback('admin');
        });
    },

    // ══ TROCAR FAZENDA ══
    trocarFazenda: function (fazendaId, fazendaNome) {
        this.fazendaId = fazendaId;
        this.fazendaNome = fazendaNome;
        this._saveSyncConfig();

        // Clear local data for new farm
        if (window.data) {
            window.data.events = [];
            window.data.save();
        }

        // Load farm's data
        this.loadFromFirestore();
        this.startRealtimeSync();
        this.hookDataSave();

        if (window.app) {
            window.app.showToast('🏠 Fazenda: ' + fazendaNome);
            window.app.navigate('home');
        }
    },

    // ══ PRIVATE HELPERS ══
    _gerarCodigo: function () {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var code = '';
        var arr = new Uint8Array(6);
        crypto.getRandomValues(arr);
        for (var i = 0; i < 6; i++) {
            code += chars.charAt(arr[i] % chars.length);
        }
        return code;
    },

    _saveSyncConfig: function () {
        try {
            localStorage.setItem(this.SYNC_KEY, JSON.stringify({
                fazendaId: this.fazendaId,
                fazendaNome: this.fazendaNome,
                userEmail: this.user ? this.user.email : ''
            }));
        } catch (e) { }
    },

    _loadSyncConfig: function () {
        try {
            var cfg = JSON.parse(localStorage.getItem(this.SYNC_KEY) || '{}');
            if (cfg.fazendaId) {
                this.fazendaId = cfg.fazendaId;
                this.fazendaNome = cfg.fazendaNome;

                // If logged in, start syncing
                if (this.user) {
                    this.hookDataSave();
                    this.loadFromFirestore();
                    this.startRealtimeSync();
                }
            }
        } catch (e) { }
    },

    _updateLoginUI: function (loggedIn) {
        var _esc = window.data.escapeHtml;
        // Update farm indicator on home
        var indicator = document.getElementById('farm-indicator');
        if (indicator) {
            if (loggedIn && this.fazendaNome) {
                indicator.innerHTML = '<span style="font-size:11px;color:#059669;font-weight:600;">🌐 ' + _esc(this.fazendaNome) + ' • Sincronizado</span>';
                indicator.style.display = 'block';
            } else if (loggedIn) {
                indicator.innerHTML = '<span style="font-size:11px;color:#D97706;font-weight:600;">⚠️ Selecione uma fazenda</span>';
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        }

        // Update config section user info
        var userInfo = document.getElementById('config-user-info');
        var logoutBtn = document.getElementById('config-logout-btn');
        if (userInfo) {
            if (loggedIn && this.user) {
                var html = '<div style="display:flex;align-items:center;gap:10px;padding:8px 0;">';
                if (this.user.photoURL) {
                    html += '<img src="' + _esc(this.user.photoURL) + '" style="width:36px;height:36px;border-radius:50%;border:2px solid var(--primary);" onerror="this.style.display=\'none\'">';
                } else {
                    html += '<div style="width:36px;height:36px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;font-size:16px;color:#fff;">👤</div>';
                }
                html += '<div>';
                html += '<div style="font-size:14px;font-weight:700;color:var(--text-0);">' + _esc(this.user.displayName || 'Usuário') + '</div>';
                html += '<div style="font-size:11px;color:var(--text-2);">' + _esc(this.user.email || '') + '</div>';
                if (this.fazendaNome) {
                    html += '<div style="font-size:11px;color:#059669;font-weight:600;margin-top:2px;">🌐 ' + _esc(this.fazendaNome) + '</div>';
                }
                html += '</div></div>';
                userInfo.innerHTML = html;
            } else {
                userInfo.innerHTML = '<p style="font-size:13px; color:var(--text-2);">Não logado — <a style="color:var(--primary);cursor:pointer;" onclick="window.firebaseSync._showLogin()">Fazer login</a></p>';
            }
        }
        if (logoutBtn) {
            logoutBtn.style.display = loggedIn ? 'block' : 'none';
        }
    },

    // ══ RENDER MEMBROS DA FAZENDA (admin dashboard) ══
    renderMembros: function () {
        var container = document.getElementById('admin-membros-list');
        if (!container) return;
        if (!this.db || !this.fazendaId) {
            container.innerHTML = '<p style="font-size:12px;color:var(--text-3);">Faça login e selecione uma fazenda para ver membros.</p>';
            return;
        }
        container.innerHTML = '<p style="font-size:12px;color:var(--text-3);">Carregando membros…</p>';
        var self = this;
        this.db.collection('fazendas').doc(this.fazendaId).get().then(function (doc) {
            if (!doc.exists) {
                container.innerHTML = '<p style="font-size:12px;color:var(--red);">Fazenda não encontrada.</p>';
                return;
            }
            var data = doc.data();
            var membros = data.membrosInfo || [];
            if (membros.length === 0) {
                container.innerHTML = '<p style="font-size:12px;color:var(--text-3);">Nenhum membro registrado.</p>';
                return;
            }
            // Is current user the dono?
            var isDono = self.user && data.dono && self.user.uid === data.dono;
            var colors = {
                dono:  { bg:'#FEF3C7', fg:'#D97706' },
                admin: { bg:'#DBEAFE', fg:'#2563EB' },
                peao:  { bg:'#F3F4F6', fg:'#6B7280' }
            };
            var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
            membros.forEach(function (m) {
                var c = colors[m.perfil] || colors.peao;
                var initials = (m.nome || m.email || '?').charAt(0).toUpperCase();
                var nome = (m.nome || m.email || 'Usuário').replace(/</g, '&lt;');
                var email = (m.email || '').replace(/</g, '&lt;');
                var perfil = (m.perfil || 'peao').replace(/</g, '&lt;');
                var isSelf = self.user && m.uid === self.user.uid;
                var uidEsc = (m.uid || '').replace(/'/g, '');
                html += '<div style="display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg-3);border-radius:10px;">'
                    + '<div style="width:34px;height:34px;border-radius:50%;background:var(--primary-surface);color:var(--primary);display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;flex-shrink:0;">' + initials + '</div>'
                    + '<div style="flex:1;min-width:0;">'
                    +   '<div style="font-size:13px;font-weight:700;color:var(--text-0);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + nome + (isSelf ? ' <span style="font-size:10px;color:var(--primary);">(você)</span>' : '') + '</div>'
                    +   '<div style="font-size:11px;color:var(--text-3);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' + email + '</div>'
                    + '</div>'
                    + '<span style="padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:' + c.bg + ';color:' + c.fg + ';">' + perfil + '</span>';
                // Dono management actions (not for self, not for other dono)
                if (isDono && !isSelf && m.perfil !== 'dono') {
                    var nextPerfil = m.perfil === 'admin' ? 'peao' : 'admin';
                    var nextLabel = m.perfil === 'admin' ? '↓ Peao' : '↑ Admin';
                    html += '<div style="display:flex;gap:4px;flex-shrink:0;">'
                        + '<button onclick="window.firebaseSync._alterarPerfilMembro(\'' + uidEsc + '\',\'' + nextPerfil + '\')" '
                        +   'style="padding:4px 8px;font-size:10px;font-weight:700;border:1.5px solid var(--border-default);border-radius:6px;background:var(--bg-1);color:var(--primary);cursor:pointer;">' + nextLabel + '</button>'
                        + '<button onclick="window.firebaseSync._removerMembro(\'' + uidEsc + '\',\'' + nome.replace(/'/g,'').slice(0,20) + '\')" '
                        +   'style="padding:4px 8px;font-size:10px;font-weight:700;border:1.5px solid rgba(220,38,38,0.3);border-radius:6px;background:var(--red-surface,#FEF2F2);color:var(--red,#DC2626);cursor:pointer;">X</button>'
                        + '</div>';
                }
                html += '</div>';
            });
            html += '</div>';
            html += '<p style="font-size:11px;color:var(--text-3);margin-top:8px;">' + membros.length + ' membro(s) • ' + (data.nome || self.fazendaNome || self.fazendaId) + '</p>';
            container.innerHTML = html;
        }).catch(function (err) {
            container.innerHTML = '<p style="font-size:12px;color:var(--red);">Erro ao carregar membros.</p>';
            console.error('[Admin] renderMembros error:', err);
        });
    },

    _alterarPerfilMembro: function (uid, novoPerfil) {
        if (!this.db || !this.fazendaId || !uid) return;
        var self = this;
        var perfilValido = { admin: true, peao: true };
        if (!perfilValido[novoPerfil]) return;
        var ref = this.db.collection('fazendas').doc(this.fazendaId);
        ref.get().then(function (doc) {
            if (!doc.exists) return;
            var membrosInfo = (doc.data().membrosInfo || []).map(function (m) {
                if (m.uid === uid) return Object.assign({}, m, { perfil: novoPerfil });
                return m;
            });
            return ref.update({ membrosInfo: membrosInfo });
        }).then(function () {
            if (window.app && window.app.showToast) window.app.showToast('✅ Perfil atualizado para ' + novoPerfil, 'success');
            window.firebaseSync.renderMembros();
        }).catch(function (err) {
            if (window.app && window.app.showToast) window.app.showToast('❌ Erro ao alterar perfil', 'error');
            console.error('[Admin] _alterarPerfilMembro error:', err);
        });
    },

    _removerMembro: function (uid, nomeDisplay) {
        if (!this.db || !this.fazendaId || !uid) return;
        // Prevent removing self
        if (this.user && uid === this.user.uid) {
            if (window.app && window.app.showToast) window.app.showToast('Use “Sair da conta” para sair da fazenda.', 'warning');
            return;
        }
        if (!confirm('Remover ' + (nomeDisplay || 'membro') + ' da fazenda?')) return;
        var self = this;
        var ref = this.db.collection('fazendas').doc(this.fazendaId);
        ref.get().then(function (doc) {
            if (!doc.exists) return;
            var data = doc.data();
            var membrosInfo = (data.membrosInfo || []).filter(function (m) { return m.uid !== uid; });
            var membros = (data.membros || []).filter(function (id) { return id !== uid; });
            return ref.update({ membrosInfo: membrosInfo, membros: membros });
        }).then(function () {
            if (window.app && window.app.showToast) window.app.showToast('✅ Membro removido', 'success');
            window.firebaseSync.renderMembros();
        }).catch(function (err) {
            if (window.app && window.app.showToast) window.app.showToast('❌ Erro ao remover membro', 'error');
            console.error('[Admin] _removerMembro error:', err);
        });
    },

    // ══ RENDER SYNC/LOGIN UI (for config page) ══
    renderSyncUI: function (containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var self = this;
        var _esc = window.data.escapeHtml;
        var _escCid = _esc(containerId);
        var html = '';

        if (!this.user) {
            // ── NOT LOGGED IN ──
            html += '<div style="text-align:center;padding:20px;">'
                + '<div style="font-size:48px;margin-bottom:12px;">🌐</div>'
                + '<div style="font-size:18px;font-weight:700;color:#1E293B;margin-bottom:8px;">Sincronizar Dados</div>'
                + '<div style="font-size:13px;color:#64748B;margin-bottom:20px;">Faça login para salvar seus dados na nuvem e sincronizar entre dispositivos.</div>'
                + '<button onclick="window.firebaseSync.loginGoogle()" style="'
                + 'display:flex;align-items:center;justify-content:center;gap:10px;'
                + 'width:100%;padding:14px 20px;border:2px solid #E2E8F0;border-radius:12px;'
                + 'background:#fff;font-size:15px;font-weight:600;color:#1E293B;cursor:pointer;'
                + 'transition:all 0.2s;">'
                + '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" style="width:24px;height:24px;" alt="Google">'
                + 'Entrar com Google'
                + '</button>'
                + '<div style="margin-top:16px;font-size:11px;color:#94A3B8;">Seus dados locais continuam funcionando offline.</div>'
                + '</div>';
        } else if (!this.fazendaId) {
            // ── LOGGED IN, NO FARM SELECTED ──
            html += '<div style="padding:16px;">'
                + '<div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">'
                + '<img src="' + _esc(this.user.photoURL || '') + '" style="width:40px;height:40px;border-radius:50%;border:2px solid #059669;" onerror="this.style.display=\'none\'">'
                + '<div>'
                + '<div style="font-size:14px;font-weight:700;color:#1E293B;">' + _esc(this.user.displayName || 'Usuário') + '</div>'
                + '<div style="font-size:11px;color:#64748B;">' + _esc(this.user.email || '') + '</div>'
                + '</div>'
                + '</div>';

            // Create new farm
            html += '<div style="background:rgba(5,150,105,0.06);border:2px solid #059669;border-radius:14px;padding:16px;margin-bottom:12px;">'
                + '<div style="font-size:14px;font-weight:700;color:#059669;margin-bottom:8px;">🏠 Criar Nova Fazenda</div>'
                + '<input type="text" id="sync-nome-fazenda" placeholder="Nome da fazenda..." '
                + 'style="width:100%;padding:10px 14px;border:1px solid #E2E8F0;border-radius:10px;font-size:14px;margin-bottom:8px;box-sizing:border-box;">'
                + '<button onclick="var n=document.getElementById(\'sync-nome-fazenda\').value;if(n)window.firebaseSync.criarFazenda(n).then(function(){window.firebaseSync.renderSyncUI(\'' + _escCid + '\');})" '
                + 'style="width:100%;padding:10px;background:#059669;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Criar Fazenda</button>'
                + '</div>';

            // Join existing farm
            html += '<div style="background:rgba(37,99,235,0.06);border:2px solid #2563EB;border-radius:14px;padding:16px;margin-bottom:12px;">'
                + '<div style="font-size:14px;font-weight:700;color:#2563EB;margin-bottom:8px;">🔗 Entrar em Fazenda (código)</div>'
                + '<input type="text" id="sync-codigo" placeholder="Código (ex: ABC123)" '
                + 'style="width:100%;padding:10px 14px;border:1px solid #E2E8F0;border-radius:10px;font-size:14px;margin-bottom:8px;text-transform:uppercase;box-sizing:border-box;">'
                + '<button onclick="var c=document.getElementById(\'sync-codigo\').value;if(c)window.firebaseSync.entrarFazenda(c).then(function(){window.firebaseSync.renderSyncUI(\'' + _escCid + '\');})" '
                + 'style="width:100%;padding:10px;background:#2563EB;color:#fff;border:none;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer;">Entrar</button>'
                + '</div>';

            html += '<button onclick="window.firebaseSync.logout();window.firebaseSync.renderSyncUI(\'' + _escCid + '\')" '
                + 'style="width:100%;padding:8px;background:none;border:1px solid #E2E8F0;color:#64748B;border-radius:8px;font-size:12px;cursor:pointer;">Sair da conta</button>'
                + '</div>';
        } else {
            // ── LOGGED IN + FARM SELECTED ──
            html += '<div style="padding:16px;">'
                + '<div style="background:linear-gradient(135deg,#059669,#10B981);border-radius:14px;padding:16px;color:#fff;margin-bottom:12px;">'
                + '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;opacity:0.8;">🌐 Fazenda Ativa</div>'
                + '<div style="font-size:22px;font-weight:800;margin-top:4px;">' + _esc(this.fazendaNome || 'Sem nome') + '</div>'
                + '<div style="font-size:11px;margin-top:4px;opacity:0.8;">' + _esc(this.user.email || '') + '</div>'
                + '</div>';

            // Sync status
            var evCount = window.data ? window.data.events.length : 0;
            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">'
                + '<div style="background:rgba(5,150,105,0.08);border-radius:10px;padding:10px;text-align:center;">'
                + '<div style="font-size:20px;font-weight:800;color:#059669;">' + evCount + '</div>'
                + '<div style="font-size:10px;color:#64748B;">Eventos</div>'
                + '</div>'
                + '<div style="background:rgba(37,99,235,0.08);border-radius:10px;padding:10px;text-align:center;">'
                + '<div style="font-size:20px;font-weight:800;color:#2563EB;">' + (this.isOnline ? '✅' : '📴') + '</div>'
                + '<div style="font-size:10px;color:#64748B;">' + (this.isOnline ? 'Online' : 'Offline') + '</div>'
                + '</div>'
                + '</div>';

            // Actions
            html += '<button onclick="window.firebaseSync.syncLocalToFirestore();window.app.showToast(\'Sincronizando...\')" '
                + 'style="width:100%;padding:10px;background:#2563EB;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px;">🔄 Forçar Sincronização</button>';

            // Get invite code
            html += '<button onclick="window.firebaseSync._mostrarConvite()" '
                + 'style="width:100%;padding:10px;background:#D97706;color:#fff;border:none;border-radius:10px;font-size:13px;font-weight:700;cursor:pointer;margin-bottom:8px;">📋 Código de Convite</button>';

            // Switch farm
            html += '<button onclick="window.firebaseSync._mostrarTrocarFazenda(\'' + _escCid + '\')" '
                + 'style="width:100%;padding:10px;background:none;border:1px solid #E2E8F0;color:#64748B;border-radius:10px;font-size:12px;cursor:pointer;margin-bottom:8px;">🔄 Trocar de Fazenda</button>';

            html += '<button onclick="window.firebaseSync.logout();window.firebaseSync.renderSyncUI(\'' + _escCid + '\')" '
                + 'style="width:100%;padding:8px;background:none;border:1px solid #FCA5A5;color:#DC2626;border-radius:8px;font-size:12px;cursor:pointer;">Sair da conta</button>'
                + '</div>';
        }

        container.innerHTML = html;
    },

    _mostrarConvite: function () {
        var self = this;
        if (!this.db || !this.fazendaId) return;
        this.db.collection('fazendas').doc(this.fazendaId).get().then(function (doc) {
            if (!doc.exists) return;
            var codigo = doc.data().codigo || '';
            var nomeFazenda = doc.data().nome || self.fazendaNome || 'Fazenda';
            var baseUrl = window.location.origin + window.location.pathname;
            var link = baseUrl + '?join=' + encodeURIComponent(codigo);

            // Build bottom-sheet modal
            var modal = document.createElement('div');
            modal.id = 'convite-modal';
            modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:20000;'
                + 'background:rgba(0,0,0,0.45);backdrop-filter:blur(6px);'
                + 'display:flex;align-items:flex-end;justify-content:center;'
                + 'animation:fadeIn 0.2s ease;';

            var sheet = document.createElement('div');
            sheet.style.cssText = 'background:var(--bg-1,#fff);border-radius:24px 24px 0 0;'
                + 'width:100%;max-width:640px;padding:28px 24px 40px;'
                + 'box-shadow:0 -6px 36px rgba(0,0,0,0.16);animation:sheetUp 0.32s var(--ease-out,ease);';

            var canShare = !!(navigator.share);
            sheet.innerHTML = '<div style="width:38px;height:5px;background:var(--bg-4,#e2e8f0);border-radius:3px;margin:0 auto 20px;"></div>'
                + '<div style="font-size:18px;font-weight:800;color:var(--text-0,#1E293B);margin-bottom:4px;">🔗 Convite para ' + nomeFazenda.replace(/</g,'&lt;') + '</div>'
                + '<div style="font-size:12px;color:var(--text-3,#94A3B8);margin-bottom:20px;">Compartilhe o link ou o código para novos membros entrarem.</div>'
                + '<div style="background:var(--bg-3,#F1F5F9);border-radius:12px;padding:16px;margin-bottom:12px;text-align:center;">'
                +   '<div style="font-size:11px;color:var(--text-3,#94A3B8);font-weight:700;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px;">Código de Acesso</div>'
                +   '<div style="font-size:32px;font-weight:900;color:var(--primary,#059669);letter-spacing:6px;font-family:monospace;">' + codigo.replace(/</g,'&lt;') + '</div>'
                + '</div>'
                + '<div style="background:var(--bg-3,#F1F5F9);border-radius:10px;padding:10px 14px;margin-bottom:16px;display:flex;align-items:center;gap:8px;">'
                +   '<div style="font-size:11px;color:var(--text-2,#64748B);word-break:break-all;flex:1;">' + link.replace(/</g,'&lt;') + '</div>'
                +   '<button id="convite-copy-btn" onclick="window.firebaseSync._copiarConvite(\'' + encodeURIComponent(link) + '\')" '
                +     'style="padding:6px 12px;background:var(--primary,#059669);color:#fff;border:none;border-radius:8px;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;">Copiar</button>'
                + '</div>'
                + (canShare
                    ? '<button onclick="window.firebaseSync._nativeShare(\'' + encodeURIComponent(link) + '\',\'' + encodeURIComponent(codigo) + '\',\'' + encodeURIComponent(nomeFazenda) + '\')" '
                    +   'style="width:100%;padding:13px;background:var(--primary,#059669);color:#fff;border:none;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;margin-bottom:8px;">📤 Compartilhar</button>'
                    : '')
                + '<button onclick="document.getElementById(\'convite-modal\').remove()" '
                +   'style="width:100%;padding:10px;background:none;border:1.5px solid var(--border-default,#E2E8F0);color:var(--text-2,#64748B);border-radius:10px;font-size:13px;cursor:pointer;">Fechar</button>';

            modal.appendChild(sheet);
            modal.addEventListener('click', function (e) { if (e.target === modal) modal.remove(); });

            // Remove previous if exists
            var prev = document.getElementById('convite-modal');
            if (prev) prev.remove();
            document.body.appendChild(modal);
        });
    },

    _copiarConvite: function (encodedLink) {
        var link = decodeURIComponent(encodedLink);
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(link).then(function () {
                if (window.app && window.app.showToast) window.app.showToast('✅ Link copiado!', 'success');
            }).catch(function () {
                if (window.app && window.app.showToast) window.app.showToast('Copie manualmente: ' + link, 'info');
            });
        } else {
            // Fallback: textarea select
            var ta = document.createElement('textarea');
            ta.value = link;
            ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
            document.body.appendChild(ta);
            ta.select();
            try { document.execCommand('copy'); if (window.app && window.app.showToast) window.app.showToast('✅ Link copiado!', 'success'); }
            catch (e) { if (window.app && window.app.showToast) window.app.showToast('Copie manualmente: ' + link, 'info'); }
            document.body.removeChild(ta);
        }
    },

    _nativeShare: function (encodedLink, encodedCodigo, encodedNome) {
        var link = decodeURIComponent(encodedLink);
        var codigo = decodeURIComponent(encodedCodigo);
        var nome = decodeURIComponent(encodedNome);
        if (navigator.share) {
            navigator.share({
                title: 'AgroMacro — ' + nome,
                text: 'Entre na fazenda "' + nome + '" no AgroMacro. Código: ' + codigo,
                url: link
            }).catch(function () { /* user cancelled */ });
        }
    },

    _mostrarCodigo: function () {
        if (!this.db || !this.fazendaId) return;
        var self = this;
        this.db.collection('fazendas').doc(this.fazendaId).get().then(function (doc) {
            if (doc.exists) {
                var codigo = doc.data().codigo;
                alert('📋 Código de convite:\n\n' + codigo + '\n\nCompartilhe este código para os funcionários entrarem na fazenda.');
            }
        });
    },

    _mostrarTrocarFazenda: function (containerId) {
        var self = this;
        var _esc = window.data.escapeHtml;
        this.getMinhasFazendas().then(function (fazendas) {
            var container = document.getElementById(containerId);
            if (!container) return;

            var cidEsc = _esc(containerId);
            var html = '<div style="padding:16px;">'
                + '<div style="font-size:16px;font-weight:700;margin-bottom:12px;">🏠 Suas Fazendas</div>';

            fazendas.forEach(function (f) {
                var isActive = f.id === self.fazendaId;
                var fidEsc = _esc(f.id || '');
                var fnomeEsc = _esc(f.nome || '');
                var fcodigoEsc = _esc(f.codigo || '--');
                html += '<button class="troca-fazenda-btn"'
                    + ' data-fid="' + fidEsc + '"'
                    + ' data-fname="' + fnomeEsc + '"'
                    + ' data-cid="' + cidEsc + '"'
                    + ' style="width:100%;padding:12px;background:' + (isActive ? 'rgba(5,150,105,0.1)' : '#fff') + ';'
                    + 'border:2px solid ' + (isActive ? '#059669' : '#E2E8F0') + ';border-radius:10px;margin-bottom:8px;'
                    + 'text-align:left;cursor:pointer;font-size:14px;font-weight:600;color:#1E293B;">'
                    + (isActive ? '✅ ' : '') + fnomeEsc
                    + '<span style="display:block;font-size:11px;color:#64748B;font-weight:400;margin-top:2px;">'
                    + (f.membros ? f.membros.length : 0) + ' membro(s) • Código: ' + fcodigoEsc
                    + '</span></button>';
            });

            html += '<button class="troca-fazenda-voltar"'
                + ' data-cid="' + cidEsc + '"'
                + ' style="width:100%;padding:8px;margin-top:4px;background:none;border:1px solid #E2E8F0;color:#64748B;border-radius:8px;font-size:12px;cursor:pointer;">← Voltar</button>'
                + '</div>';

            container.innerHTML = html;

            container.querySelectorAll('.troca-fazenda-btn').forEach(function (btn) {
                btn.addEventListener('click', function () {
                    var fid = this.getAttribute('data-fid');
                    var fname = this.getAttribute('data-fname');
                    var cid = this.getAttribute('data-cid');
                    self.trocarFazenda(fid, fname);
                    self.renderSyncUI(cid);
                });
            });

            var voltarBtn = container.querySelector('.troca-fazenda-voltar');
            if (voltarBtn) {
                voltarBtn.addEventListener('click', function () {
                    self.renderSyncUI(this.getAttribute('data-cid'));
                });
            }
        });
    }
};
