import * as vscode from 'vscode';
import { renderDashboard } from '../functions';
import { createGroup } from './Group';
import { createProject, Project } from './Project';
import GroupsStore from '../services/GroupsStore';
import { InboundMessage } from '../types';
import { getNonce } from '../utils';
import path from 'path';

export class View {
  private panel: vscode.WebviewPanel;
  private static current: View | undefined;
  private disponsables: vscode.Disposable[] = [];

  constructor(
    private context: vscode.ExtensionContext,
    private store: GroupsStore,
    private viewType: string,
    private title: string,
  ) {
    this.panel = vscode.window.createWebviewPanel(
      viewType,
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, 'src', 'views'),
          vscode.Uri.joinPath(context.extensionUri, 'src', 'styles')
        ],
      },
    );
    this.panel.webview.onDidReceiveMessage(
      (msg: InboundMessage) => this.handleMessage(msg),
      null,
      this.disponsables
    )
    this.panel.onDidDispose(() => {
      View.current = undefined;
      this.disponsables.forEach(d => d.dispose());
      this.disponsables = [];
    });
  }

  /**
   * Render Html in webview
   * @param html file name of html in dir /src/views
   * @param css file name of css in dir /src/styles
   */
  async render(htmlFile: string, css = 'style.css') {
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', htmlFile);
    const cssPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles', css);

    const bytes = await vscode.workspace.fs.readFile(htmlPath);
    let html = Buffer.from(bytes).toString('utf-8');

    const groups = this.store.getGroups();
    console.log('GRUPOS NO RENDER:', JSON.stringify(groups, null, 2));
    const cssUri = this.panel.webview.asWebviewUri(cssPath);
    
    const nonce = getNonce();
    const scriptUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', 'main.js')
    );

    html = html
        .replace("{{cssUri}}", cssUri.toString())
        .replace("{{scriptUri}}", scriptUri.toString())
        .replace(/{{nonce}}/g, nonce)
        .replace('{{cspSource}}', this.panel.webview.cspSource)
        .replace("{{dashboard}}", renderDashboard(groups));
        
    this.panel.webview.html = html;  
  }

  /**
   * Reveal or render html in webview 
   * @param context 
   * @param store
   */
  static async createOrShow(
    context: vscode.ExtensionContext,
    store: GroupsStore,
  ) {
    try {
      if (View.current) {
        View.current.panel.reveal();
      } else {
        View.current = new View(context, store,'myProjectDashboard', 'My Project Dashboard');
      }

      await View.current.render('index.html');
    } catch (error) {
      vscode.window.showErrorMessage(`Unable to open the panel: ${error}`);
    }
  }

  private async handleMessage(msg: InboundMessage): Promise<void> {
    switch (msg.type) {
      case 'openProject': 
        const project = this.findProject(msg.projectId);
        if (project) {
          await vscode.commands.executeCommand(
            'vscode.openFolder',
            vscode.Uri.file(project.path),
            { forceNewWindow: true }
          );
        }
        break;
      case 'removeProject':
        await this.store.removeProject(msg.groupId, msg.projectId);
        await this.render('index.html');
        break;
      
      case 'addProject':
        await this.promptAddProject();
        break;
        case 'ready':
          break;

      default:
        break;
    }
  }

  private findProject(projectId: string): Project | undefined {
    return  this.store
      .getGroups()
      .flatMap(g => g.projects)
      .find(p => p.id === projectId);
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
    })
    if (!name) return;

    let groups = this.store.getGroups();

    if (groups.length <= 0) {
      await this.promptAddGroup();
      groups = this.store.getGroups();
      if (groups.length <= 0) return;
    }

    const pick = await vscode.window.showQuickPick(
      groups.map(g => ({ label: g.name, id: g.id })),
      { placeHolder: 'Choose the group' }
    );
    if (!pick) {return};

    const project = createProject({ name, path: folderPath });
    await this.store.addProjectToGroup(pick.id, project);
    await this.render('index.html');
  }

  private async promptAddGroup(): Promise<void> {
    const name = await vscode.window.showInputBox({ prompt: 'Name of the new group' });
    if (!name) return;
    await this.store.addGroup(createGroup({ name }));
    await this.render('index.html');
  }
}