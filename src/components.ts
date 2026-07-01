import { Group } from "./models/Group";
import { Project } from "./models/Project";
import { escapeHtml } from "./utils";

export function renderCard(project: Project, groupId: string): string {
  const gid = escapeHtml(groupId);
  const pid = escapeHtml(project.id);
  return `
    <div class="card" data-id="${pid}" data-group-id="${gid}" style="--accent: ${project.color ?? 'var(--vscode-foreground)'}">
      <h3 class="card-name">${escapeHtml(project.name)}</h3>
      <span class="card-path">${escapeHtml(project.path)}</span>
      <div class="card-actions">
        <button data-action="edit-color" data-id="${pid}" data-group-id="${gid}">Color</button>
        <button data-action="edit-info" data-id="${pid}" data-group-id="${gid}">Edit</button>
        <button data-action="remove-project" data-id="${pid}" data-group-id="${gid}" class="danger">Remove</button>
      </div>
    </div>`;
}

export function renderGroup(group: Group): string {
  const gid = escapeHtml(group.id);
  const cards = group.projects.map(p => renderCard(p, group.id)).join('');
  return `
    <section class="group">
      <header class="group-header">
        <h2 class="group-title">${escapeHtml(group.name)}</h2>
        <div class="group-actions">
          <button data-action="edit-group" data-group-id="${gid}">Rename</button>
          ${group.projects.length <= 0 
            ? `<button data-action="remove-group" data-group-id="${gid}" class="danger">Remove</button>`
            : ""
          }
        </div>
      </header>
      <div class="grid">${cards}</div>
    </section>`;
}

export function renderDashboard(groups: Group[]) {
    if (groups.length <= 0) {
        return `<p class="empty">No projects yet. Add the first one!</p>`
    }

    return groups.map(renderGroup).join('');
}