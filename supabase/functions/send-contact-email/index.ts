import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ZOHO_TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";
const ZOHO_MAIL_API = "https://mail.zoho.in/api/accounts";

async function getZohoAccessToken(): Promise<string> {
  const clientId = Deno.env.get("ZOHO_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET");
  const refreshToken = Deno.env.get("ZOHO_REFRESH_TOKEN");

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Zoho API credentials");
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  const response = await fetch(ZOHO_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Zoho access token: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) throw new Error(`Zoho token error: ${data.error}`);
  return data.access_token;
}

async function getZohoAccountId(accessToken: string): Promise<string> {
  const response = await fetch(ZOHO_MAIL_API, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });

  if (!response.ok) throw new Error(`Failed to get Zoho account: ${response.status}`);

  const data = await response.json();
  const account = data.data?.find((acc: any) =>
    acc.emailAddress?.includes("houseofabhilasha.in")
  ) || data.data?.[0];

  if (!account) throw new Error("No Zoho mail account found");
  return account.accountId;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, contactNo, message } = await req.json();

    if (!name || !email || !message) {
      throw new Error("Missing required fields");
    }

    const accessToken = await getZohoAccessToken();
    const accountId = await getZohoAccountId(accessToken);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #8B4513; padding: 24px; text-align: center;">
            <h1 style="color: #fff; margin: 0; font-size: 22px;">New Contact Form Submission</h1>
          </div>
          <div style="padding: 30px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 10px; font-weight: bold; color: #333;">Name:</td><td style="padding: 10px; color: #555;">${name}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 10px; font-weight: bold; color: #333;">Email:</td><td style="padding: 10px; color: #555;">${email}</td></tr>
              <tr><td style="padding: 10px; font-weight: bold; color: #333;">Contact No:</td><td style="padding: 10px; color: #555;">${contactNo || "Not provided"}</td></tr>
              <tr style="background: #f9f9f9;"><td style="padding: 10px; font-weight: bold; color: #333;">Message:</td><td style="padding: 10px; color: #555;">${message}</td></tr>
            </table>
          </div>
          <div style="background: #f8f8f8; padding: 16px; text-align: center; border-top: 1px solid #eee;">
            <p style="color: #999; font-size: 12px; margin: 0;">Sent from House of Abhilasha website contact form</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const response = await fetch(`${ZOHO_MAIL_API}/${accountId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Zoho-oauthtoken ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fromAddress: "support@houseofabhilasha.in",
        toAddress: "support@houseofabhilasha.in",
        subject: `Contact Form: ${name}`,
        content: htmlContent,
        mailFormat: "html",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Zoho send error:", errorText);
      throw new Error(`Failed to send email: ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-contact-email:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
