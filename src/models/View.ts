import * as vscode from 'vscode';
import { renderDashboard } from '../functions';
import { createGroup } from './Group';
import { createProject } from './Project';

export class View {
  private panel: vscode.WebviewPanel;
  private static current: View | undefined;

  constructor(
    private context: vscode.ExtensionContext,
    private viewType: string,
    private title: string,
  ) {
    this.panel = vscode.window.createWebviewPanel(
      viewType,
      title,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [context.extensionUri],
      },
    );
    this.panel.onDidDispose(() => {
      
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
    const cssUri = this.panel.webview.asWebviewUri(cssPath);
    
    html = html
        .replace("{{cssUri}}", cssUri.toString())
        .replace("{{dashboard}}", renderDashboard([]));
    this.panel.webview.html = html;  
  }

  static async createOrShow(
    context: vscode.ExtensionContext, 
    viewType?: string,
    title?: string,
    html?: string
  ) {
    try {
      if (View.current) {
        View.current.panel.reveal();
        View.current.render('index.html');
        return;
      }

      View.current = new View(context, viewType ?? 'myProjectDashboard', title ?? 'My Project Dashboard');
      await View.current.render(html ?? 'index.html');
    } catch (error) {
      vscode.window.showErrorMessage(`Não consegui abrir o painel: ${error}`);
    }
  }

}