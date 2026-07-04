const vscode = acquireVsCodeApi();
const ACTION_TO_TYPE = {
    'clone': 'clone'
};

document.addEventListener('click', (event) => {
    const actionEl = event.target.closest('[data-action]');
    if (actionEl) {
        event.stopPropagation();
        
        const { action, url } = actionEl.dataset;

        vscode.postMessage({ type: ACTION_TO_TYPE[action], url });
        return;
    }
});