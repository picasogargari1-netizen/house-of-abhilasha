import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import contactBg from "@/assets/contact-bg.png";

const ContactSection = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    contactNo: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data: fnData, error: fnError } = await supabase.functions.invoke("send-contact-email", {
        body: formData,
      });
      if (fnError) throw new Error(fnError.message || "Failed to send message");
      if (fnData?.error) throw new Error(fnData.error);
      toast({
        title: "Message Sent!",
        description: "We'll get back to you soon.",
      });
      setFormData({ name: "", email: "", contactNo: "", message: "" });
    } catch (err: any) {
      console.error("Contact form error:", err);
      toast({
        title: "Failed to send",
        description: "Please try again or email us directly at support@houseofabhilasha.in",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section
      id="contact"
      className="py-10 sm:py-16 relative bg-contain bg-center bg-no-repeat min-h-[380px] sm:min-h-[500px] flex items-end"
      style={{ backgroundImage: `url(${contactBg})` }}
    >
      <div className="container mx-auto px-3 sm:px-6 relative z-10 pb-4">
        <div className="max-w-[300px] sm:max-w-sm">
          <div className="bg-background/85 rounded-lg p-5 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-foreground mb-2">
              Get In Touch
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground mb-4">
              Have questions? We'd love to hear from you!
            </p>
            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                placeholder="Your Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Input
                type="email"
                placeholder="Your Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
              <Input
                type="tel"
                placeholder="Your Contact No"
                value={formData.contactNo}
                onChange={(e) =>
                  setFormData({ ...formData, contactNo: e.target.value })
                }
                required
              />
              <Textarea
                placeholder="Your Message"
                rows={3}
                value={formData.message}
                onChange={(e) =>
                  setFormData({ ...formData, message: e.target.value })
                }
                required
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Sending..." : "Send Message"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
