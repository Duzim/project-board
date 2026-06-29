const vscode = acquireVsCodeApi();
const ACTION_TO_TYPE = {
  'edit-color': 'editColor',
  'edit-info': 'editInfo',
  'remove-project': 'removeProject',
  'add-group': 'addGroup',
  'add-project': 'addProject',
}

document.addEventListener('click', (event) => {
  const actionEl = event.target.closest('[data-action]');

  if (actionEl) {
    event.stopPropagation();
    const { action, id, groupId } = actionEl.dataset;
    
    vscode.postMessage({ type: ACTION_TO_TYPE[action], projectId: id, groupId });
    return; 
  }
  const card = event.target.closest('.card');
  if (card) {
    vscode.postMessage({ type: 'openProject', projectId: card.dataset.id });
  }
});

vscode.postMessage({ type: 'ready' });