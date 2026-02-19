import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface PasswordResetRequest {
  email: string;
}

// Zoho API endpoints for India data center
const ZOHO_TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";
const ZOHO_MAIL_API = "https://mail.zoho.in/api/accounts";

function generateTemporaryPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

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
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoho token error:", errorText);
    throw new Error(`Failed to get Zoho access token: ${response.status}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Zoho token error: ${data.error}`);
  }
  
  return data.access_token;
}

async function getZohoAccountId(accessToken: string, fromEmail: string): Promise<string> {
  const response = await fetch(ZOHO_MAIL_API, {
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoho account error:", errorText);
    throw new Error(`Failed to get Zoho account: ${response.status}`);
  }

  const data = await response.json();
  const account = data.data?.find((acc: any) => 
    acc.emailAddress === fromEmail || acc.emailAddress?.includes("houseofabhilasha.in")
  ) || data.data?.[0];

  if (!account) {
    throw new Error("No Zoho mail account found");
  }

  return account.accountId;
}

async function sendEmail(
  accessToken: string,
  accountId: string,
  fromAddress: string,
  to: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  const response = await fetch(`${ZOHO_MAIL_API}/${accountId}/messages`, {
    method: "POST",
    headers: {
      Authorization: `Zoho-oauthtoken ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fromAddress: fromAddress,
      toAddress: to,
      subject: subject,
      content: htmlContent,
      mailFormat: "html",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoho send email error:", errorText);
    throw new Error(`Failed to send email: ${response.status}`);
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email }: PasswordResetRequest = await req.json();

    if (!email) {
      throw new Error("Missing required field: email");
    }

    console.log(`Processing password reset for: ${email}`);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase credentials");
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Find user by email
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error listing users:", userError);
      throw new Error("Failed to find user");
    }

    const user = userData.users.find(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      // Don't reveal if user exists or not for security
      console.log("User not found, but returning success for security");
      return new Response(
        JSON.stringify({ success: true, message: "If the email exists, a temporary password has been sent" }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Update user's password
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      password: temporaryPassword,
    });

    if (updateError) {
      console.error("Error updating password:", updateError);
      throw new Error("Failed to reset password");
    }

    console.log("Password updated successfully, sending email...");

    // Send email with temporary password
    const accessToken = await getZohoAccessToken();
    const accountId = await getZohoAccountId(accessToken, "support@houseofabhilasha.in");

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <div style="background-color: #8B4513; padding: 30px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 24px;">House of Abhilasha</h1>
          </div>
          <div style="padding: 40px 30px;">
            <h2 style="color: #333333; margin-top: 0;">Your Temporary Password</h2>
            <p style="color: #666666; line-height: 1.6;">
              You requested a password reset for your House of Abhilasha account. 
              Here is your temporary password:
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="background-color: #f5f5f5; border: 2px dashed #8B4513; padding: 20px; border-radius: 8px; display: inline-block;">
                <code style="font-size: 24px; font-weight: bold; color: #8B4513; letter-spacing: 2px;">${temporaryPassword}</code>
              </div>
            </div>
            <p style="color: #666666; line-height: 1.6;">
              Please use this password to log in to your account. We recommend changing your password after logging in for security purposes.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="https://houseofabhilasha.in/auth" 
                 style="background-color: #8B4513; color: #ffffff; padding: 14px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Go to Login
              </a>
            </div>
            <p style="color: #999999; font-size: 14px; line-height: 1.6;">
              If you didn't request this password reset, please contact us immediately at support@houseofabhilasha.in
            </p>
          </div>
          <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} House of Abhilasha. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    await sendEmail(
      accessToken,
      accountId,
      "support@houseofabhilasha.in",
      email,
      "Your Temporary Password - House of Abhilasha",
      htmlContent
    );

    console.log(`Temporary password email sent successfully to: ${email}`);

    return new Response(
      JSON.stringify({ success: true, message: "Temporary password sent to email" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-password-reset-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
