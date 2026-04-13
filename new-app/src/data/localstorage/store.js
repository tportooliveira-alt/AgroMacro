const STORAGE_KEY = 'new-app-events';

export class LocalStorageStore {
    constructor(key = STORAGE_KEY) {
        this.key = key;
    }

    add(event) {
        const events = this.getAll();
        events.push(event);
        localStorage.setItem(this.key, JSON.stringify(events));
    }

    getAll() {
        const raw = localStorage.getItem(this.key);
        try {
            return raw ? JSON.parse(raw) : [];
        } catch (error) {
            console.error('LocalStorageStore parsing failed', error);
            localStorage.removeItem(this.key);
            return [];
        }
    }

    clear() {
        localStorage.removeItem(this.key);
    }
}
