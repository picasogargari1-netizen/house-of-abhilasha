import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import newsletterBg from "@/assets/newsletter-bg.jpg";

const NewsletterSection = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      toast({ title: "Invalid email", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("newsletter_subscribers").insert({ email: trimmed });
      if (error) {
        if (error.code === "23505") {
          toast({ title: "Already subscribed", description: "This email is already on our list!" });
        } else {
          throw error;
        }
      } else {
        toast({ title: "Subscribed!", description: "Welcome to the House of Abhilasha family." });
        setEmail("");
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-16 md:py-24 overflow-hidden">
      <img src={newsletterBg} alt="Kolkata Yellow Taxi" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-foreground/60" />
      <div className="relative container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-background mb-4 brand-name">
          Join the House of Abhilasha Family
        </h2>
        <p className="text-sm text-background/80 max-w-lg mx-auto mb-8 leading-relaxed">
          Subscribe to our newsletter and get exclusive offers, new arrival updates, and a glimpse into the art of Bengal handloom.
        </p>
        <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={handleSubscribe}>
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-background/10 border-background/30 text-background placeholder:text-background/60 flex-1"
            required
          />
          <Button className="bg-background text-foreground hover:bg-background/90" disabled={isSubmitting}>
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSection;
