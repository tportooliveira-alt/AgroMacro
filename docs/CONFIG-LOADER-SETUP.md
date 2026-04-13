# Config-Loader Setup Guide — Development Mode

**Status**: ✅ WORKING on :8080 (production app)  
**Test**: window.agromacroConfig loaded via js/config-loader.js

---

## 🚀 How to Inject Credentials (DEV Mode)

### Method 1: Via Browser DevTools Console (Quick Test)

```javascript
// Set Firebase API Key
window.agromacroConfig.set('firebase.apiKey', 'your-firebase-key');

// Set IA credentials
window.agromacroConfig.set('ia.gemini', 'your-gemini-key');
window.agromacroConfig.set('ia.groq', 'your-groq-key');
window.agromacroConfig.set('ia.cerebras', 'your-cerebras-key');

// Verify saved
console.log(window.agromacroConfig.firebase);
console.log(window.agromacroConfig.ia);
```

### Method 2: Via .env.local File (Manual Copy-Paste)

1. Create `.env.local` from `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in actual values:
   ```
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_GEMINI_API_KEY=AIza...
   VITE_GROQ_API_KEY=gsk_...
   ```

3. Load via DevTools console (until Build Integration added):
   ```javascript
   // Paste this in DevTools console to load from .env.local
   fetch('.env.local')
     .then(r => r.text())
     .then(text => {
       let config = { firebase: {}, ia: {}, app: {}, api: {} };
       text.split('\n').forEach(line => {
         if (!line.startsWith('#') && line.includes('=')) {
           let [k, v] = line.split('=');
           if (k.startsWith('VITE_FIREBASE_')) {
             config.firebase[k.replace('VITE_FIREBASE_', '').toLowerCase()] = v;
           } else if (k.startsWith('VITE_')) {
             config.ia[k.replace('VITE_', '').toLowerCase()] = v;
           }
         }
       });
       localStorage.setItem('agromacro_config', JSON.stringify(config));
       window.location.reload();
     });
   ```

### Method 3: JSON Import to localStorage

```javascript
// Copy this config and paste in DevTools console
localStorage.setItem('agromacro_config', JSON.stringify({
  firebase: {
    apiKey: "AIzaSyAQgFA5Ea3AYkk1IZ-0d3Jb1j8aiaugX5U",
    authDomain: "fazenda-antares.firebaseapp.com",
    projectId: "fazenda-antares",
    storageBucket: "fazenda-antares.firebasestorage.app",
    messagingSenderId: "1019641259951",
    appId: "1:1019641259951:web:c0bd2c970c1001b740f15a"
  },
  ia: {
    gemini: "YOUR_GEMINI_KEY",
    groq: "YOUR_GROQ_KEY",
    cerebras: "YOUR_CEREBRAS_KEY"
  },
  app: {
    mode: "development",
    syncInterval: 300000
  }
}));
window.location.reload();
```

---

## 📋 Current State

✅ **In :8080 (Production App)**:
- Config loader initialized: `window.agromacroConfig` exists
- Default Firebase config (fallback): loaded from hardcode
- IA keys: empty (user must set)
- SyncInterval: 300000ms (5 min)
- Mode: development

❌ **In :8090 (Stress Test Clone)**:
- config-loader.js not synced (git clone didn't pull latest files)
- Use :8080 for testing credentials setup

---

## 🔐 LGPD Compliance Status

| Item | Status | Action |
|------|--------|--------|
| Firebase keys in code | ⚠️ Still in hardcode | Week 2: Move to Cloud Functions |
| IA keys in code | ✅ Fixed (now injected) | Done |
| Keys in localStorage | ⚠️ Browser-stored | For DEV only; PROD will use backend |
| Plaintext in Git | ✅ Safe (.env.local gitignored) | Done |

---

## 🎯 Next Steps (P0.1 Week 2)

1. **Fix iaConsultor.init() injection** (currently in array loop, needs separate call with config)
2. **Test Firebase sync** with injected credentials
3. **Implement batch size limit** (50-doc chunks for 746+ events)
4. **Multi-device conflict test** (2 browsers editing simultaneously)
5. **PROD deployment** (Cloud Functions secret injection)

---

## 🐛 Troubleshooting

### Config not loading?
```javascript
// Check if script loaded
document.querySelectorAll('script').find(s => s.src.includes('config-loader'));

// Check window object
window.agromacroConfig

// Manually re-init
window.agromacroConfig.init();
```

### Firebase still using hardcode?
```javascript
// Verify firebase-sync using agromacroConfig
window.firebaseSync.db.app.options; // Should show config from agromacroConfig
```

### localStorage config not persisting?
```javascript
// Check if localStorage available
typeof(Storage) // Should be 'object'

// View stored config
JSON.parse(localStorage.getItem('agromacro_config'));
```

---

## 📞 Support

- **Error**: `firebase is not defined` → firebase SDK may not have loaded
- **Error**: `config-loader.js 404` → File not synced to server (run `git pull`)
- **Issue**: Changes not reflecting → Clear browser cache (`Ctrl+Shift+R`)
