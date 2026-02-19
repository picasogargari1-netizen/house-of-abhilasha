import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  product_name: string;
  quantity: number;
  product_price: number;
  product_image?: string;
}

interface OrderEmailRequest {
  orderId: string;
  customerEmail: string;
  customerName: string;
  shippingAddress: string;
  contactNo: string;
  totalAmount: number;
  paymentMethod: string;
  items: OrderItem[];
  tempPassword?: string | null;
  isNewAccount?: boolean;
  isGuestCheckout?: boolean;
}

const ZOHO_TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";
const ZOHO_MAIL_API = "https://mail.zoho.in/api/accounts";

async function getZohoAccessToken(): Promise<string> {
  const clientId = Deno.env.get("ZOHO_CLIENT_ID");
  const clientSecret = Deno.env.get("ZOHO_CLIENT_SECRET");
  const refreshToken = Deno.env.get("ZOHO_REFRESH_TOKEN");

  console.log("Zoho credentials check:", {
    hasClientId: !!clientId,
    hasClientSecret: !!clientSecret,
    hasRefreshToken: !!refreshToken,
    refreshTokenPrefix: refreshToken?.substring(0, 10),
  });

  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Zoho API credentials");
  }

  const params = new URLSearchParams({
    refresh_token: refreshToken,
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "refresh_token",
  });

  console.log("Requesting access token from Zoho...");

  const response = await fetch(ZOHO_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  const responseText = await response.text();
  console.log("Zoho token response status:", response.status);
  console.log("Zoho token response:", responseText);

  if (!response.ok) {
    console.error("Zoho token error:", responseText);
    throw new Error(`Failed to get Zoho access token: ${response.status}`);
  }

  const data = JSON.parse(responseText);

  if (data.error) {
    console.error("Zoho token error in response:", data);
    throw new Error(`Zoho token error: ${data.error}`);
  }

  if (!data.access_token) {
    console.error("Zoho token missing access_token:", data);
    throw new Error("Zoho token response missing access_token");
  }

  console.log("Access token obtained successfully");
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

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

function generateOrderItemsHtml(items: OrderItem[]): string {
  return items.map(item => `
    <tr>
      <td style="padding: 15px; border-bottom: 1px solid #eeeeee;">
        <div style="display: flex; align-items: center;">
          ${item.product_image ? `<img src="${item.product_image}" alt="${item.product_name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px; margin-right: 15px;">` : ''}
          <span style="color: #333333;">${item.product_name}</span>
        </div>
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eeeeee; text-align: center; color: #666666;">
        ${item.quantity}
      </td>
      <td style="padding: 15px; border-bottom: 1px solid #eeeeee; text-align: right; color: #333333;">
        ${formatCurrency(item.product_price * item.quantity)}
      </td>
    </tr>
  `).join('');
}

function generateTempCredentialsHtml(order: OrderEmailRequest): string {
  if (!order.isNewAccount || !order.tempPassword) return '';

  return `
    <div style="background-color: #f0f7f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
      <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 10px;">Your Account Has Been Created</h3>
      <p style="color: #666666; line-height: 1.6; margin-bottom: 15px;">
        You can now sign in using the temporary login details below:
      </p>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #333333; font-weight: bold; width: 180px;">Username:</td>
          <td style="padding: 8px 0; color: #333333;">${order.customerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #333333; font-weight: bold;">Temporary Password:</td>
          <td style="padding: 8px 0; color: #333333; font-family: monospace; font-size: 14px; background-color: #ffffff; padding: 8px; border-radius: 4px;">${order.tempPassword}</td>
        </tr>
      </table>
      <p style="color: #999999; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
        For security reasons, we recommend changing your password after logging in.
      </p>
    </div>
    <p style="color: #666666; line-height: 1.6;">
      Thank you for shopping with House of Abhilasha. We're glad to have you with us.
    </p>
  `;
}

function generateCustomerEmailHtml(order: OrderEmailRequest): string {
  return `
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
          <h2 style="color: #333333; margin-top: 0;">Order Confirmation</h2>
          <p style="color: #666666; line-height: 1.6;">
            Dear ${order.customerName},<br><br>
            Thank you for your order! We're excited to confirm that we've received your order and it's being processed.
          </p>
          
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333333;"><strong>Order ID:</strong> ${order.orderId}</p>
            <p style="margin: 10px 0 0; color: #333333;"><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          </div>

          <h3 style="color: #333333; border-bottom: 2px solid #8B4513; padding-bottom: 10px;">Order Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 15px; text-align: left; color: #333333;">Item</th>
                <th style="padding: 15px; text-align: center; color: #333333;">Qty</th>
                <th style="padding: 15px; text-align: right; color: #333333;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderItemsHtml(order.items)}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #333333;">Total:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; color: #8B4513; font-size: 18px;">
                  ${formatCurrency(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          <h3 style="color: #333333; border-bottom: 2px solid #8B4513; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h3>
          <p style="color: #666666; line-height: 1.6;">
            ${order.shippingAddress}<br>
            Phone: ${order.contactNo}
          </p>

          ${generateTempCredentialsHtml(order)}

          <p style="color: #666666; line-height: 1.6; margin-top: 30px;">
            We'll notify you when your order ships. If you have any questions, please don't hesitate to contact us.
          </p>
        </div>
        <div style="background-color: #f8f8f8; padding: 20px; text-align: center; border-top: 1px solid #eeeeee;">
          <p style="color: #999999; font-size: 12px; margin: 0;">
            &copy; ${new Date().getFullYear()} House of Abhilasha. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function generateAdminEmailHtml(order: OrderEmailRequest): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
        <div style="background-color: #2c3e50; padding: 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px;">New Order Received!</h1>
        </div>
        <div style="padding: 40px 30px;">
          <div style="background-color: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #4caf50;">
            <h2 style="color: #2e7d32; margin: 0;">Order #${order.orderId.slice(0, 8)}</h2>
            <p style="color: #388e3c; margin: 5px 0 0;">Total: ${formatCurrency(order.totalAmount)}</p>
            ${order.isGuestCheckout ? '<p style="color: #1565c0; margin: 5px 0 0; font-size: 13px;">Guest Checkout Order</p>' : ''}
          </div>

          <h3 style="color: #333333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">Customer Details</h3>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${order.customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${order.customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${order.contactNo}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Payment:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${order.paymentMethod}</td>
            </tr>
          </table>

          <h3 style="color: #333333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">Shipping Address</h3>
          <p style="color: #666666; line-height: 1.6; background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
            ${order.shippingAddress}
          </p>

          <h3 style="color: #333333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">Order Items</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="background-color: #f8f8f8;">
                <th style="padding: 15px; text-align: left; color: #333333;">Item</th>
                <th style="padding: 15px; text-align: center; color: #333333;">Qty</th>
                <th style="padding: 15px; text-align: right; color: #333333;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${generateOrderItemsHtml(order.items)}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #333333;">Total:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; color: #2c3e50; font-size: 18px;">
                  ${formatCurrency(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        <div style="background-color: #2c3e50; padding: 20px; text-align: center;">
          <p style="color: #ffffff; font-size: 12px; margin: 0;">
            House of Abhilasha Admin Notification
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const order: OrderEmailRequest = await req.json();

    if (!order.orderId || !order.customerEmail || !order.items) {
      throw new Error("Missing required order fields");
    }

    const isServiceRole = token === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!isServiceRole && !order.isGuestCheckout) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      
      if (claimsError || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      const userId = claimsData.claims.sub;

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("user_id")
        .eq("id", order.orderId)
        .single();

      if (orderError || !orderData) {
        return new Response(
          JSON.stringify({ error: "Order not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (orderData.user_id !== userId) {
        return new Response(
          JSON.stringify({ error: "Forbidden: You do not own this order" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    console.log(`Sending order emails for order: ${order.orderId}`);

    const accessToken = await getZohoAccessToken();
    const accountId = await getZohoAccountId(accessToken, "support@houseofabhilasha.in");

    await sendEmail(
      accessToken,
      accountId,
      "support@houseofabhilasha.in",
      order.customerEmail,
      `Order Confirmation - ${order.orderId.slice(0, 8)} - House of Abhilasha`,
      generateCustomerEmailHtml(order)
    );
    console.log(`Customer confirmation email sent to: ${order.customerEmail}`);

    await sendEmail(
      accessToken,
      accountId,
      "support@houseofabhilasha.in",
      "support@houseofabhilasha.in",
      `New Order #${order.orderId.slice(0, 8)} - ${formatCurrency(order.totalAmount)}`,
      generateAdminEmailHtml(order)
    );
    console.log(`Admin notification email sent to: support@houseofabhilasha.in`);

    return new Response(
      JSON.stringify({ success: true, message: "Order emails sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-order-emails function:", error);
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
