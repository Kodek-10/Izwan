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
      // Le cookie httpOnly est invalidé côté serveur (expiration/révocation H4). On synchronise
      // le flag de présence client puis on renvoie vers /auth.
      document.cookie = "session=; Max-Age=0; path=/";
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
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
  async signup(username: string, email: string, password: string, display_name?: string): Promise<{ access_token: string }> {
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

    // H2 : le JWT est posé en cookie httpOnly par le serveur. On ne le stocke pas
    // en localStorage (ferme l'exfiltration XSS / CWE-922). data.access_token reste
    // renvoyé pour back-compat clients non-navigateur.
    return response.json();
  }

  async logout(): Promise<void> {
    // Le cookie httpOnly ne peut être vidé que par le serveur. Le flag de présence
    // (session=1) est effacé côté client pour qu'isAuthenticated() retourne faux immédiatement.
    if (isBrowser) {
      document.cookie = "session=; Max-Age=0; path=/";
      try {
        await this.post("/auth/logout", {});
      } catch {
        // Tolérant : le navigateur efface tout au prochain /auth.
      }
    }
  }

  isAuthenticated() {
    if (!isBrowser) return false; // On redirige vers auth sur le serveur pour éviter les incohérences de rendu
    return document.cookie.split(";").some((c) => c.trim() === "session=1");
  }
}

export const api = new ApiClient();
