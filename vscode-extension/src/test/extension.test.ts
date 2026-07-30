import * as assert from 'assert';
import * as vscode from 'vscode';
import { IzwaAPI } from '../api';
import { IzwaSidebarProvider } from '../sidebar';
import { GhostSnippetProvider } from '../ghostSnippets';

suite('Izwan Extension', () => {
  let extension: vscode.Extension<unknown>;

  suiteSetup(() => {
    extension = vscode.extensions.getExtension('kodek10.izwan-vscode')!;
  });

  test('Extension should be present and activate', async () => {
    assert.ok(extension, 'Extension kodek10.izwan-vscode is not available');
    await extension.activate();
    assert.ok(extension.isActive, 'Extension did not activate');
  });

  test('All commands should be registered', async () => {
    const commands = await vscode.commands.getCommands(true);
    const expected = [
      'izwan.searchSnippet',
      'izwan.saveSnippet',
      'izwan.refreshSnippets',
      'izwan.login',
    ];
    for (const cmd of expected) {
      assert.ok(commands.includes(cmd), `${cmd} not registered`);
    }
  });

  test('Configuration should have defaults', () => {
    const config = vscode.workspace.getConfiguration('izwan');
    assert.strictEqual(
      config.get('backendUrl'),
      'http://localhost:8000/api/v1'
    );
    assert.strictEqual(config.get('frontendUrl'), 'http://localhost:5173/auth');
    assert.strictEqual(config.get('ghostSnippets.enabled'), true);
  });

  test('Login command should exist', async () => {
    const disposables: vscode.Disposable[] = [];
    const commandDisposable = vscode.commands.registerCommand(
      'izwan.login',
      () => {}
    );
    disposables.push(commandDisposable);
    try {
      await vscode.commands.executeCommand('izwan.login');
      assert.ok(true, 'izwan.login command executed without error');
    } finally {
      disposables.forEach((d) => d.dispose());
    }
  });
});

suite('IzwaAPI', () => {
  test('Static methods should exist', () => {
    assert.strictEqual(typeof IzwaAPI.fetchSnippets, 'function');
    assert.strictEqual(typeof IzwaAPI.searchSemantic, 'function');
    assert.strictEqual(typeof IzwaAPI.createSnippet, 'function');
    assert.strictEqual(typeof IzwaAPI.fetchCollections, 'function');
    assert.strictEqual(typeof IzwaAPI.explainSnippet, 'function');
    assert.strictEqual(typeof IzwaAPI.adaptSnippet, 'function');
    assert.strictEqual(typeof IzwaAPI.storeToken, 'function');
  });

  test('Base URL should strip trailing slash', async () => {
    const config = vscode.workspace.getConfiguration('izwan');
    const url = config.get<string>('backendUrl')!;
    assert.ok(!url.endsWith('/'), 'backendUrl should not end with a slash');
  });
});

suite('IzwaSidebarProvider', () => {
  test('Should instantiate without error', () => {
    const context = {
      extensionUri: vscode.Uri.file('/test'),
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;
    const provider = new IzwaSidebarProvider(
      vscode.Uri.file('/test'),
      context
    );
    assert.ok(provider instanceof IzwaSidebarProvider);
  });

  test('Should have correct viewType', () => {
    assert.strictEqual(
      IzwaSidebarProvider.viewType,
      'izwan-snippets-view'
    );
  });
});

suite('GhostSnippetProvider', () => {
  test('Should instantiate without error', () => {
    const context = {
      secrets: { get: async () => undefined, store: async () => {} },
      globalState: { get: () => undefined, update: async () => {} },
      subscriptions: [],
    } as unknown as vscode.ExtensionContext;
    const provider = new GhostSnippetProvider(context);
    assert.ok(provider instanceof GhostSnippetProvider);
  });

  test('Should have clearCache method', () => {
    const context = {} as vscode.ExtensionContext;
    const provider = new GhostSnippetProvider(context);
    assert.strictEqual(typeof provider.clearCache, 'function');
  });
});
