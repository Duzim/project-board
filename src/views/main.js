const vscode = acquireVsCodeApi();

document.addEventListener('click', (event) => {
  const card = event.target.closest('.card');
  if (card) {
    vscode.postMessage({ type: 'openProject', projectId: card.dataset.id });
  }

  const action = event.target.closest('[data-action]')?.dataset.action;
  if (action === 'add-project') {
    vscode.postMessage({ type: 'addProject' });
  }
});

vscode.postMessage({ type: 'ready' });