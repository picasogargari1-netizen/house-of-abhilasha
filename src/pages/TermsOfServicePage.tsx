import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfServicePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" data-testid="page-terms-of-service">
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

        <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-terms-title">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-8">House of Abhilasha</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <p>
            By accessing and using the website of House of Abhilasha, you agree to the following terms:
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Products & Pricing</h2>
            <p>
              All products listed are subject to availability. We reserve the right to modify prices, discontinue products, or update descriptions without prior notice.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Custom & Hand-Embroidered Products</h2>
            <p className="mb-3">Many of our products are handmade and crafted with care.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>For customized products or hand-embroidered items, please allow 5-10 business days for processing and shipping.</li>
              <li>Delivery timelines may vary depending on location and courier services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Orders & Payments</h2>
            <p>
              Orders will be processed only after full payment confirmation. We reserve the right to cancel orders in cases of suspected fraud or incorrect pricing.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Intellectual Property</h2>
            <p>
              All content on this website, including images, designs, embroidery patterns, logos, and text, belongs to House of Abhilasha and may not be copied, reproduced, or used without written permission.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">5. Limitation of Liability</h2>
            <p>
              House of Abhilasha shall not be liable for any indirect, incidental, or consequential damages arising from the use of our website or products.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfServicePage;
