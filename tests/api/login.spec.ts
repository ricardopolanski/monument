import test, { expect } from "@playwright/test";

import { createMailosaurUser } from "tests/helpers/create-mailosaur-user.helper";

import { AuthClient } from "./clients/auth.client";
import { UserAccountClient } from "./clients/user.client";
import { RoleClient } from "./clients/role.client";

test.describe("Positive Scenarios - Login API - @positive @login", () => {
  test("Should login with valid credentials", async ({ request }) => {
    const auth = new AuthClient(request);
    const res = await auth.login();

    expect(res.status).toBe(200);
    expect(res.json.success).toBe(true);
    expect(res.json.tokens).toBeTruthy();
  });

  test("Should login and create user", async ({ request }) => {
    const auth = new AuthClient(request);
    const userClient = new UserAccountClient(request);
    const login = await auth.login();

    expect(login.status).toBe(200);
    expect(login.json.tokens).toBeTruthy();

    const token = login.json.tokens.AccessToken;
    const { faker } = await import("@faker-js/faker");

    const newUser = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      jobTitle: "QA Automation",
      email: faker.internet.email(),
      hasAllFacilityAccess: false,
      facilityOrgIds: [
        "f4bb96e1-8204-11f0-973a-89f348dc1def"
      ],
      rootRoleId: "00000000-0000-0000-0000-000000000000"
    };

    const createRes = await userClient.createUser(token, newUser);

    expect(createRes.status).toBe(201);

    const body = createRes.json;

    expect(body.id).toBeDefined();

    expect(body.accountStatus).toBe("PENDING_VERIFICATION");

    expect(body.firstName).toBe(newUser.firstName);

    expect(body.lastName).toBe(newUser.lastName);

    expect(body.jobTitle).toBe(newUser.jobTitle);

    expect(body.email).toBe(newUser.email);
  });

  test("Should login and create role", async ({ request }) => {
    const auth = new AuthClient(request);
    const roleClient = new RoleClient(request);
    const { faker } = await import("@faker-js/faker");
    const login = await auth.login();

    expect(login.status).toBe(200);

    expect(login.json.tokens).toBeTruthy();

    const token = login.json.tokens.AccessToken;

    const roleName = "Compliance_" + faker.lorem.word(6);

    const newRole = {
      name: roleName,
      description: "",
      permissions: {
        writeOffs: { canView: true, canEdit: false, canCreate: false, canDelete: false },
        refunds: { canView: true, canEdit: false, canCreate: false, canDelete: false },
        voidInvoice: { canView: true, canEdit: false, canCreate: false, canDelete: false },
        insuranceWidget: { canView: true },
        usersSettings: { canView: true, canDelete: true },
        rolesSettings: { canView: true, canDelete: true },
        facilitiesSettings: { canView: true, canDelete: true },
        accessPlans: { canView: true, canDelete: true },
        organizationSettings: { canView: true, canDelete: true },
        billingAndTaxesSettings: { canView: true, canDelete: true },
        templateDocuments: { canView: true, canDelete: true }
      }
    };

    const createRes = await roleClient.createRole(token, newRole);

    expect(createRes.status).toBe(201);

    const body = createRes.json;

    expect(body.id).toBeDefined();

    expect(body.name).toBe(roleName);

    expect(body.isAdmin).toBe(false);

    expect(body.permissions).toBeDefined();

    expect(body.permissions.writeOffs.canView).toBe(true);
  });

  test("Should login, create role and create user with that role - @email @integration", async ({ request }) => {
    const auth = new AuthClient(request);
    const roleClient = new RoleClient(request);
    const userClient = new UserAccountClient(request);
    const login = await auth.login();
    const { mailAddress } = await createMailosaurUser();

    expect(login.status).toBe(200);

    expect(login.json?.tokens).toBeTruthy();

    const token = login.json.tokens.AccessToken;
    const { faker } = await import("@faker-js/faker");
    const roleName = `Compliance_test_${faker.string.alpha(6)}`;

    const rolePayload = {
      name: roleName,
      description: "",
      permissions: {
        writeOffs: { canView: true, canEdit: false, canCreate: false, canDelete: false },
        refunds: { canView: true, canEdit: false, canCreate: false, canDelete: false },
        voidInvoice: { canView: true, canEdit: false, canCreate: false, canDelete: false },
        insuranceWidget: { canView: true },
        usersSettings: { canView: true, canDelete: true },
        rolesSettings: { canView: true, canDelete: true },
        facilitiesSettings: { canView: true, canDelete: true },
        accessPlans: { canView: true, canDelete: true },
        organizationSettings: { canView: true, canDelete: true },
        billingAndTaxesSettings: { canView: true, canDelete: true },
        templateDocuments: { canView: true, canDelete: true },
      },
    };

    const roleRes = await roleClient.createRole(token, rolePayload);

    expect(roleRes.status).toBe(201);

    expect(roleRes.json?.id).toBeDefined();

    expect(roleRes.json?.name).toBe(roleName);

    const roleId = roleRes.json.id;
    const newUser = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      jobTitle: "QA Automation",
      email: mailAddress,
      hasAllFacilityAccess: false,
      facilityOrgIds: ["f4bb96e1-8204-11f0-973a-89f348dc1def"],
      rootRoleId: roleId,
    };

    const userRes = await userClient.createUser(token, newUser);

    expect(userRes.status).toBe(201);

    expect(userRes.json?.id).toBeDefined();

    expect(userRes.json?.email).toBe(newUser.email);

    expect(userRes.json?.accountStatus).toBeDefined();

    const getUserRes = await userClient.getUser(token, userRes.json.id);

    expect(getUserRes.json.rootRoleId).toBe(roleId);
  });

  test("Should create user, list users and verify presence - @email @integration", async ({ request }) => {
    const auth = new AuthClient(request);
    const userClient = new UserAccountClient(request);
    const { mailAddress } = await createMailosaurUser();
    const login = await auth.login();

    expect(login.status).toBe(200);

    const token = login.json.tokens.AccessToken;

    const { faker } = await import("@faker-js/faker");

    const email = mailAddress;

    const newUser = {
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      jobTitle: "QA List Test",
      email,
      hasAllFacilityAccess: false,
      facilityOrgIds: ["f4bb96e1-8204-11f0-973a-89f348dc1def"],
      rootRoleId: "00000000-0000-0000-0000-000000000000"
    };

    const createRes = await userClient.createUser(token, newUser);

    expect(createRes.status).toBe(201);

    expect(createRes.json.email).toBe(email);

    const searchText = email.split("@")[0].slice(-6);

    const listRes = await userClient.listUsers(token, {
      "filters[nameOrEmailSearch]": searchText,
      "filters[status][0]": "ACTIVE",
      "filters[status][1]": "PENDING_VERIFICATION",
      limit: 50,
      page: 1,
      "order[firstName]": "asc",
      "order[lastName]": "asc",
    });

    expect(listRes.status).toBe(200);

    expect(listRes.json.items).toBeInstanceOf(Array);

    expect(listRes.json.items.length).toBeGreaterThan(0);

    const found = listRes.json.items.find((u: any) => u.email === email);

    expect(found).toBeTruthy();

    expect(found.email).toBe(email);
  });
});
