import { GithubRepo } from "../models/GitHubRepo";
import { Group } from "../models/Group";
import { Project } from "../models/Project";
import { escapeHtml, formatDate } from "../utils";


// export function renderCard(project: Project, groupId: string): string {
//   const gid = escapeHtml(groupId);
//   const pid = escapeHtml(project.id);
//   return `
//     <div class="card" data-id="${pid}" data-group-id="${gid}" style="--accent: ${project.color ?? 'var(--vscode-foreground)'}">
//       <h3 class="card-name">${escapeHtml(project.name)}</h3>
//       <span class="card-path">${escapeHtml(project.path)}</span>
//       <div class="card-actions">
//         <button data-action="edit-color" data-id="${pid}" data-group-id="${gid}">Color</button>
//         <button data-action="edit-info" data-id="${pid}" data-group-id="${gid}">Edit</button>
//         <button data-action="remove-project" data-id="${pid}" data-group-id="${gid}" class="danger">Remove</button>
//       </div>
//     </div>`;
// }
export function renderCard(project: Project, groupId: string): string {
  console.log('CARD:', project.name, 'cor:', JSON.stringify(project.color), typeof project.color);
  const gid = escapeHtml(groupId);
  const pid = escapeHtml(project.id);
  const accent = (project.color ?? '').trim() || 'var(--vscode-foreground)';
  return `
    <div class="card" data-id="${pid}" data-group-id="${gid}" style="border-left: 4px solid ${project.color ?? 'var(--vscode-foreground)'}">
      <div class="card-body">
        <h3 class="card-name">${escapeHtml(project.name)}</h3>
        <span class="card-path">${escapeHtml(project.path)}</span>
      </div>
      <div class="card-actions">
        <button data-action="edit-color" data-id="${pid}" data-group-id="${gid}" title="Change color">
          <i class="codicon codicon-paintcan"></i>
        </button>
        <button data-action="edit-info" data-id="${pid}" data-group-id="${gid}" title="Edit">
          <i class="codicon codicon-edit"></i>
        </button>
        <button data-action="remove-project" data-id="${pid}" data-group-id="${gid}" class="danger" title="Remove">
          <i class="codicon codicon-trash"></i>
        </button>
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

// GitHub

export function renderRepoList(repos: GithubRepo[]): string {
  if (repos.length === 0) {
    return '<p class="empty">No repository found.</p>';
  }
  return repos.map((repo) => `
    <div class="repo-card">
      <div class="repo-head">
        <span class="repo-name">
          <i class="codicon codicon-${repo.private ? 'lock' : 'repo'}"></i>
          ${escapeHtml(repo.name)}
        </span>
        <div class="repo-actions">
          <button data-action="clone" data-url="${escapeHtml(repo.clone_url)}" title="Clone">
            <i class="codicon codicon-cloud-download"></i>
          </button>
          <button data-action="open-github" data-url="${escapeHtml(repo.html_url)}" title="Open on GitHub">
            <i class="codicon codicon-link-external"></i>
          </button>
        </div>
      </div>
      <div class="repo-details">
        <span class="repo-full">${escapeHtml(repo.full_name)}</span>
        ${repo.description ? `<p class="repo-desc">${escapeHtml(repo.description)}</p>` : ''}
        <span class="repo-updated">Updated ${escapeHtml(formatDate(repo.updated_at))}</span>
      </div>
    </div>
  `).join('');
}
// export function renderRepoList(repos: GithubRepo[]): string {
//   if (repos.length === 0) {
//     return '<p class="empty">No repository found.</p>';
//   }
//   return repos.map((repo) => `
//     <div class="card repo-card">
//       <div class="card-body">
//         <h3 class="card-name">
//           ${escapeHtml(repo.name)}
//           ${repo.private ? '<span class="badge"><i class="codicon codicon-lock"></i> private</span>' : ''}
//         </h3>
//         <span class="card-desc">${escapeHtml(repo.description ?? '')}</span>
//       </div>
//       <div class="card-actions">
//         <button data-action="clone" data-url="${escapeHtml(repo.clone_url)}" title="Clonar">
//           <i class="codicon codicon-cloud-download"></i> Clone
//         </button>
//         <button data-action="open-github" data-url="${escapeHtml(repo.html_url)}" title="Abrir no GitHub">
//           <i class="codicon codicon-link-external"></i>
//         </button>
//       </div>
//     </div>
//   `).join('');
// }