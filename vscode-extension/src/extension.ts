import * as vscode from 'vscode';
import { IzwaSidebarProvider } from './sidebar';
import { IzwaAPI } from './api';
import { t } from './i18n';

export function activate(context: vscode.ExtensionContext) {
    console.log(t('extension.active'));

    const sidebarProvider = new IzwaSidebarProvider(context.extensionUri, context);

    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            IzwaSidebarProvider.viewType,
            sidebarProvider
        )
    );

    let refreshCommand = vscode.commands.registerCommand('izwa.refreshSnippets', () => {
        sidebarProvider.refresh();
    });

    let loginCommand = vscode.commands.registerCommand('izwa.login', async () => {
        const username = await vscode.window.showInputBox({ prompt: t('login.prompt.username') });
        if (!username) return;
        
        const password = await vscode.window.showInputBox({ 
            prompt: t('login.prompt.password'),
            password: true 
        });
        if (!password) return;

        const success = await IzwaAPI.login(context, username, password);
        if (success) {
            vscode.window.showInformationMessage(t('login.success'));
            sidebarProvider.refresh();
        } else {
            vscode.window.showErrorMessage(t('login.error'));
        }
    });

    let searchCommand = vscode.commands.registerCommand('izwa.searchSnippet', async () => {
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

    context.subscriptions.push(refreshCommand, loginCommand, searchCommand);
}

export function deactivate() {}
