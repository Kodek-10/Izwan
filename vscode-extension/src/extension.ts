import * as vscode from 'vscode';
import { IzwaSidebarProvider } from './sidebar';
import { IzwaAPI } from './api';

export function activate(context: vscode.ExtensionContext) {
    console.log('Félicitations, votre extension "Izwa" est maintenant active !');

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
        const username = await vscode.window.showInputBox({ prompt: 'Nom d\'utilisateur' });
        if (!username) return;
        
        const password = await vscode.window.showInputBox({ 
            prompt: 'Mot de passe',
            password: true 
        });
        if (!password) return;

        const success = await IzwaAPI.login(context, username, password);
        if (success) {
            vscode.window.showInformationMessage('Izwa: Connexion réussie !');
            sidebarProvider.refresh();
        } else {
            vscode.window.showErrorMessage('Izwa: Échec de la connexion. Vérifiez vos identifiants.');
        }
    });

    let searchCommand = vscode.commands.registerCommand('izwa.searchSnippet', async () => {
        const query = await vscode.window.showInputBox({
            prompt: 'Entrez votre recherche sémantique (ex: filtrer un tableau par date)',
            placeHolder: 'Recherche Izwa...'
        });
        
        if (query) {
            const results = await IzwaAPI.searchSemantic(context, query);
            if (results.length === 0) {
                vscode.window.showInformationMessage('Aucun résultat trouvé.');
                return;
            }
            
            const items = results.map(s => ({
                label: s.title,
                description: s.language,
                detail: s.description,
                snippet: s
            }));

            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Sélectionnez un snippet à insérer'
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
