import * as vscode from 'vscode';
import { IzwaSidebarProvider } from './sidebar';
import { IzwaAPI } from './api';
import { t } from './i18n';
import { GhostSnippetProvider } from './ghostSnippets';
import { BrowserAuthHandler } from './browserAuth';

export function activate(context: vscode.ExtensionContext) {
    console.log(t('extension.active'));

    const sidebarProvider = new IzwaSidebarProvider(context.extensionUri, context);
    const ghostSnippetProvider = new GhostSnippetProvider(context);
    const refreshAuthenticatedViews = () => {
        ghostSnippetProvider.clearCache();
        sidebarProvider.refresh();
    };
    const browserAuthHandler = new BrowserAuthHandler(context, refreshAuthenticatedViews);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            IzwaSidebarProvider.viewType,
            sidebarProvider
        ),
        vscode.languages.registerInlineCompletionItemProvider(
            { scheme: 'file' },
            ghostSnippetProvider
        ),
        vscode.window.registerUriHandler(browserAuthHandler)
    );

    let refreshCommand = vscode.commands.registerCommand('izwan.refreshSnippets', () => {
        refreshAuthenticatedViews();
    });

    let loginCommand = vscode.commands.registerCommand('izwan.login', async () => {
        await browserAuthHandler.startLogin();
    });

    let searchCommand = vscode.commands.registerCommand('izwan.searchSnippet', async () => {
        const query = await vscode.window.showInputBox({
            prompt: t('search.prompt'),
            placeHolder: t('search.placeholder')
        });
        
        if (query) {
            const results = await IzwaAPI.searchSemantic(context, query);
            if (results.length === 0) {
                vscode.window.showInformationMessage(t('search.no_results'));
                return;
            }
            
            const items = results.map(s => ({
                label: s.title,
                description: s.language,
                detail: s.description,
                snippet: s
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: t('search.select_placeholder')
            });

            if (selected) {
                const editor = vscode.window.activeTextEditor;
                if (editor) {
                    editor.edit(editBuilder => {
                        editBuilder.insert(editor.selection.active, selected.snippet.code);
                    });
                }
            }
        }
    });

    let saveCommand = vscode.commands.registerCommand('izwan.saveSnippet', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage(t('capture.no_selection'));
            return;
        }

        const selection = editor.selection;
        const text = editor.document.getText(selection);

        if (!text || text.trim().length === 0) {
            vscode.window.showWarningMessage(t('capture.no_selection'));
            return;
        }

        const title = await vscode.window.showInputBox({
            prompt: t('capture.prompt.title'),
            placeHolder: 'e.g., Quick sort implementation'
        });

        if (!title || title.trim().length === 0) {
            return;
        }

        const languageId = editor.document.languageId || 'plaintext';

        const success = await IzwaAPI.createSnippet(context, {
            title: title,
            code: text,
            language: languageId
        });

        if (success) {
            vscode.window.showInformationMessage(t('capture.success'));
            refreshAuthenticatedViews();
        } else {
            vscode.window.showErrorMessage(t('capture.error'));
        }
    });

    context.subscriptions.push(refreshCommand, loginCommand, searchCommand, saveCommand);
}

export function deactivate() {}
