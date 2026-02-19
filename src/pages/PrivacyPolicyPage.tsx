import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" data-testid="page-privacy-policy">
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6"
          data-testid="button-back"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-privacy-title">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">House of Abhilasha</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <p>
            At House of Abhilasha, we value your privacy and are committed to protecting your personal information. This Privacy Policy explains how we collect, use, and safeguard your information when you visit our website or make a purchase from us.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h2>
            <p className="mb-3">We may collect the following information:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Personal details (name, phone number, email address, shipping/billing address)</li>
              <li>Payment information (processed securely via third-party payment gateways; we do not store card details)</li>
              <li>Order history and purchase details</li>
              <li>Communication details when you contact us via WhatsApp, email, or website forms</li>
              <li>Technical data such as IP address, browser type, and cookies for website analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
            <p className="mb-3">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process and fulfill your orders</li>
              <li>Communicate order updates and shipping details</li>
              <li>Respond to customer service inquiries</li>
              <li>Improve our products, services, and website experience</li>
              <li>Send promotional updates (only if you opt in)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Sharing of Information</h2>
            <p className="mb-3">We do not sell, rent, or trade your personal information.</p>
            <p className="mb-3">Your information may be shared with:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Payment gateway providers</li>
              <li>Shipping and logistics partners</li>
              <li>Legal authorities if required under applicable laws</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Data Security</h2>
            <p>
              We implement reasonable security measures to protect your personal data. However, no online transmission is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Cookies</h2>
            <p>
              Our website may use cookies to enhance user experience and analyze website traffic. You may disable cookies in your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">6. Your Rights</h2>
            <p className="mb-3">You may request to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access the personal data we hold about you</li>
              <li>Correct or update your information</li>
              <li>Request deletion of your data (subject to legal obligations)</li>
            </ul>
          </section>

          <section className="border-t pt-6">
            <p className="text-muted-foreground">
              For privacy-related concerns, please contact us at:{" "}
              <a
                href="mailto:support@houseofabhilasha.in"
                className="text-primary hover:underline"
                data-testid="link-privacy-email"
              >
                support@houseofabhilasha.in
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
