import * as vscode from 'vscode';
import { View } from './models/View';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	const disposable = vscode.commands.registerCommand('myProjectDashboard.open', async () => {
		await View.createOrShow(context);
	});
	context.subscriptions.push(disposable);
}



// This method is called when your extension is deactivated
export function deactivate() {}
