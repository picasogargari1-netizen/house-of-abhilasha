import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const RefundPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background" data-testid="page-refund-policy">
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

        <h1 className="text-3xl font-serif font-bold mb-2" data-testid="text-refund-title">Return & Refund Policy</h1>
        <p className="text-muted-foreground text-sm mb-8">House of Abhilasha</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/80">
          <p>
            At House of Abhilasha, most of our products are handmade and some are customized especially for you.
          </p>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">1. Customized Products</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Customized or made-to-order products cannot be returned or exchanged.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">2. Returns for Defective Products</h2>
            <p className="mb-3">Returns are accepted only in case of defective or damaged products.</p>
            <p className="mb-3">To claim a return:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>You must notify us within 24 hours of receiving the product.</li>
              <li>An unboxing/package opening video is mandatory to process any claim.</li>
              <li>The video must clearly show the sealed package being opened and the defect visible.</li>
            </ul>
            <p className="mt-3 font-medium text-foreground">Without the unboxing video, claims will not be considered.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">3. Condition for Return</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>The product must be unused and in its original packaging.</li>
              <li>Once verified, we will offer a replacement (subject to availability) or store credit/refund at our discretion.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground mb-3">4. Non-Returnable Situations</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Slight variations in color due to lighting or screen settings</li>
              <li>Minor irregularities inherent in handmade or hand-embroidered products</li>
            </ul>
          </section>

          <section className="border-t pt-6">
            <p className="text-muted-foreground">
              For return requests, please contact:{" "}
              <a
                href="tel:+918584049992"
                className="text-primary hover:underline"
                data-testid="link-refund-phone"
              >
                858-404-9992
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default RefundPolicyPage;
