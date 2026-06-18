import * as vscode from 'vscode';
import { IzwaAPI, Snippet, Collection } from './api';
import { t } from './i18n';

export class IzwaSidebarProvider implements vscode.WebviewViewProvider {
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
            const [snippets, collections] = await Promise.all([
                IzwaAPI.fetchSnippets(this._context),
                IzwaAPI.fetchCollections(this._context)
            ]);
            this._view.webview.postMessage({ type: 'setData', snippets, collections });
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
                <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet" />
                <style>
                    body { font-family: var(--vscode-font-family); padding: 10px; color: var(--vscode-foreground); }
                    .search-box { 
                        width: 100%; 
                        margin-bottom: 15px; 
                        padding: 6px; 
                        background: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 2px;
                    }
                    
                    .collection-container { margin-bottom: 15px; }
                    .collection-header { 
                        font-weight: bold; 
                        padding: 4px 0; 
                        border-bottom: 1px solid var(--vscode-divider);
                        margin-bottom: 8px;
                        display: flex;
                        align-items: center;
                        font-size: 0.9em;
                        text-transform: uppercase;
                        opacity: 0.8;
                    }
                    
                    .snippet-card { 
                        margin-bottom: 8px; 
                        padding: 8px; 
                        border-radius: 4px;
                        cursor: pointer;
                        background: var(--vscode-sideBar-background);
                        border: 1px solid transparent;
                        transition: all 0.2s;
                    }
                    .snippet-card:hover { 
                        background: var(--vscode-list-hoverBackground);
                        border-color: var(--vscode-focusBorder);
                    }
                    
                    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
                    .title { font-weight: 600; font-size: 0.95em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
                    
                    .badge { 
                        font-size: 0.7em; 
                        padding: 2px 6px; 
                        border-radius: 10px; 
                        font-weight: bold;
                        text-transform: uppercase;
                    }
                    
                    .lang-js, .lang-javascript, .lang-typescript, .lang-ts { background: #f1e05a; color: #000; }
                    .lang-python, .lang-py { background: #3572A5; color: #fff; }
                    .lang-html { background: #e34c26; color: #fff; }
                    .lang-css { background: #563d7c; color: #fff; }
                    .lang-json { background: #ccc; color: #000; }
                    .lang-default { background: var(--vscode-badge-background); color: var(--vscode-badge-foreground); }

                    pre[class*="language-"] {
                        font-size: 0.8em !important;
                        padding: 5px !important;
                        margin: 5px 0 0 0 !important;
                        border-radius: 3px !important;
                        max-height: 100px;
                        overflow: hidden;
                    }
                    code[class*="language-"] { text-shadow: none !important; }
                </style>
            </head>
            <body>
                <input type="text" class="search-box" id="search" placeholder="${t('sidebar.search_placeholder')}">
                <div id="content">${t('sidebar.loading')}</div>

                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>

                <script>
                    const vscode = acquireVsCodeApi();
                    const contentElement = document.getElementById('content');
                    const searchInput = document.getElementById('search');
                    let allSnippets = [];
                    let allCollections = [];

                    window.addEventListener('message', event => {
                        const message = event.data;
                        if (message.type === 'setData') {
                            allSnippets = message.snippets;
                            allCollections = message.collections;
                            render();
                        }
                    });

                    function getLangClass(lang) {
                        const l = lang.toLowerCase();
                        if (['javascript', 'js', 'typescript', 'ts', 'python', 'py', 'html', 'css', 'json'].includes(l)) {
                            return 'lang-' + l;
                        }
                        return 'lang-default';
                    }

                    function render() {
                        contentElement.innerHTML = '';
                        const term = searchInput.value.toLowerCase();
                        
                        // Group snippets by collection
                        const grouped = {};
                        const unclassified = [];

                        allSnippets.forEach(s => {
                            if (term && !s.title.toLowerCase().includes(term) && !s.code.toLowerCase().includes(term)) return;
                            
                            if (s.collection_id) {
                                if (!grouped[s.collection_id]) grouped[s.collection_id] = [];
                                grouped[s.collection_id].push(s);
                            } else {
                                unclassified.push(s);
                            }
                        });

                        // Render Collections
                        allCollections.forEach(c => {
                            const snippets = grouped[c.id] || [];
                            if (snippets.length === 0 && !term) return; // Don't show empty collections unless searching
                            if (snippets.length === 0 && term) return;

                            renderGroup(c.name, snippets);
                        });

                        // Render Unclassified
                        if (unclassified.length > 0) {
                            renderGroup('Sans Collection', unclassified);
                        }

                        Prism.highlightAll();
                    }

                    function renderGroup(name, snippets) {
                        const container = document.createElement('div');
                        container.className = 'collection-container';
                        
                        const header = document.createElement('div');
                        header.className = 'collection-header';
                        header.innerText = name;
                        container.appendChild(header);

                        snippets.forEach(s => {
                            const card = document.createElement('div');
                            card.className = 'snippet-card';
                            card.innerHTML = \`
                                <div class="card-header">
                                    <div class="title" title="\${s.title}">\${s.title}</div>
                                    <span class="badge \${getLangClass(s.language)}">\${s.language}</span>
                                </div>
                                <pre class="language-\${s.language.toLowerCase()}"><code class="language-\${s.language.toLowerCase()}">\${escapeHtml(s.code.substring(0, 150))}\${s.code.length > 150 ? '...' : ''}</code></pre>
                            \`;
                            card.onclick = () => {
                                vscode.postMessage({ type: 'insertSnippet', code: s.code });
                            };
                            container.appendChild(card);
                        });

                        contentElement.appendChild(container);
                    }

                    function escapeHtml(text) {
                        const div = document.createElement('div');
                        div.textContent = text;
                        return div.innerHTML;
                    }

                    searchInput.oninput = render;
                </script>
            </body>
            </html>`;
    }
}
