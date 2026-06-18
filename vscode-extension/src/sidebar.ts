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
                case 'explainSnippet':
                    try {
                        const explanation = await IzwaAPI.explainSnippet(this._context, data.code, data.language);
                        webviewView.webview.postMessage({
                            type: 'explanationResult',
                            explanation
                        });
                    } catch (error) {
                        webviewView.webview.postMessage({
                            type: 'explanationError'
                        });
                    }
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
                    .title { font-weight: 600; font-size: 0.95em; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; flex: 1; margin-right: 6px; }
                    
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

                    /* explain-btn and modal */
                    .explain-btn {
                        background: transparent;
                        border: none;
                        cursor: pointer;
                        padding: 2px 4px;
                        font-size: 1.1em;
                        border-radius: 3px;
                        transition: background 0.2s;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .explain-btn:hover {
                        background: var(--vscode-toolbar-hoverBackground);
                    }
                    .modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        background: rgba(0, 0, 0, 0.7);
                        z-index: 1000;
                        display: flex;
                        flex-direction: column;
                    }
                    .modal-content {
                        background: var(--vscode-sideBar-background);
                        color: var(--vscode-foreground);
                        margin: 10px;
                        padding: 15px;
                        border: 1px solid var(--vscode-focusBorder);
                        border-radius: 4px;
                        flex: 1;
                        display: flex;
                        flex-direction: column;
                        overflow: hidden;
                    }
                    .modal-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        border-bottom: 1px solid var(--vscode-divider);
                        padding-bottom: 8px;
                        margin-bottom: 10px;
                    }
                    .modal-header span {
                        font-weight: bold;
                        font-size: 1.1em;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .close-btn {
                        background: transparent;
                        border: none;
                        color: var(--vscode-foreground);
                        font-size: 1.5em;
                        cursor: pointer;
                        line-height: 1;
                    }
                    .close-btn:hover {
                        color: var(--vscode-errorForeground);
                    }
                    #explanation-body {
                        flex: 1;
                        overflow-y: auto;
                        font-size: 0.9em;
                        line-height: 1.4;
                    }
                    #explanation-body h1, #explanation-body h2, #explanation-body h3 {
                        margin-top: 12px;
                        margin-bottom: 6px;
                        font-weight: 600;
                        color: var(--vscode-textLink-foreground);
                    }
                    #explanation-body p {
                        margin: 0 0 8px 0;
                    }
                    #explanation-body ul, #explanation-body ol {
                        margin: 0 0 10px 0;
                        padding-left: 20px;
                    }
                    #explanation-body code {
                        background: rgba(127, 127, 127, 0.2);
                        padding: 2px 4px;
                        border-radius: 3px;
                        font-family: var(--vscode-editor-font-family);
                    }
                    #explanation-body pre {
                        background: rgba(0, 0, 0, 0.3);
                        border: 1px solid var(--vscode-divider);
                        padding: 8px;
                        border-radius: 4px;
                        overflow-x: auto;
                        margin: 8px 0;
                    }
                </style>
            </head>
            <body>
                <input type="text" class="search-box" id="search" placeholder="${t('sidebar.search_placeholder')}">
                <div id="content">${t('sidebar.loading')}</div>

                <!-- Explanation Modal -->
                <div id="explanation-modal" class="modal" style="display:none;">
                    <div class="modal-content">
                        <div class="modal-header">
                            <span id="explanation-title">Explication</span>
                            <button class="close-btn" onclick="closeExplanation()">&times;</button>
                        </div>
                        <div id="explanation-body"></div>
                    </div>
                </div>

                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-python.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-typescript.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-json.min.js"></script>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/4.3.0/marked.min.js"></script>

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
                        } else if (message.type === 'explanationResult') {
                            const bodyEl = document.getElementById('explanation-body');
                            bodyEl.innerHTML = marked.parse(message.explanation);
                        } else if (message.type === 'explanationError') {
                            const bodyEl = document.getElementById('explanation-body');
                            bodyEl.innerHTML = '<div style="color:var(--vscode-errorForeground);padding:20px;text-align:center;">❌ Erreur lors de la génération de l\\'explication.</div>';
                        }
                    });

                    function closeExplanation() {
                        document.getElementById('explanation-modal').style.display = 'none';
                    }

                    function explainSnippet(id) {
                        const s = allSnippets.find(x => x.id === id);
                        if (!s) return;
                        
                        const modal = document.getElementById('explanation-modal');
                        const titleEl = document.getElementById('explanation-title');
                        const bodyEl = document.getElementById('explanation-body');
                        
                        titleEl.innerText = "Explication : " + s.title;
                        bodyEl.innerHTML = '<div style="display:flex;align-items:center;gap:8px;padding:20px;justify-content:center;">⏳ Analyse en cours par l\\'IA...</div>';
                        modal.style.display = 'flex';
                        
                        vscode.postMessage({
                            type: 'explainSnippet',
                            code: s.code,
                            language: s.language
                        });
                    }

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
                                    <div style="display: flex; gap: 6px; align-items: center;">
                                        <span class="badge \${getLangClass(s.language)}">\${s.language}</span>
                                        <button class="explain-btn" title="Expliquer avec l'IA" onclick="event.stopPropagation(); explainSnippet(\${s.id})">💡</button>
                                    </div>
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
