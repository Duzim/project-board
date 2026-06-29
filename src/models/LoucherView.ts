import * as vscode from 'vscode';
import { getNonce } from '../utils';

export class LauncherView implements vscode.WebviewViewProvider {
  public static readonly viewType = 'myProjectDashboard.view';

  constructor(private context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    webviewView.webview.options = { enableScripts: true };

    const nonce = getNonce();
    webviewView.webview.html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
    <meta charset="UTF-8">
    <meta http-equiv="Content-Security-Policy"
        content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
    <style>
        body { padding: 12px; font-family: var(--vscode-font-family); }
        button {
            width: 100%; padding: 8px; cursor: pointer; border: none; border-radius: 4px;
            color: var(--vscode-button-foreground); background: var(--vscode-button-background);
        }
        button:hover { background: var(--vscode-button-hoverBackground); }
    </style>
    </head>
    <body>
    <button id="open">Abrir Dashboard</button>
    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        document.getElementById('open').addEventListener('click', () => {
            vscode.postMessage({ type: 'open' });
        });
    </script>
    </body>
    </html>`;

    webviewView.webview.onDidReceiveMessage((msg) => {
      if (msg.type === 'open') {
        vscode.commands.executeCommand('myProjectDashboard.open');
      }
    });
  }
}