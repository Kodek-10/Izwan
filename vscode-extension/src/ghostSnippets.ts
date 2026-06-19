import * as vscode from 'vscode';
import { IzwaAPI, Snippet } from './api';

const CACHE_TTL_MS = 30_000;
const MIN_PREFIX_LENGTH = 3;

export class GhostSnippetProvider implements vscode.InlineCompletionItemProvider {
    private snippets: Snippet[] = [];
    private lastFetch = 0;
    private pendingFetch?: Promise<Snippet[]>;

    constructor(private readonly context: vscode.ExtensionContext) {}

    async provideInlineCompletionItems(
        document: vscode.TextDocument,
        position: vscode.Position,
        _context: vscode.InlineCompletionContext,
        token: vscode.CancellationToken
    ): Promise<vscode.InlineCompletionItem[] | undefined> {
        if (!vscode.workspace.getConfiguration('izwa').get('ghostSnippets.enabled', true)) {
            return undefined;
        }

        const currentLine = document.lineAt(position.line).text.slice(0, position.character);
        const prefix = currentLine.trimStart();
        if (prefix.length < MIN_PREFIX_LENGTH || !/[a-zA-Z0-9_$)]$/.test(prefix)) {
            return undefined;
        }

        const snippets = await this.getSnippets();
        if (token.isCancellationRequested) {
            return undefined;
        }

        const languageId = document.languageId.toLowerCase();
        const completions = snippets
            .filter((snippet) => this.languageMatches(snippet.language, languageId))
            .map((snippet) => this.toCompletion(snippet, prefix, currentLine))
            .filter((item): item is vscode.InlineCompletionItem => Boolean(item));

        return completions.slice(0, 1);
    }

    public clearCache() {
        this.snippets = [];
        this.lastFetch = 0;
        this.pendingFetch = undefined;
    }

    private async getSnippets(): Promise<Snippet[]> {
        const now = Date.now();
        if (this.snippets.length > 0 && now - this.lastFetch < CACHE_TTL_MS) {
            return this.snippets;
        }

        if (!this.pendingFetch) {
            this.pendingFetch = IzwaAPI.fetchSnippets(this.context)
                .then((snippets) => {
                    this.snippets = snippets;
                    this.lastFetch = Date.now();
                    return snippets;
                })
                .finally(() => {
                    this.pendingFetch = undefined;
                });
        }

        return this.pendingFetch;
    }

    private languageMatches(snippetLanguage: string, documentLanguage: string): boolean {
        const aliases: Record<string, string[]> = {
            javascript: ['javascript', 'js'],
            typescript: ['typescript', 'ts', 'tsx'],
            python: ['python', 'py'],
            html: ['html'],
            css: ['css'],
            json: ['json'],
        };
        const normalizedSnippet = snippetLanguage.toLowerCase();
        const values = aliases[documentLanguage] || [documentLanguage];
        return values.includes(normalizedSnippet) || normalizedSnippet === documentLanguage;
    }

    private toCompletion(snippet: Snippet, prefix: string, currentLine: string): vscode.InlineCompletionItem | undefined {
        const lines = snippet.code.replace(/\r\n/g, '\n').split('\n');
        const firstCodeLineIndex = lines.findIndex((line) => line.trim().length > 0);
        if (firstCodeLineIndex === -1) {
            return undefined;
        }

        const firstLine = lines[firstCodeLineIndex].trimStart();
        if (!firstLine.toLowerCase().startsWith(prefix.toLowerCase()) || firstLine.length <= prefix.length) {
            return undefined;
        }

        const currentIndent = currentLine.slice(0, currentLine.length - currentLine.trimStart().length);
        const firstLineSuffix = firstLine.slice(prefix.length);
        const rest = lines
            .slice(firstCodeLineIndex + 1)
            .map((line) => `${currentIndent}${line}`)
            .join('\n');
        const insertText = rest ? `${firstLineSuffix}\n${rest}` : firstLineSuffix;

        return new vscode.InlineCompletionItem(insertText);
    }
}
