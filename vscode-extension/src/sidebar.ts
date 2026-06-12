import * as vscode from 'vscode';
import { IzwaAPI, Snippet } from './api';
import { t } from './i18n';

export class IzwaSidebarProvider implements vscode.WebviewViewProvider {
    // ... rest of class
    public static readonly viewType = 'izwa-snippets-view';
    private _view?: vscode.WebviewView;

    constructor(
        private readonly _extensionUri: vscode.Uri,
        private readonly _context: vscode.ExtensionContext
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };

        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

        webviewView.webview.onDidReceiveMessage(async (data) => {
            switch (data.type) {
                case 'insertSnippet':
                    this._insertSnippet(data.code);
                    break;
                case 'refresh':
                    this.refresh();
                    break;
            }
        });

        this.refresh();
    }

    public async refresh() {
        if (this._view) {
            const snippets = await IzwaAPI.fetchSnippets(this._context);
            this._view.webview.postMessage({ type: 'setSnippets', snippets });
        }
    }

    private _insertSnippet(code: string) {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, code);
            });
        }
    }

    private _getHtmlForWebview(webview: vscode.Webview) {
        const lang = vscode.env.language.startsWith('fr') ? 'fr' : 'en';
        return `<!DOCTYPE html>
            <html lang="${lang}">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${t('sidebar.title')}</title>
                <style>
                    body { font-family: sans-serif; padding: 10px; }
                    .snippet-card { 
                        border: 1px solid #ccc; 
                        margin-bottom: 10px; 
                        padding: 8px; 
                        border-radius: 4px;
                        cursor: pointer;
                        background: var(--vscode-sideBar-background);
                    }
                    .snippet-card:hover { background: var(--vscode-list-hoverBackground); }
                    .title { font-weight: bold; margin-bottom: 4px; }
                    .lang { font-size: 0.8em; color: #888; }
                    .search-box { width: 100%; margin-bottom: 15px; padding: 5px; }
                </style>
            </head>
            <body>
                <input type="text" class="search-box" id="search" placeholder="${t('sidebar.search_placeholder')}">
                <div id="snippets-list">${t('sidebar.loading')}</div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const listElement = document.getElementById('snippets-list');
                    const searchInput = document.getElementById('search');

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'setSnippets') {
                            renderSnippets(message.snippets);
                        }
                    });

                    function renderSnippets(snippets) {
                        listElement.innerHTML = '';
                        snippets.forEach(s => {
                            const div = document.createElement('div');
                            div.className = 'snippet-card';
                            div.innerHTML = \`
                                <div class="title">\${s.title}</div>
                                <div class="lang">\${s.language}</div>
                            \`;
                            div.onclick = () => {
                                vscode.postMessage({ type: 'insertSnippet', code: s.code });
                            };
                            listElement.appendChild(div);
                        });
                    }

                    searchInput.oninput = (e) => {
                        // Logique de filtrage simple pour le MVP
                        const term = e.target.value.toLowerCase();
                        const cards = document.querySelectorAll('.snippet-card');
                        cards.forEach(card => {
                            const title = card.querySelector('.title').innerText.toLowerCase();
                            card.style.display = title.includes(term) ? 'block' : 'none';
                        });
                    };
                </script>
            </body>
            </html>`;
    }
}
