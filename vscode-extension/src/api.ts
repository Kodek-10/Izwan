import * as vscode from 'vscode';

export interface Snippet {
    id: number;
    title: string;
    language: string;
    code: string;
    description: string;
    tags: string[];
    collection_id?: number | null;
}

export interface Collection {
    id: number;
    name: string;
    description?: string;
    icon?: string;
}

export class IzwaAPI {
    private static getBaseUrl(): string {
        return vscode.workspace.getConfiguration('izwa').get('backendUrl') || 'http://localhost:8000/api/v1';
    }

    private static async getAuthHeader(context: vscode.ExtensionContext): Promise<Record<string, string>> {
        const token = await context.secrets.get('izwa.token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    static async storeToken(context: vscode.ExtensionContext, token: string): Promise<void> {
        await context.secrets.store('izwa.token', token);
    }

    static async fetchSnippets(context: vscode.ExtensionContext): Promise<Snippet[]> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            const response = await fetch(`${baseUrl}/snippets/`, { headers });
            
            if (response.status === 401) {
                vscode.window.showWarningMessage('Izwan: Session expirée ou non connectée. Veuillez vous connecter.');
                return [];
            }

            if (!response.ok) {
                throw new Error(`Erreur HTTP: ${response.status}`);
            }

            const data = await response.json() as any;
            // Gérer le format paginé { total, items, ... }
            return (data.items || []) as Snippet[];
        } catch (error) {
            console.error('Izwan Error:', error);
            vscode.window.showErrorMessage(`Izwan: Impossible de se connecter au backend. Vérifiez l'URL et assurez-vous qu'il est lancé.`);
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
            await this.storeToken(context, data.access_token);
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

    static async createSnippet(context: vscode.ExtensionContext, snippetData: { title: string; code: string; language: string }): Promise<boolean> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            
            const response = await fetch(`${baseUrl}/snippets/`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: snippetData.title,
                    code: snippetData.code,
                    language: snippetData.language,
                    description: "", // Généré automatiquement par l'IA au backend si non spécifié
                    tags: []
                })
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error('Create snippet error response:', errText);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Create snippet network error:', error);
            return false;
        }
    }

    static async fetchCollections(context: vscode.ExtensionContext): Promise<Collection[]> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            const response = await fetch(`${baseUrl}/collections/`, { headers });
            
            if (!response.ok) {
                return [];
            }
            return await response.json() as Collection[];
        } catch (error) {
            console.error('Izwan Error fetching collections:', error);
            return [];
        }
    }

    static async explainSnippet(context: vscode.ExtensionContext, code: string, language: string): Promise<string> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            
            const response = await fetch(`${baseUrl}/ai/explain`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, language })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as { explanation: string };
            return data.explanation;
        } catch (error) {
            console.error('Izwan Error explaining snippet:', error);
            throw error;
        }
    }

    static async adaptSnippet(context: vscode.ExtensionContext, code: string, language: string, surroundingCode: string): Promise<string> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            
            const response = await fetch(`${baseUrl}/ai/adapt`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ code, language, surrounding_code: surroundingCode })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json() as { adapted_code: string };
            return data.adapted_code;
        } catch (error) {
            console.error('Izwan Error adapting snippet:', error);
            throw error;
        }
    }
}
