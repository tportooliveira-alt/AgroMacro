export const views = {};

export function registerView(name, render) {
    views[name] = render;
}

export function navigateTo(name, container) {
    if (!views[name]) {
        console.warn(`view "${name}" not registered`);
        return;
    }
    container.innerHTML = '';
    views[name](container);
}
