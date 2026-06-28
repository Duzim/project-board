import * as vscode from 'vscode';
import { View } from './models/View';
import GroupsStore from './services/GroupsStore';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const store = new GroupsStore(context);

	const disposable = vscode.commands.registerCommand('myProjectDashboard.open', async () => {
		await View.createOrShow(context, store);
	});
	context.subscriptions.push(disposable);
}



// This method is called when your extension is deactivated
export function deactivate() {}
