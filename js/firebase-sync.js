// ====== FIREBASE-SYNC.JS — Auth + Firestore Sync (Offline-First) ======
window.firebaseSync = {
    db: null,
    auth: null,
    user: null,
    fazendaId: null,
    fazendaNome: null,
    isOnline: navigator.onLine,
    SYNC_KEY: 'agromacro_sync_config',
    unsubscribe: null,
    _isRegisterMode: false,
    _appReady: false,

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

        // Firebase config
        var firebaseConfig = {
            apiKey: "AIzaSyAQgFA5Ea3AYkk1IZ-0d3Jb1j8aiaugX5U",
            authDomain: "fazenda-antares.firebaseapp.com",
            projectId: "fazenda-antares",
            storageBucket: "fazenda-antares.firebasestorage.app",
            messagingSenderId: "1019641259951",
            appId: "1:1019641259951:web:c0bd2c970c1001b740f15a"
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
            self.syncLocalToFirestore();
        });
        window.addEventListener('offline', function () {
            self.isOnline = false;
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
            self._showLoginError('Erro no login Google: ' + err.message);
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
            'auth/invalid-credential': 'Email ou senha incorretos.'
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
        if (!this.db || !this.fazendaId || !this.user) return;

        var self = this;
        var events = window.data ? window.data.events : [];
        if (events.length === 0) return;

        console.log('[Sync] Uploading ' + events.length + ' events to Firestore...');

        var batch = this.db.batch();
        var ref = this.db.collection('fazendas').doc(this.fazendaId).collection('events');

        events.forEach(function (ev) {
            var docRef = ref.doc(ev.id);
            batch.set(docRef, ev, { merge: true });
        });

        batch.commit().then(function () {
            console.log('[Sync] ✅ ' + events.length + ' events synced to Firestore');
        }).catch(function (err) {
            console.error('[Sync] ❌ Upload failed:', err);
        });
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

            // Merge with local: keep newer version based on timestamp
            var localEvents = window.data ? window.data.events : [];
            var mergedMap = {};

            // Add all local events
            localEvents.forEach(function (ev) {
                mergedMap[ev.id] = ev;
            });

            // Merge remote events (remote wins if newer)
            events.forEach(function (ev) {
                var localEv = mergedMap[ev.id];
                if (!localEv || (ev.timestamp && localEv.timestamp && ev.timestamp > localEv.timestamp)) {
                    mergedMap[ev.id] = ev;
                }
            });

            // Save merged events to local
            var merged = Object.values(mergedMap);
            if (window.data) {
                window.data.events = merged;
                window.data.save();
                console.log('[Sync] ✅ Loaded ' + merged.length + ' events (merged)');

                // Refresh current view
                if (window.app && window.app.currentPage) {
                    window.app.navigate(window.app.currentPage);
                }
            }
        }).catch(function (err) {
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
                        window.data.events[idx] = ev;
                    } else {
                        window.data.events.push(ev);
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

            // Also save to Firestore if connected
            if (self.db && self.fazendaId && self.user) {
                var ref = self.db.collection('fazendas').doc(self.fazendaId).collection('events');
                ref.doc(savedEv.id).set(savedEv, { merge: true }).catch(function (err) {
                    console.warn('[Sync] Firestore write queued (offline):', err.code);
                });
            }

            return savedEv;
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
            html += '<button onclick="window.firebaseSync._mostrarCodigo()" '
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
