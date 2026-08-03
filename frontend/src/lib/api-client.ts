import { API_URL } from "./config";

const isBrowser = typeof window !== "undefined";

class ApiClient {
  public baseUrl = API_URL;

  private get headers() {
    const lang = isBrowser ? localStorage.getItem("i18nextLng") || "fr" : "fr";
    return {
      "Content-Type": "application/json",
      "Accept-Language": lang,
    };
  }

  private async handleError(response: Response) {
    let message = `API Error: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.detail) {
        message = data.detail;
      }
    } catch (e) {
      // Ignorer si le corps n'est pas du JSON
    }

    if (response.status === 401 && isBrowser) {
      // Le cookie httpOnly est invalidé côté serveur (expiration/révocation H4). On efface
      // le drapeau de présence puis on renvoie vers /auth.
      localStorage.removeItem("izwan_auth");
      if (!window.location.pathname.includes("/auth")) {
        window.location.href = "/auth";
      }
    }

    throw new Error(message);
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: this.headers,
    });
    if (!response.ok) {
      await this.handleError(response);
    }
    return response.json();
  }

  async post<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: "POST",
      credentials: "include",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await this.handleError(response);
    }
    return response.json();
  }

  async put<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: "PUT",
      credentials: "include",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await this.handleError(response);
    }
    return response.json();
  }

  async patch<T>(path: string, data: any): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
      method: "PATCH",
      credentials: "include",
      headers: this.headers,
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      await this.handleError(response);
    }
    return response.json();
  }

  async delete(path: string): Promise<void> {
    const response = await fetch(`${API_URL}${path}`, {
      credentials: "include",
      headers: this.headers,
    });
    if (!response.ok) {
      await this.handleError(response);
    }
  }

  // Helper for registration + login
  async signup(
    username: string,
    email: string,
    password: string,
    display_name?: string,
  ): Promise<{ access_token: string }> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password, display_name }),
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    // After successful registration, log in automatically
    return this.login(username, password);
  }

  // Helper for OAuth2 password grant (FastAPI login)
  async login(username: string, password: string): Promise<{ access_token: string }> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    // H2 : le JWT reste en cookie httpOnly (jamais en localStorage -> pas d'exfiltration
    // XSS). On ne garde côté client qu'un drapeau de présence NON secret, indispensable
    // en cross-domaine : le cookie posé par le backend (onrender.com) n'est pas lisible
    // par le JS du front (pages.dev).
    const data = await response.json();
    if (isBrowser) localStorage.setItem("izwan_auth", "1");
    return data;
  }

  // OAuth : l'utilisateur doit être redirigé en plein écran vers le provider.
  // Au retour, le backend pose le cookie JWT puis nous renvoie sur /auth?oauth=success|error.
  // `vscode` (optionnel) : flux extension -> on transmet les paramètres au backend
  // pour qu'il les fasse voyager dans le state OAuth et nous les renvoie en retour.
  oauthLogin(
    provider: "google" | "github",
    vscode?: { redirect_uri: string; state: string },
  ): void {
    const query = vscode
      ? `?redirect_uri=${encodeURIComponent(vscode.redirect_uri)}&state=${encodeURIComponent(vscode.state)}`
      : "";
    window.location.href = `${API_URL}/auth/${provider}${query}`;
  }

  async logout(): Promise<void> {
    // Le cookie httpOnly ne peut être vidé que par le serveur. Le drapeau de présence
    // est effacé côté client pour qu'isAuthenticated() retourne faux immédiatement.
    if (isBrowser) {
      localStorage.removeItem("izwan_auth");
      try {
        await this.post("/auth/logout", {});
      } catch {
        // Tolérant : le navigateur efface tout au prochain /auth.
      }
    }
  }

  isAuthenticated() {
    if (!isBrowser) return false; // On redirige vers auth sur le serveur pour éviter les incohérences de rendu
    // Drapeau de présence NON secret (le vrai JWT reste en cookie httpOnly). En cross-domaine,
    // le cookie du backend n'est pas lisible ici -> localStorage est la seule option fiable.
    return localStorage.getItem("izwan_auth") === "1";
  }
}

export const api = new ApiClient();
