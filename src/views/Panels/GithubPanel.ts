import * as vscode from 'vscode';
import { getNonce } from '../../utils';
import { GithubService } from '../../services/GitHubService';
import { renderRepoList } from '../components';
import { InboundGitHubMessages } from '../../shared/messages';
import { GitService } from '../../services/GitService';
import GroupsStore from '../../services/GroupsStore';
import { createGroup } from '../../models/Group';
import { createProject } from '../../models/Project';

export class GitHubPanel {
    private panel: vscode.WebviewPanel;
    private static current: GitHubPanel | undefined;
    private disponsables: vscode.Disposable[] = [];
    

    private constructor(
        private context: vscode.ExtensionContext,
        private service: GithubService,
        private gitService: GitService,
        private store: GroupsStore,
    ) {
        this.panel = vscode.window.createWebviewPanel(
            'projectBoardGitHub',
            'Project Board GitHub',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views'),
                    vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles'),
                ]
            }
        );
        
        this.panel.webview.onDidReceiveMessage(
            (msg: InboundGitHubMessages) => this.handleMessage(msg),
            null,
            this.disponsables,
        );

        this.panel.onDidDispose(() => {
            GitHubPanel.current = undefined;
            this.disponsables.forEach(d => d.dispose());
            this.disponsables = [];
        });
    }

    async render(htmlFile = 'github.html', css = 'style.css'): Promise<void> {
        const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', htmlFile);
        const cssPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles', css);
        
        const bytes = await vscode.workspace.fs.readFile(htmlPath);
        const baseHtml = Buffer.from(bytes).toString('utf-8');

        const cssUri = this.panel.webview.asWebviewUri(cssPath);
        const scriptUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', 'github.js')
        );
        const codiconUri = this.panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles', 'codicon.css')
        );
        const nonce = getNonce();

        let reposHtml: string;
        try {
            const repos = await this.service.listRepos();
            reposHtml = renderRepoList(repos);
        } catch (error) {
            reposHtml = '<p class="empty">Error loading repositories. Check your login.</p>';
        }
        
        this.panel.webview.html = baseHtml
            .replace('{{cssUri}}', cssUri.toString())
            .replace('{{codiconUri}}', codiconUri.toString())
            .replace('{{scriptUri}}', scriptUri.toString())
            .replace(/{{nonce}}/g, nonce)
            .replace(/{{cspSource}}/g, this.panel.webview.cspSource)
            .replace('{{repos}}', reposHtml);
    }

    static async createOrShow(
        context: vscode.ExtensionContext, 
        service: GithubService, 
        gitService: GitService,
        store: GroupsStore
    ): Promise<void> {
        try {
            if (GitHubPanel.current) {
                GitHubPanel.current.panel.reveal();
            } else {
                GitHubPanel.current = new GitHubPanel(context, service, gitService, store);
            }
            await GitHubPanel.current.render();
        } catch (error) {
            vscode.window.showErrorMessage(`Unable to open the panel: ${error}`);
        }
    }

    private async handleMessage(msg: InboundGitHubMessages) {
        switch (msg.type) {
            case 'clone':
                const picked = await this.pickupDir('Clone Here');
                if (!picked) break;

                const pickedGroupId = await this.pickOrCreateGroup();
                if (!pickedGroupId) break;

                try {
                    await vscode.window.withProgress(
                        {
                            location: vscode.ProgressLocation.Notification, 
                            title: 'Cloning repository...',
                        },
                        async () => {
                            const targetPath = await this.gitService.clone(msg.url, picked[0].fsPath);
                            
                            const repoName = GitService.repoNameFromUrl(msg.url);
                            const project = createProject({ name: repoName, path: targetPath });
                            await this.store.addProjectToGroup(pickedGroupId, project);

                            vscode.window.showInformationMessage(`${repoName} cloned and added to the dashboard.`);
                        }
                    );
                } catch (error) {
                    vscode.window.showErrorMessage(`Could not clone the repository: ${error}`);
                }
                break;
            case 'refresh':
                await this.render();
                break;
            case 'ready':
                break;
        }
    }

    private async pickupDir(namespace: string) {
        return await vscode.window.showOpenDialog({
            canSelectFolders: true,
            canSelectFiles: false,
            canSelectMany: false,
            openLabel: namespace || '',
        });
    }

    private async pickOrCreateGroup()  {
        let groups = this.store.getGroups()
        if (groups.length <= 0) {
            await this.promptAddGroup();
            groups = this.store.getGroups();
            if (groups.length <= 0) return undefined;
        }

        const pick = await vscode.window.showQuickPick(
            groups.map(g => ({ label: g.name, id: g.id })),
            { placeHolder: 'To which group should the repository be added?' },
        );
        return pick?.id;
    }

    private async promptAddGroup(): Promise<void> {
        const name = await vscode.window.showInputBox({ prompt: 'Name of the new group' });
        if (!name) return;
        await this.store.addGroup(createGroup({ name }));
    }

}