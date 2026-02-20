import { Link } from "react-router-dom";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface FooterProps {
  onNavigate: (section: string) => void;
}

const Footer = ({ onNavigate }: FooterProps) => {
  const { data: categories } = useQuery({
    queryKey: ["footerCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("name, slug")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
  return (
    <footer className="bg-foreground text-background">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-8 items-start">
          {/* Brand */}
          <div className="lg:col-span-1">
            <h3 className="text-2xl font-serif font-bold mb-4 brand-name">
              House of Abhilasha
            </h3>
            <p className="text-background/70 mb-6 text-sm leading-relaxed">
              A handcrafted fashion boutique specialising in hand-embroidered clothing and artisanal accessories. Slow fashion, crafted with heart.
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.instagram.com/house_of_abhilasha?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-background/10 rounded-full hover:bg-background/20 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="https://www.facebook.com/profile.php?id=61555064627298"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 bg-background/10 rounded-full hover:bg-background/20 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-sm uppercase tracking-wider font-semibold mb-6">Categories</h4>
            <ul className="space-y-3">
              {(categories || []).map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/category/${cat.slug}`}
                    className="text-background/70 hover:text-background transition-colors text-sm"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-sm uppercase tracking-wider font-semibold mb-6">Company</h4>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => onNavigate("home")}
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("about")}
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  About Us
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate("contact")}
                  className="text-background/70 hover:text-background transition-colors text-sm"
                >
                  Contact
                </button>
              </li>
              <li>
                <Link to="/blogs" className="text-background/70 hover:text-background transition-colors text-sm">
                  Blogs
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm uppercase tracking-wider font-semibold mb-6">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-background/70 flex-shrink-0 mt-0.5" />
                <span className="text-background/70 text-sm">
                  8-C Ramanath Majumder Street,<br />
                  Kolkata - 700009
                </span>
              </li>
              <li>
                <a href="tel:+918584049992" className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm">
                  <Phone className="h-5 w-5 flex-shrink-0" />
                  +91 8584049992
                </a>
              </li>
              <li>
                <a href="mailto:support@houseofabhilasha.in" className="flex items-center gap-3 text-background/70 hover:text-background transition-colors text-sm !lowercase">
                  <Mail className="h-5 w-5 flex-shrink-0" />
                  <span className="!lowercase">support@houseofabhilasha.in</span>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-background/10">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-xs sm:text-sm text-background/60">
            <p className="brand-name text-center md:text-left">© {new Date().getFullYear()} House of Abhilasha. All rights reserved.</p>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <Link to="/privacy-policy" className="hover:text-background transition-colors" data-testid="link-privacy-policy">Privacy Policy</Link>
              <Link to="/terms-of-service" className="hover:text-background transition-colors" data-testid="link-terms-of-service">Terms of Service</Link>
              <Link to="/return-refund-policy" className="hover:text-background transition-colors" data-testid="link-refund-policy">Return & Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
