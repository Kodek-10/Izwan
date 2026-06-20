import * as crypto from 'crypto';
import * as vscode from 'vscode';
import { IzwaAPI } from './api';
import { t } from './i18n';

const AUTH_STATE_KEY = 'izwa.browserAuth.state';

export class BrowserAuthHandler implements vscode.UriHandler {
    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly onAuthenticated: () => void
    ) {}

    async startLogin(): Promise<void> {
        const state = crypto.randomBytes(24).toString('hex');
        await this.context.globalState.update(AUTH_STATE_KEY, state);

        const callbackUri = await vscode.env.asExternalUri(
            vscode.Uri.parse(`${vscode.env.uriScheme}://kodek10.izwa-vscode/auth`)
        );
        const authUrl = this.buildAuthUrl(callbackUri, state);

        const opened = await vscode.env.openExternal(authUrl);
        if (!opened) {
            vscode.window.showErrorMessage(t('login.browser_open_error'));
        }
    }

    async handleUri(uri: vscode.Uri): Promise<void> {
        if (uri.path !== '/auth' && uri.authority !== 'auth') {
            return;
        }

        const params = this.readCallbackParams(uri);
        const expectedState = this.context.globalState.get<string>(AUTH_STATE_KEY);

        if (!params.token || !params.state || params.state !== expectedState) {
            vscode.window.showErrorMessage(t('login.callback_error'));
            return;
        }

        await IzwaAPI.storeToken(this.context, params.token);
        await this.context.globalState.update(AUTH_STATE_KEY, undefined);

        vscode.window.showInformationMessage(t('login.success'));
        this.onAuthenticated();
    }

    private buildAuthUrl(callbackUri: vscode.Uri, state: string): vscode.Uri {
        const frontendUrl = vscode.workspace
            .getConfiguration('izwa')
            .get<string>('frontendUrl', 'http://localhost:5173/auth');
        const authUrl = new URL(frontendUrl);

        authUrl.searchParams.set('redirect_uri', callbackUri.toString(true));
        authUrl.searchParams.set('state', state);
        authUrl.searchParams.set('source', 'vscode');

        return vscode.Uri.parse(authUrl.toString());
    }

    private readCallbackParams(uri: vscode.Uri): { token?: string; state?: string } {
        const params = new URLSearchParams(uri.query);
        if (uri.fragment) {
            const fragmentParams = new URLSearchParams(uri.fragment);
            fragmentParams.forEach((value, key) => params.set(key, value));
        }

        return {
            token: params.get('token') ?? undefined,
            state: params.get('state') ?? undefined
        };
    }
}
