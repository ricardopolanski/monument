import { test as base } from "@playwright/test";

import { AuthClient } from "../api/clients/auth.client";

export const test = base.extend<{
  authClient: AuthClient;
}>({
  authClient: async ({ request }, use) => {
    const client = new AuthClient(request);
    await use(client);
  },
});

export const expect = test.expect;
