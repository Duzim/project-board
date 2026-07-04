import * as vscode from 'vscode';
import { getNonce } from '../../utils';
import { GithubService } from '../../services/GitHubService';
import { renderRepoList } from '../components';
import { InboundGitHubMessages } from '../../shared/messages';

export class GitHubPanel {
    private panel: vscode.WebviewPanel;
    private static current: GitHubPanel | undefined;
    private disponsables: vscode.Disposable[] = [];


    private constructor(
        private context: vscode.ExtensionContext,
        private service: GithubService,
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
            .replace('{{scriptUri}}', scriptUri.toString())
            .replace(/{{nonce}}/g, nonce)
            .replace('{{cspSource}}', this.panel.webview.cspSource)
            .replace('{{repos}}', reposHtml);
    }

    static async createOrShow(context: vscode.ExtensionContext, service: GithubService ): Promise<void> {
        try {
            if (GitHubPanel.current) {
                GitHubPanel.current.panel.reveal();
            } else {
                GitHubPanel.current = new GitHubPanel(context, service);
            }
            await GitHubPanel.current.render();
        } catch (error) {
            vscode.window.showErrorMessage(`Unable to open the panel: ${error}`);
        }
    }

    private async handleMessage(msg: InboundGitHubMessages) {
        switch (msg.type) {
            case 'clone':
                try {
                    await vscode.commands.executeCommand('git.clone', msg.url);
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
}