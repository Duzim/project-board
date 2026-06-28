import * as vscode from 'vscode';
import { View } from './models/View';
import GroupsStore from './services/GroupsStore';
import { LauncherView } from './models/LoucherView';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const store = new GroupsStore(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('myProjectDashboard.open', () => {
			View.createOrShow(context, store);
		}),
	);

	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			LauncherView.viewType,
			new LauncherView(context),
		),
	);

	const withoutProject = 
		!vscode.workspace.workspaceFolders ||
		vscode.workspace.workspaceFolders.length === 0;

	if (withoutProject) {
		vscode.commands.executeCommand('myProjectDashboard.view.focus');
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
