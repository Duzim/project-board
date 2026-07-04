import * as vscode from 'vscode';
import { DashBoardPanel } from './views/Panels/DashBoardPanel';
import GroupsStore from './services/GroupsStore';
import { LauncherView } from './views/SideBarView/LoucherView';
import { GithubService } from './services/GitHubService';
import { GitHubPanel } from './views/Panels/GithubPanel';
// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	const store = new GroupsStore(context);
	const github = new GithubService(context);

	context.subscriptions.push(
		vscode.commands.registerCommand('projectBoard.open', () => {
			DashBoardPanel.createOrShow(context, store);
		}),
	);

	context.subscriptions.push(
		vscode.commands.registerCommand('projectBoardGitHub.openGithub', () => {
			GitHubPanel.createOrShow(context, github);
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
		vscode.commands.executeCommand('projectBoard.view.focus');
	}
}

// This method is called when your extension is deactivated
export function deactivate() {}
