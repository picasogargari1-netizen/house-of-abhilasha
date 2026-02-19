import { MapPin, Clock, Phone, CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PromoBanner = () => {
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    visitType: "",
    phone: "",
    email: "",
    dateTime: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.visitType || !form.phone || !form.dateTime) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke("send-visit-request", {
        body: { ...form, email: form.email.trim().toLowerCase() },
      });
      if (error) throw error;
      toast({ title: "Visit scheduled!", description: "We'll confirm your visit shortly." });
      setForm({ name: "", visitType: "", phone: "", email: "", dateTime: "" });
      setShowForm(false);
    } catch {
      toast({ title: "Failed to send", description: "Please try again or call us directly.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-10 md:py-14 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-2">
            Visit Our Store
          </h2>
          <p className="text-sm text-muted-foreground">
            Come experience our collection in person
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 items-stretch max-w-5xl mx-auto">
          {/* Map */}
          <div className="rounded-lg overflow-hidden border border-border h-[300px] md:h-[350px]">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3683.9!2d88.3553!3d22.5744!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3a02779f4d8b7c6d%3A0x2b5a5e5e5e5e5e5e!2s8-C%20Ramanath%20Majumder%20Street%2C%20Kolkata%20700009!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="House Of Abhilasha Store Location"
            />
          </div>

          {/* Store Info */}
          <div className="flex flex-col justify-center space-y-5 p-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Address</h3>
                <p className="text-sm text-muted-foreground">
                  8-C Ramanath Majumder Street, Kolkata - 700009 (Near College Square)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Store Hours</h3>
                <p className="text-sm text-muted-foreground">
                  Mon - Sat: 11:00 Am - 8:00 Pm
                </p>
                <p className="text-sm text-muted-foreground">
                  Sun: 12:00 Pm - 6:00 Pm
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-primary/10 rounded-lg shrink-0">
                <Phone className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground text-sm">Phone</h3>
                <p className="text-sm text-muted-foreground">+91 85840 49992</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
              <a
                href="https://maps.google.com/maps?q=8-C+Ramanath+Majumder+Street+Kolkata+700009"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 sm:px-6 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-fit"
              >
                <MapPin className="h-4 w-4" />
                Get Directions
              </a>
              <button
                onClick={() => setShowForm(!showForm)}
                className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-5 sm:px-6 py-2 sm:py-2.5 rounded-md text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors w-full sm:w-fit"
              >
                <CalendarDays className="h-4 w-4" />
                Schedule a Visit
              </button>
            </div>

            {/* Schedule Visit Form */}
            {showForm && (
              <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-border">
                <Input
                  placeholder="Your Name *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <Select value={form.visitType} onValueChange={(v) => setForm({ ...form, visitType: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type of Visit *" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Offline">Offline</SelectItem>
                    <SelectItem value="Online">Online</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="tel"
                  placeholder="Phone No *"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email (optional)"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
                <Input
                  type="datetime-local"
                  value={form.dateTime}
                  onChange={(e) => setForm({ ...form, dateTime: e.target.value })}
                  required
                />
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Sending..." : "Send"}
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PromoBanner;
