import * as vscode from 'vscode';
import fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('myProjectDashboard.open', () => {
		const panel = vscode.window.createWebviewPanel(
				'myProjectDashboard',
				'My Project Dashboard',
				vscode.ViewColumn.One,
				{ enableScripts: true }
			);
		
			panel.webview.html = `<h1>Text</h1>`;
		

	});
	

	context.subscriptions.push(disposable);
}



// This method is called when your extension is deactivated
export function deactivate() {}
