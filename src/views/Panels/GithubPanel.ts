import * as vscode from 'vscode';

export class GitHubPanel {
    private panel: vscode.WebviewPanel;

    constructor(
        private context: vscode.ExtensionContext
    ) {
        this.panel = vscode.window.createWebviewPanel(
            'projectBoardGitHub',
            'Project Board GitHub',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                localResourceRoots: [
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'views'),
                    vscode.Uri.joinPath(context.extensionUri, 'src', 'styles'),
                ]
            }
        )
    }

    async render(htmlFile = 'github.html', css = 'style.css'): Promise<void> {

    }

}