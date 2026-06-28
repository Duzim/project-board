import * as vscode from 'vscode';
import { View } from './models';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('myProjectDashboard.open', async () => {
		const view = new View(context, 'myProjectDashboard', 'My Project Dashboard');
		try {
			await view.render('index.html');
		} catch (error) {
			vscode.window.showErrorMessage(`Não consegui abrir o painel: ${error}`);
		}
		
	});
	context.subscriptions.push(disposable);
}



// This method is called when your extension is deactivated
export function deactivate() {}
