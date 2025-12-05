export async function createMailosaurUser() {
    const MAILOSAUR_SERVER_ID = process.env.MAILOSAUR_SERVER_ID ?? 'bgzl7quv';
    const MAILOSAUR_API_KEY = process.env.MAILOSAUR_API_KEY;
    const MAILOSAUR_DOMAIN = `${MAILOSAUR_SERVER_ID}.mailosaur.net`;

    if (!MAILOSAUR_API_KEY) {
        throw new Error('MAILOSAUR_API_KEY not defined. Define MAILOSAUR_API_KEY in .env or secrets in CI.');
    }

    // ---------- Create unique email and user ----------
    const mailLocalPart = `rpolanski+${Date.now()}`;
    const mailAddress = `${mailLocalPart}@${MAILOSAUR_DOMAIN}`;

    return {
        mailAddress,
        MAILOSAUR_API_KEY,
        MAILOSAUR_SERVER_ID
    };
}
