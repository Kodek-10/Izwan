import * as vscode from 'vscode';

export interface Snippet {
    id: number;
    title: string;
    language: string;
    code: string;
    description: string;
    tags: string[];
}

export class IzwaAPI {
    private static getBaseUrl(): string {
        return vscode.workspace.getConfiguration('izwa').get('backendUrl') || 'http://localhost:8000/api/v1';
    }

    private static async getAuthHeader(context: vscode.ExtensionContext): Promise<Record<string, string>> {
        const token = await context.secrets.get('izwa.token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    static async fetchSnippets(context: vscode.ExtensionContext): Promise<Snippet[]> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            const response = await fetch(`${baseUrl}/snippets/`, { headers });
            
            if (response.status === 401) {
                vscode.window.showWarningMessage('Izwa: Session expirée ou non connectée. Veuillez vous connecter.');
                return [];
            }

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json() as any;
            // Gérer le format paginé { total, items, ... }
            return (data.items || []) as Snippet[];
        } catch (error) {
            console.error('Izwa Error:', error);
            vscode.window.showErrorMessage(`Izwa: Impossible de se connecter au backend. Vérifiez l'URL et assurez-vous qu'il est lancé.`);
            return [];
        }
    }

    static async login(context: vscode.ExtensionContext, username: string, password: string): Promise<boolean> {
        try {
            const baseUrl = this.getBaseUrl();
            const formData = new URLSearchParams();
            formData.append('username', username);
            formData.append('password', password);

            const response = await fetch(`${baseUrl}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData
            });

            if (!response.ok) {
                return false;
            }

            const data = await response.json() as { access_token: string };
            await context.secrets.store('izwa.token', data.access_token);
            return true;
        } catch (error) {
            console.error('Login error:', error);
            return false;
        }
    }

    static async searchSemantic(context: vscode.ExtensionContext, query: string): Promise<Snippet[]> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            const response = await fetch(`${baseUrl}/search/semantic?query=${encodeURIComponent(query)}`, { headers });
            
            if (!response.ok) {
                throw new Error('Erreur lors de la recherche sémantique');
            }
            return await response.json() as Snippet[];
        } catch (error) {
            console.error(error);
            return [];
        }
    }
}
