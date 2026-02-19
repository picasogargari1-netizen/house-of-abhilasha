import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Menu, X, ChevronDown, User, LogOut, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import AnnouncementBar from "./AnnouncementBar";

interface HeaderProps {
  onNavigate: (section: string) => void;
}

const Header = ({ onNavigate }: HeaderProps) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { totalItems } = useCart();

  const { data: dynamicCategories } = useQuery({
    queryKey: ["navCategories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_categories")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []).map((cat: any) => ({ name: cat.name, slug: cat.slug }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const clothingCategories = dynamicCategories || [];

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <AnnouncementBar />

      {/* Main Navigation - Desktop */}
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4">
          <div className="hidden md:flex items-center justify-between h-16">
            {/* Logo - Left */}
            <h1
              className="text-2xl font-serif font-bold text-foreground cursor-pointer whitespace-nowrap brand-name"
              onClick={() => onNavigate("home")}
            >
              House of Abhilasha
            </h1>

            {/* Center Nav */}
            <nav className="flex items-center gap-8">
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-primary transition-colors text-xs uppercase tracking-[0.12em] font-medium">
                  Shop
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/all-products")} className="cursor-pointer">
                    All Products
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {clothingCategories.map((cat) => (
                    <DropdownMenuItem key={cat.slug} onClick={() => navigate(`/category/${cat.slug}`)} className="cursor-pointer">
                      {cat.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-primary transition-colors text-xs uppercase tracking-[0.12em] font-medium">
                  Collection
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={() => navigate("/all-products")} className="cursor-pointer">
                    All Products
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => { navigate("/"); setTimeout(() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="cursor-pointer">
                    New Arrivals
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate("/"); setTimeout(() => document.getElementById("best-sellers")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="cursor-pointer">
                    Shop Best Sellers
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => { navigate("/"); setTimeout(() => document.getElementById("product-of-the-day")?.scrollIntoView({ behavior: "smooth" }), 100); }} className="cursor-pointer">
                    Product of the Day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger className="flex items-center gap-1 text-foreground hover:text-primary transition-colors text-xs uppercase tracking-[0.12em] font-medium">
                  About Us
                  <ChevronDown className="h-3 w-3" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-48">
                  <DropdownMenuItem onClick={() => onNavigate("about")} className="cursor-pointer">
                    Our Story
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onNavigate("contact")} className="cursor-pointer">
                    Contact Us
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Link
                to="/blogs"
                className="text-foreground hover:text-primary transition-colors text-xs uppercase tracking-[0.12em] font-medium"
              >
                Blogs
              </Link>
            </nav>

            {/* Right - Utility Icons */}
            <div className="flex items-center gap-4">
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1.5 text-foreground hover:text-primary transition-colors">
                      <User className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-muted-foreground" disabled>
                      {user.email?.toLowerCase()}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile & Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <button
                  onClick={() => navigate("/auth")}
                  className="text-foreground hover:text-primary transition-colors text-xs uppercase tracking-[0.12em] font-medium"
                >
                  Sign In / Sign Up
                </button>
              )}
              <button
                onClick={() => navigate("/cart")}
                className="p-1.5 text-foreground hover:text-primary transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between h-14">
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1
              className="text-lg font-serif font-bold text-foreground cursor-pointer absolute left-1/2 -translate-x-1/2 brand-name"
              onClick={() => onNavigate("home")}
            >
              House of Abhilasha
            </h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigate("/cart")}
                className="p-2 text-foreground hover:text-primary transition-colors relative"
                aria-label="Cart"
              >
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-primary text-primary-foreground text-[9px] font-bold h-4 w-4 flex items-center justify-center rounded-full">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-background border-t border-border max-h-[70vh] overflow-y-auto">
          <div className="container mx-auto px-4 py-6">
            <nav className="flex flex-col gap-4">
              {user ? (
                <div className="flex flex-col gap-2 pb-4 border-b border-border">
                  <span className="text-sm text-muted-foreground truncate">{user.email?.toLowerCase()}</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => { navigate("/profile"); setIsMobileMenuOpen(false); }} className="flex-1">
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleSignOut}>
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              ) : (
                <Button variant="outline" onClick={() => { navigate("/auth"); setIsMobileMenuOpen(false); }} className="w-full mb-2">
                  Sign In
                </Button>
              )}

              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Shop</p>
                <Link to="/all-products" onClick={() => setIsMobileMenuOpen(false)} className="block text-foreground hover:text-primary transition-colors py-1 font-medium text-sm">
                  All Products
                </Link>
                {clothingCategories.map((cat) => (
                  <Link key={cat.slug} to={`/category/${cat.slug}`} onClick={() => setIsMobileMenuOpen(false)} className="block text-foreground hover:text-primary transition-colors py-1 text-sm">
                    {cat.name}
                  </Link>
                ))}
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <Link to="/all-products" onClick={() => setIsMobileMenuOpen(false)} className="block text-foreground hover:text-primary transition-colors text-sm font-medium">
                  Collection
                </Link>
                <Link to="/jewellery" onClick={() => setIsMobileMenuOpen(false)} className="block text-foreground hover:text-primary transition-colors text-sm font-medium">
                  Jewellery
                </Link>
                <button onClick={() => { onNavigate("about"); setIsMobileMenuOpen(false); }} className="block text-foreground hover:text-primary transition-colors w-full text-left text-sm">
                  About Us
                </button>
                <button onClick={() => { onNavigate("contact"); setIsMobileMenuOpen(false); }} className="block text-foreground hover:text-primary transition-colors w-full text-left text-sm">
                  Contact
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
