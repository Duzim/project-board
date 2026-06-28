import { Group } from "./models/Group";
import { Project } from "./models/Project";
import { escapeHtml } from "./utils";

export function renderCard(project: Project, groupId: string):string {
    const color = project.color ?? 'var(--vscode-foreground)';
    return `
        <div class="card" data-id="${escapeHtml(project.id)}" data-group-id="${escapeHtml(groupId)}" style="--accent: ${project.color ?? 'var(--vscode-foreground)'}">
            <h3 class="card-name">${escapeHtml(project.name)}</h3>
            <span class="card-path">${escapeHtml(project.path)}</span>
        </div>
    `;
}

export function renderGroup(group: Group) {
    const cards = group.projects.map(p => renderCard(p, group.id)).join('');
    return `
        <section class="group">
            <h2 class="group-title">${escapeHtml(group.name)}</h2>
            <div class="grid">${cards}</div>
        </section>
    `;
}

export function renderDashboard(groups: Group[]) {
    if (groups.length <= 0) {
        return `<p class="empty">No projects yet. Add the first one!</p>`
    }

    return groups.map(renderGroup).join('');
}