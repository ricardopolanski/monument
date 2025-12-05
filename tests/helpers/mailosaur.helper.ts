export async function fetchMailosaurMessage(opts: {
    serverId?: string;
    apiKey?: string;
    sentTo: string;
    timeoutMs?: number;
    intervalMs?: number;
  }) {
    const serverId = opts.serverId ?? process.env.MAILOSAUR_SERVER_ID ?? 'bgzl7quv';
    const apiKey = opts.apiKey ?? process.env.MAILOSAUR_API_KEY;
    if (!apiKey) throw new Error('MAILOSAUR_API_KEY not defined.');
  
    const timeoutMs = opts.timeoutMs ?? 60_000;
    const intervalMs = opts.intervalMs ?? 2000;
    const deadline = Date.now() + timeoutMs;
  
    const MailosaurClient = (await import('mailosaur')).default;
    const client = new MailosaurClient(apiKey);
  
    let lastErr: any = null;
    while (Date.now() < deadline) {
      try {
        const message = await client.messages.get(serverId, { sentTo: opts.sentTo });
        if (message) return message;
      } catch (err: any) {
        lastErr = err;
        if (String(err.message).toLowerCase().includes('permission')) {
          throw new Error('Permission insufficient to access Mailosaur — verify MAILOSAUR_API_KEY.');
        }
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
  
    throw new Error(`Message not found for ${opts.sentTo} within ${timeoutMs}ms. Last error: ${String(lastErr?.message ?? lastErr)}`);
  }
  
  export function extractTemporaryPassword(message: any): string | null {
    const body = message.text?.body ?? message.html?.body ?? '';
    const m = body.match(/Temporary Password:\s*([^\s<]+)/i);
    return m ? m[1] : null;
  }
  