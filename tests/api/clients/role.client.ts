import { APIRequestContext } from "@playwright/test";

const API_URL = process.env.API_URL ?? 'https://localhost:4000';

export class RoleClient {
  constructor(private request: APIRequestContext) {}

  async createRole(accessToken: string, data: any) {
    const response = await this.request.post(
      `${API_URL}/roles`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*",
          "Authorization": `Bearer ${accessToken}`,
        },
        data: JSON.stringify(data),
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
}
