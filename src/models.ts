import * as vscode from 'vscode';
import crypto from 'node:crypto'
import {isRgbOrHex} from './utils';

export class Group {
    public id: string;
    constructor( 
        public name: string, 
        public projects: Project[] = []
    ) { 
        this.id = crypto.randomUUID();
    }

}

export class Project {
    id: string;
    private color = "#000";
    
    
    constructor(
        public name: string,
        public path: string,
        public imageBackground: string,
    ) { 
        this.id = crypto.randomUUID();
    }

    addColor(color: string) {
        if (!isRgbOrHex(color)) return;
        this.color = color;
    }

}

export class View {
  private panel: vscode.WebviewPanel;

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
        localResourceRoots: [context.extensionUri], // simples por agora; pode estreitar depois
      },
    );
    this.panel.onDidDispose(() => {
        // TODO: pra limpar quando o usuário fechar
    });
  }

  /**
   * Render Html in webview
   * @param html file name of html in dir /views
   */
  async render(htmlFile: string, css = 'style.css') {
    const htmlPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'views', htmlFile);
    const cssPath = vscode.Uri.joinPath(this.context.extensionUri, 'src', 'styles', css);

    
    const bytes = await vscode.workspace.fs.readFile(htmlPath);
    let html = Buffer.from(bytes).toString('utf-8');
    const cssUri = this.panel.webview.asWebviewUri(cssPath);
    
    html = html.replace("{{cssUri}}", cssUri.toString());
    this.panel.webview.html = html;  
  }
}