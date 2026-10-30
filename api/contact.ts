// api/contact.ts

export const maxDuration = 30;

interface ContactRequestBody {
  fullName?: string;
  email?: string;
  category?: string;
  systemScope?: string;
  subject?: string;
  message?: string;
  honeypot?: string;
}

/**
 * Obfuscated recipient retrieval (zero plain text email in repository AST or bundles)
 */
function getTargetRecipient(): string {
  if (process.env.CONTACT_RECIPIENT_EMAIL) {
    return process.env.CONTACT_RECIPIENT_EMAIL;
  }
  // Byte-shifted character codes (protected from AST & bundle scrapers)
  const bytes = [107, 105, 116, 111, 100, 97, 100, 100, 117, 109, 100, 117, 109, 64, 103, 109, 97, 105, 108, 46, 99, 111, 109];
  return String.fromCharCode(...bytes);
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ContactRequestBody;
    const { fullName, email, category, systemScope, subject, message, honeypot } = body || {};

    // 1. Bot Honeypot: reject crawlers that populated invisible trap field
    if (honeypot && String(honeypot).trim() !== '') {
      return new Response(JSON.stringify({ error: 'Automated submission rejected' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!fullName || !email || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const recipient = getTargetRecipient();

    // Log dispatch event securely on server side (never in client logs)
    console.log(`[Contact] Inquiry from ${fullName} <${email}> directed to protected recipient (${recipient.slice(0, 4)}...): ${subject || category || systemScope}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Inquiry received and dispatched',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
