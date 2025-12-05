import { APIRequestContext } from "@playwright/test";

const API_URL = process.env.API_URL ?? 'https://localhost:4000';

export class UserAccountClient {
  constructor(private request: APIRequestContext) {}

  async createUser(accessToken: string, data: any) {
    const response = await this.request.post(
      `${API_URL}/userAccount`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "Authorization": `Bearer ${accessToken}`,
        },
        data: JSON.stringify(data), // body, not data
      }
    );

    const raw = await response.text();
    let json: any = undefined;
    try { json = JSON.parse(raw); } catch {}

    return {
      status: response.status(),
      raw,
      json,
      headers: response.headers()
    };
  }

  async getUser(accessToken: string, userId: string) {
    const res = await this.request.get(`${API_URL}/userAccount/${userId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });
    const raw = await res.text();
    let json: any = undefined;
    try { json = JSON.parse(raw); } catch {}
    return { status: res.status(), raw, json, headers: res.headers() };
  }

  async listUsers(accessToken: string, params: Record<string, string | number>) {
    const query = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      query.append(key, String(value));
    }

    const url = `${API_URL}/userAccount?${query.toString()}`;

    const response = await this.request.get(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    });

    const raw = await response.text();
    let json: any = undefined;
    try { json = JSON.parse(raw); } catch {}

    return { status: response.status(), raw, json, headers: response.headers() };
  }
}
