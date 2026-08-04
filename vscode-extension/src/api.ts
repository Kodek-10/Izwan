import * as vscode from 'vscode';
import { t } from './i18n';

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
        const url: string = vscode.workspace.getConfiguration('izwan').get('backendUrl') || 'https://izwan-backend.onrender.com/api/v1';
        return url.replace(/\/+$/, '');
    }

    private static async getAuthHeader(context: vscode.ExtensionContext): Promise<Record<string, string>> {
        const token = await context.secrets.get('izwan.token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    static async storeToken(context: vscode.ExtensionContext, token: string): Promise<void> {
        await context.secrets.store('izwan.token', token);
    }

    static async fetchSnippets(context: vscode.ExtensionContext): Promise<Snippet[]> {
        try {
            const baseUrl = this.getBaseUrl();
            const headers = await this.getAuthHeader(context);
            const pageSize = 100;
            let allItems: Snippet[] = [];
            let skip = 0;

            while (true) {
                const response = await fetch(`${baseUrl}/snippets/?skip=${skip}&limit=${pageSize}`, { headers });

                if (response.status === 401) {
                    vscode.window.showWarningMessage(t('session_expired'));
                    return [];
                }

                if (!response.ok) {
                    throw new Error(`Erreur HTTP: ${response.status}`);
                }

                const data = await response.json() as any;
                const items: Snippet[] = data.items || [];
                allItems = allItems.concat(items);

                if (items.length < pageSize || allItems.length >= data.total) {
                    break;
                }
                skip += pageSize;
            }

            return allItems;
        } catch (error) {
            console.error('Izwan Error:', error);
            vscode.window.showErrorMessage(t('connection_error'));
            return [];
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
            const lang = vscode.env.language.startsWith('fr') ? 'fr' : 'en';
            
            const response = await fetch(`${baseUrl}/ai/explain`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                    'Accept-Language': lang
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
            const lang = vscode.env.language.startsWith('fr') ? 'fr' : 'en';
            
            const response = await fetch(`${baseUrl}/ai/adapt`, {
                method: 'POST',
                headers: {
                    ...headers,
                    'Content-Type': 'application/json',
                    'Accept-Language': lang
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
