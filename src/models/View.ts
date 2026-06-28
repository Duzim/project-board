import * as vscode from 'vscode';
import { renderDashboard } from '../components';
import { createGroup } from './Group';
import { createProject, Project } from './Project';
import GroupsStore from '../services/GroupsStore';
import { InboundMessage } from '../types';
import { getNonce } from '../utils';
import path from 'path';

export class View {
  private static current: View | undefined;
  private panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  private constructor(
    private context: vscode.ExtensionContext,
    private store: GroupsStore,
  ) {
    this.panel = vscode.window.createWebviewPanel(
      'myProjectDashboard',
      'My Project Dashboard',
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
      View.current = undefined;
      this.disposables.forEach(d => d.dispose());
      this.disposables = [];
    });
  }

  static async createOrShow(context: vscode.ExtensionContext, store: GroupsStore): Promise<void> {
    try {
      if (View.current) {
        View.current.panel.reveal();
      } else {
        View.current = new View(context, store);
      }
      await View.current.render();
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
    const nonce = getNonce();

    this.panel.webview.html = baseHtml
      .replace('{{cssUri}}', cssUri.toString())
      .replace('{{scriptUri}}', scriptUri.toString())
      .replace(/{{nonce}}/g, nonce)
      .replace('{{cspSource}}', this.panel.webview.cspSource)
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
      case 'removeProject':
        await this.store.removeProject(msg.groupId, msg.projectId);
        await this.render();
        break;
      case 'addProject':
        await this.promptAddProject();
        break;
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

    const project = createProject({ name, path: folderPath });
    await this.store.addProjectToGroup(pick.id, project);
    await this.render();
  }

  private async promptAddGroup(): Promise<void> {
    const name = await vscode.window.showInputBox({ prompt: 'Name of the new group' });
    if (!name) return;
    await this.store.addGroup(createGroup({ name }));
    await this.render();
  }
}

// import * as vscode from 'vscode';
// import { renderDashboard } from '../components';
// import { createGroup } from './Group';
// import { createProject, Project } from './Project';
// import GroupsStore from '../services/GroupsStore';
// import { InboundMessage } from '../types';
// import { getNonce } from '../utils';
// import path from 'path';

// export class View implements vscode.WebviewViewProvider {
//   public static readonly viewType = 'myProjectDashboard.view';

//   private view?: vscode.WebviewView;
//   private disposables: vscode.Disposable[] = [];

//   constructor(
//     private context: vscode.ExtensionContext,
//     private store: GroupsStore,
//   ) {}

//   resolveWebviewView(webviewView: vscode.WebviewView): void {
//     this.view = webviewView;

//     webviewView.webview.options = {
//       enableScripts: true,
//       localResourceRoots: [
//         vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views'),
//         vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles'),
//       ],
//     };

//     webviewView.webview.onDidReceiveMessage(
//       (msg: InboundMessage) => this.handleMessage(msg),
//       null,
//       this.disposables,
//     );

//     webviewView.onDidDispose(() => {
//       this.disposables.forEach(d => d.dispose());
//       this.disposables = [];
//       this.view = undefined;
//     });

//     this.render('index.html');
//   }

//   /**
//    * Reads the groups from the store and (re)draws the webview.
//    * @param htmlFile name of html file in /src/views
//    * @param css name of css file in /src/styles
//    */
//   async render(htmlFile = 'index.html', css = 'style.css'): Promise<void> {
//     if (!this.view) return;

//     const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', htmlFile);
//     const cssPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles', css);

//     const bytes = await vscode.workspace.fs.readFile(htmlPath);
//     const baseHtml = Buffer.from(bytes).toString('utf-8');

//     const groups = this.store.getGroups();
//     const cssUri = this.view.webview.asWebviewUri(cssPath);
//     const scriptUri = this.view.webview.asWebviewUri(
//       vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', 'main.js'),
//     );
//     const nonce = getNonce();

//     this.view.webview.html = baseHtml
//       .replace('{{cssUri}}', cssUri.toString())
//       .replace('{{scriptUri}}', scriptUri.toString())
//       .replace(/{{nonce}}/g, nonce)
//       .replace('{{cspSource}}', this.view.webview.cspSource)
//       .replace('{{dashboard}}', renderDashboard(groups));
//   }

//   private async handleMessage(msg: InboundMessage): Promise<void> {
//     switch (msg.type) {
//       case 'openProject': {
//         const project = this.findProject(msg.projectId);
//         if (project) {
//           await vscode.commands.executeCommand(
//             'vscode.openFolder',
//             vscode.Uri.file(project.path),
//             { forceNewWindow: true },
//           );
//         }
//         break;
//       }
//       case 'removeProject':
//         await this.store.removeProject(msg.groupId, msg.projectId);
//         await this.render();
//         break;
//       case 'addProject':
//         await this.promptAddProject();
//         break;
//       case 'ready':
//         break;
//     }
//   }

//   private findProject(projectId: string): Project | undefined {
//     return this.store
//       .getGroups()
//       .flatMap(g => g.projects)
//       .find(p => p.id === projectId);
//   }

//   private async promptAddProject(): Promise<void> {
//     const picked = await vscode.window.showOpenDialog({
//       canSelectFolders: true,
//       canSelectFiles: false,
//       canSelectMany: false,
//       openLabel: 'Select Project',
//     });
//     if (!picked) return;
//     const folderPath = picked[0].fsPath;

//     const name = await vscode.window.showInputBox({
//       prompt: 'Project name',
//       value: path.basename(folderPath),
//     });
//     if (!name) return;

//     let groups = this.store.getGroups();
//     if (groups.length === 0) {
//       await this.promptAddGroup();
//       groups = this.store.getGroups();
//       if (groups.length === 0) return;
//     }

//     const pick = await vscode.window.showQuickPick(
//       groups.map(g => ({ label: g.name, id: g.id })),
//       { placeHolder: 'Choose the group' },
//     );
//     if (!pick) return;

//     const project = createProject({ name, path: folderPath });
//     await this.store.addProjectToGroup(pick.id, project);
//     await this.render();
//   }

//   private async promptAddGroup(): Promise<void> {
//     const name = await vscode.window.showInputBox({ prompt: 'Name of the new group' });
//     if (!name) return;
//     await this.store.addGroup(createGroup({ name }));
//     await this.render();
//   }
// }