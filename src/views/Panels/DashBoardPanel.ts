import * as vscode from 'vscode';
import { renderDashboard } from '../components';
import { createGroup } from '../../models/Group';
import { createProject, Project, withColor } from '../../models/Project';
import GroupsStore from '../../services/GroupsStore';
import { InboundMessage } from '../../shared/messages';
import { getNonce, getRandomHexColor, isRgbOrHex } from '../../utils';
import path from 'path';

export class DashBoardPanel {
  private static current: DashBoardPanel | undefined;
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  
  private constructor(
    private context: vscode.ExtensionContext,
    private store: GroupsStore,
  ) {
    this.panel = vscode.window.createWebviewPanel(
      'projectBoard',
      'Project Board',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'src', 'views'),
          vscode.Uri.joinPath(context.extensionUri, 'src', 'styles'),
        ],
      },
    );
  
    this.panel.webview.onDidReceiveMessage(
      (msg: InboundMessage) => this.handleMessage(msg),
      null,
      this.disposables,
    );

    this.panel.onDidDispose(() => {
      DashBoardPanel.current = undefined;
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];
    });
  }

  static async createOrShow(context: vscode.ExtensionContext, store: GroupsStore): Promise<void> {
    try {
      if (DashBoardPanel.current) {
        DashBoardPanel.current.panel.reveal();
      } else {
        DashBoardPanel.current = new DashBoardPanel(context, store);
      }
      await DashBoardPanel.current.render();
    } catch (error) {
      vscode.window.showErrorMessage(`Unable to open the panel: ${error}`);
    }
  }

  async render(htmlFile = 'index.html', css = 'style.css'): Promise<void> {
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', htmlFile);
    const cssPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles', css);

    const bytes = await vscode.workspace.fs.readFile(htmlPath);
    const baseHtml = Buffer.from(bytes).toString('utf-8');

    const groups = this.store.getGroups();
    const cssUri = this.panel.webview.asWebviewUri(cssPath);
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', 'main.js'),
    );
    const codiconUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles', 'codicon.css')
    );
    const nonce = getNonce();

    this.panel.webview.html = baseHtml
      .replace('{{cssUri}}', cssUri.toString())
      .replace('{{codiconUri}}', codiconUri.toString())
      .replace('{{scriptUri}}', scriptUri.toString())
      .replace(/{{nonce}}/g, nonce)
      .replace(/{{cspSource}}/g, this.panel.webview.cspSource)
      .replace('{{dashboard}}', renderDashboard(groups));
  }

  private async handleMessage(msg: InboundMessage): Promise<void> {
    switch (msg.type) {
      case 'openProject': {
        const project = this.findProject(msg.projectId);
        if (project) {
          await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(project.path),
            { forceNewWindow: true },
          );
        }
        break;
      }
      case 'removeProject': {
        const confirm = await vscode.window.showWarningMessage(
          'Remove this project from the dashboard?',
          { modal: true },
          'Remove'
        );
        if (confirm !== 'Remove') break;
        await this.store.removeProject(msg.groupId, msg.projectId);
        await this.render();
        break;
      }
      case 'addProject': {
        await this.promptAddProject();
        break;
      }
      case 'editColor': {
        const project = this.findProject(msg.projectId);
        if (!project) break;

        const color = await this.promptColor();
        if (!color) break;

        await this.store.updateProject(msg.groupId, withColor(project, color));
        await this.render();
        break;
      }
      case 'editInfo': {
        const project = this.findProject(msg.projectId);  
        if (!project) break;
        
        const name = await this.promptName(project.name);
        if (!name) break;

        const path = await this.promptPath(project.path);
        if (!path) break;

        await this.store.updateProject(msg.groupId, {...project, name: name.trim(), path});
        await this.render();
        break;
      }
      case 'addGroup': {
        await this.promptAddGroup();
        await this.render();
        break;
      }
      case 'removeGroup': {
        const group = this.store.getGroups().find(g => g.id === msg.groupId);
        if (!group) break;

        if (group.projects.length > 0) {
          vscode.window.showWarningMessage("This group has projects. Remove the projects before deleting the group.");
          break;
        }
        await this.store.removeGroup(msg.groupId);
        await this.render();
        break;
      }
      case 'editGroup': {
        const group = this.store.getGroups().find(g => g.id === msg.groupId);
        if (!group) break;

        const name = await this.promptName(group.name);
        if (!name) break;

        await this.store.renameGroup(msg.groupId, name.trim());
        await this.render();
        break;
      }
      case 'ready':
        break;
    }
  }

  private findProject(projectId: string): Project | undefined {
    return this.store.getGroups().flatMap(g => g.projects).find(p => p.id === projectId);
  }

  private async promptAddProject(): Promise<void> {
    const picked = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      canSelectMany: false,
      openLabel: 'Select Project',
    });
    if (!picked) return;
    const folderPath = picked[0].fsPath;

    const name = await vscode.window.showInputBox({
      prompt: 'Project name',
      value: path.basename(folderPath),
    });
    if (!name) return;

    let groups = this.store.getGroups();
    if (groups.length === 0) {
      await this.promptAddGroup();
      groups = this.store.getGroups();
      if (groups.length === 0) return;
    }

    const pick = await vscode.window.showQuickPick(
      groups.map(g => ({ label: g.name, id: g.id })),
      { placeHolder: 'Choose the group' },
    );
    if (!pick) return;

    let project = createProject({ name, path: folderPath }) as Project;
    const color = await this.promptColor();
    if (color) project = withColor(project, color);
    
    await this.store.addProjectToGroup(pick.id, project);
    await this.render();
  }

  private async promptAddGroup(): Promise<void> {
    const name = await vscode.window.showInputBox({ prompt: 'Name of the new group' });
    if (!name) return;
    await this.store.addGroup(createGroup({ name }));
    await this.render();
  }

  private async promptColor(current?: string): Promise<string | undefined> {
    const PRESETS = [
      { label: '🔵 Blue',    color: '#89b4fa' },
      { label: '🟢 Green',   color: '#a6e3a1' },
      { label: '🟡 Yellow', color: '#f9e2af' },
      { label: '🔴 Red', color: '#f38ba8' },
      { label: '🟣 Purple',    color: '#cba6f7' },
      { label: '🟠 Laranja', color: '#fab387' },
    ];

    const CUSTOM = 'Digitar cor personalizada…';

    const pick = await vscode.window.showQuickPick(
      [
        ...PRESETS.map(p => ({ label: p.label, description: p.color, color: p.color })),
        { label: '🎨 random color', description:'rand color', color: getRandomHexColor()},
        { label: CUSTOM, description: 'hex or rgb', color: undefined },
      ],
      { placeHolder: 'Choose a color or enter your own' },
    );

    if (!pick) return undefined;
    if (pick.color) return pick.color;

    return vscode.window.showInputBox({
        prompt: 'Project color (hex or rgb)',
        value: current,
        placeHolder: '#89b4fa',
        validateInput: (v) => !v || isRgbOrHex(v) ? undefined : 'Use hex (#rrggbb) or rgb(...)',
    });
  }

  private async promptName(name = ""): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      prompt: "Project Name",
      value: name,
      validateInput: v => v.trim() ? undefined : "The name cannot be left blank.",
    })
  }

  private async promptPath(path = ""): Promise<string | undefined> {
    return await vscode.window.showInputBox({
      prompt: "Project path",
      value: path,
    });
  }
}