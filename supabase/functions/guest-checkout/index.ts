import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface OrderItem {
  product_id: string;
  product_name: string;
  product_image?: string;
  product_price: number;
  quantity: number;
}

interface GuestCheckoutRequest {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  contactNo: string;
  notes?: string;
  paymentMethod: string;
  totalAmount: number;
  items: OrderItem[];
}

const ZOHO_TOKEN_URL = "https://accounts.zoho.in/oauth/v2/token";
const ZOHO_MAIL_API = "https://mail.zoho.in/api/accounts";
const FROM_EMAIL = "support@houseofabhilasha.in";

function generateTempPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password + "!1";
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
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: params.toString(),
  });

  const responseText = await response.text();
  if (!response.ok) {
    console.error("Zoho token error:", responseText);
    throw new Error(`Failed to get Zoho access token: ${response.status}`);
  }

  const data = JSON.parse(responseText);
  if (data.error) {
    throw new Error(`Zoho token error: ${data.error}`);
  }
  if (!data.access_token) {
    throw new Error("Zoho token response missing access_token");
  }

  return data.access_token;
}

async function getZohoAccountId(accessToken: string): Promise<string> {
  const response = await fetch(ZOHO_MAIL_API, {
    headers: { Authorization: `Zoho-oauthtoken ${accessToken}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Zoho account error:", errorText);
    throw new Error(`Failed to get Zoho account: ${response.status}`);
  }

  const data = await response.json();
  const account = data.data?.find((acc: any) =>
    acc.emailAddress === FROM_EMAIL || acc.emailAddress?.includes("houseofabhilasha.in")
  ) || data.data?.[0];

  if (!account) throw new Error("No Zoho mail account found");
  return account.accountId;
}

async function sendEmail(
  accessToken: string,
  accountId: string,
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
      fromAddress: FROM_EMAIL,
      toAddress: to,
      subject,
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
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
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

function generateCustomerEmailHtml(
  orderId: string,
  customerName: string,
  customerEmail: string,
  shippingAddress: string,
  contactNo: string,
  totalAmount: number,
  paymentMethod: string,
  items: OrderItem[],
  isNewAccount: boolean,
  tempPassword: string | null
): string {
  const tempCredentials = isNewAccount && tempPassword ? `
    <div style="background-color: #f0f7f0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
      <h3 style="color: #2e7d32; margin-top: 0; margin-bottom: 10px;">Your Account Has Been Created</h3>
      <p style="color: #666666; line-height: 1.6; margin-bottom: 15px;">
        You can now sign in using the temporary login details below:
      </p>
      <table style="width: 100%; margin-bottom: 15px;">
        <tr>
          <td style="padding: 8px 0; color: #333333; font-weight: bold; width: 180px;">Username:</td>
          <td style="padding: 8px 0; color: #333333;">${customerEmail}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #333333; font-weight: bold;">Temporary Password:</td>
          <td style="padding: 8px 0; color: #333333; font-family: monospace; font-size: 14px; background-color: #ffffff; padding: 8px; border-radius: 4px;">${tempPassword}</td>
        </tr>
      </table>
      <p style="color: #999999; font-size: 13px; line-height: 1.5; margin-bottom: 0;">
        For security reasons, we recommend changing your password after logging in.
      </p>
    </div>
    <p style="color: #666666; line-height: 1.6;">
      Thank you for shopping with House of Abhilasha. We're glad to have you with us.
    </p>
  ` : '';

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
            Dear ${customerName},<br><br>
            Thank you for your order! We're excited to confirm that we've received your order and it's being processed.
          </p>
          
          <div style="background-color: #f8f8f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #333333;"><strong>Order ID:</strong> ${orderId}</p>
            <p style="margin: 10px 0 0; color: #333333;"><strong>Payment Method:</strong> ${paymentMethod}</p>
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
              ${generateOrderItemsHtml(items)}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #333333;">Total:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; color: #8B4513; font-size: 18px;">
                  ${formatCurrency(totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>

          <h3 style="color: #333333; border-bottom: 2px solid #8B4513; padding-bottom: 10px; margin-top: 30px;">Shipping Address</h3>
          <p style="color: #666666; line-height: 1.6;">
            ${shippingAddress}<br>
            Phone: ${contactNo}
          </p>

          ${tempCredentials}

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

function generateAdminEmailHtml(
  orderId: string,
  customerName: string,
  customerEmail: string,
  shippingAddress: string,
  contactNo: string,
  totalAmount: number,
  paymentMethod: string,
  items: OrderItem[]
): string {
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
            <h2 style="color: #2e7d32; margin: 0;">Order #${orderId.slice(0, 8)}</h2>
            <p style="color: #388e3c; margin: 5px 0 0;">Total: ${formatCurrency(totalAmount)}</p>
            <p style="color: #1565c0; margin: 5px 0 0; font-size: 13px;">Guest Checkout Order</p>
          </div>

          <h3 style="color: #333333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">Customer Details</h3>
          <table style="width: 100%; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Name:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${customerName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${customerEmail}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Phone:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${contactNo}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #666666;"><strong>Payment:</strong></td>
              <td style="padding: 8px 0; color: #333333;">${paymentMethod}</td>
            </tr>
          </table>

          <h3 style="color: #333333; border-bottom: 2px solid #2c3e50; padding-bottom: 10px;">Shipping Address</h3>
          <p style="color: #666666; line-height: 1.6; background-color: #f8f8f8; padding: 15px; border-radius: 4px;">
            ${shippingAddress}
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
              ${generateOrderItemsHtml(items)}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #333333;">Total:</td>
                <td style="padding: 15px; text-align: right; font-weight: bold; color: #2c3e50; font-size: 18px;">
                  ${formatCurrency(totalAmount)}
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
    const body: GuestCheckoutRequest = await req.json();

    const { firstName, lastName, email, address, contactNo, notes, paymentMethod, totalAmount, items } = body;

    if (!firstName || !lastName || !email || !address || !contactNo || !paymentMethod || totalAmount == null) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: firstName, lastName, email, address, contactNo, paymentMethod, totalAmount" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    if (!items || !items.length) {
      return new Response(
        JSON.stringify({ error: "Cart is empty" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    let userId: string;
    let isNewAccount = false;
    let actualTempPassword: string | null = null;

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u: any) => u.email === email.toLowerCase()
    );

    if (existingUser) {
      userId = existingUser.id;
      isNewAccount = false;
    } else {
      actualTempPassword = generateTempPassword();
      const { data: newUser, error: signUpError } = await supabase.auth.admin.createUser({
        email: email.toLowerCase(),
        password: actualTempPassword,
        email_confirm: true,
        user_metadata: {
          first_name: firstName,
          last_name: lastName,
        },
      });

      if (signUpError || !newUser?.user) {
        console.error("Failed to create user:", signUpError);
        return new Response(
          JSON.stringify({ error: "Failed to create account. Please try again." }),
          { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      userId = newUser.user.id;
      isNewAccount = true;
    }

    await supabase.from("profiles").upsert({
      user_id: userId,
      first_name: firstName,
      last_name: lastName,
      email: email.toLowerCase(),
      address: address,
      contact_no: contactNo,
    });

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: userId,
        status: "pending",
        payment_method: paymentMethod,
        total_amount: totalAmount,
        shipping_address: address,
        contact_no: contactNo,
        notes: notes || null,
      })
      .select()
      .single();

    if (orderError || !order) {
      console.error("Order creation error:", orderError);
      return new Response(
        JSON.stringify({ error: "Failed to create order" }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const orderItems = items.map((item: OrderItem) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image,
      product_price: item.product_price,
      quantity: item.quantity,
    }));

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      console.error("Order items error:", itemsError);
    }

    const displayPaymentMethod = paymentMethod === "upi" ? "UPI" : "Place Order (Contact)";
    const customerName = `${firstName} ${lastName}`.trim();

    try {
      const accessToken = await getZohoAccessToken();
      const accountId = await getZohoAccountId(accessToken);

      await sendEmail(
        accessToken,
        accountId,
        email,
        `Order Confirmation - ${order.id.slice(0, 8)} - House of Abhilasha`,
        generateCustomerEmailHtml(
          order.id,
          customerName,
          email,
          address,
          contactNo,
          totalAmount,
          displayPaymentMethod,
          items,
          isNewAccount,
          actualTempPassword
        )
      );
      console.log(`Customer confirmation email sent to: ${email}`);

      await sendEmail(
        accessToken,
        accountId,
        FROM_EMAIL,
        `New Order #${order.id.slice(0, 8)} - ${formatCurrency(totalAmount)}`,
        generateAdminEmailHtml(
          order.id,
          customerName,
          email,
          address,
          contactNo,
          totalAmount,
          displayPaymentMethod,
          items
        )
      );
      console.log(`Admin notification email sent to: ${FROM_EMAIL}`);
    } catch (emailError) {
      console.error("Failed to send order emails:", emailError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        orderId: order.id,
        isNewAccount,
        tempPassword: isNewAccount ? actualTempPassword : undefined,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in guest-checkout function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred. Please try again." }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
