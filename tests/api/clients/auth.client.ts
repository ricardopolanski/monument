import { APIRequestContext } from "@playwright/test";

const API_URL = process.env.API_URL ?? 'https://localhost:4000';

export class AuthClient {
  constructor(private request: APIRequestContext) {}

  async login(username = process.env.ADMIN_EMAIL!, password = process.env.ADMIN_PASSWORD!) {
    const payload = { username, password, acceptTermsAndConditions: false };

    const response = await this.request.post(
      `${API_URL}/auth/login`,
      {
        headers: {
          "Content-Type": "application/json",
          "Accept": "*/*"
        },
        data: JSON.stringify(payload),
      }
    );

    const text = await response.text();
    let json: any = undefined;
    try { json = JSON.parse(text); } catch {}

    return {
      status: response.status(),
      raw: text,
      json,
      tokens: json?.tokens,
      headers: response.headers()
    };
  }


}
