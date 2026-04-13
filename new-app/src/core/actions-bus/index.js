class ActionsBus {
    constructor() {
        this.listeners = {};
    }

    on(action, handler) {
        if (!this.listeners[action]) {
            this.listeners[action] = [];
        }
        this.listeners[action].push(handler);
        return () => this.off(action, handler);
    }

    off(action, handler) {
        if (!this.listeners[action]) return;
        this.listeners[action] = this.listeners[action].filter(h => h !== handler);
    }

    emit(action, payload) {
        (this.listeners[action] || []).forEach(handler => {
            try {
                handler(payload);
            } catch (error) {
                console.error(`ActionsBus handler for ${action} failed`, error);
            }
        });
    }
}

export const actionsBus = new ActionsBus();
