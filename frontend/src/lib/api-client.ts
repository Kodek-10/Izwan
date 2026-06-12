import { API_URL } from "./config";

const isBrowser = typeof window !== "undefined";

class ApiClient {
  public baseUrl = API_URL;

  private get headers() {
    const token = isBrowser ? localStorage.getItem("token") : null;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
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
      localStorage.removeItem("token");
      // Optionnel: On peut forcer un rechargement pour que le guard de route redirige vers /auth
      if (!window.location.pathname.includes('/auth')) {
        window.location.href = '/auth';
      }
    }
    
    throw new Error(message);
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${API_URL}${path}`, {
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
      method: "DELETE",
      headers: this.headers,
    });
    if (!response.ok) {
      await this.handleError(response);
    }
  }

  // Helper for OAuth2 password grant (FastAPI login)
  async login(username: string, password: string): Promise<{ access_token: string }> {
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);

    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    if (!response.ok) {
      await this.handleError(response);
    }

    const data = await response.json();
    if (isBrowser) {
      localStorage.setItem("token", data.access_token);
    }
    return data;
  }

  logout() {
    if (isBrowser) {
      localStorage.removeItem("token");
    }
  }

  isAuthenticated() {
    if (!isBrowser) return false; // On redirige vers auth sur le serveur pour éviter les incohérences de rendu
    return !!localStorage.getItem("token");
  }
}

export const api = new ApiClient();
