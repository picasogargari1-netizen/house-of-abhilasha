import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import PromoBanner from "@/components/PromoBanner";
import FeaturedProducts from "@/components/FeaturedProducts";
import BestSellers from "@/components/BestSellers";
import MostLovedCategories from "@/components/MostLovedCategories";
import ProductOfTheDay from "@/components/ProductOfTheDay";
import NewsletterSection from "@/components/NewsletterSection";
import BrandStory from "@/components/BrandStory";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useIsAdmin } from "@/hooks/useAdmin";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { user } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  useEffect(() => {
    if (user && isAdmin) {
      window.location.href = "/admin";
    }
  }, [user, isAdmin]);
  const navigate = useNavigate();
  const homeRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const aboutRef = useRef<HTMLDivElement>(null);
  const contactRef = useRef<HTMLDivElement>(null);

  const handleNavigate = (section: string) => {
    if (section === "home") {
      homeRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (section === "products") {
      productsRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (section === "jewellery") {
      navigate("/jewellery");
    } else if (section === "about") {
      aboutRef.current?.scrollIntoView({ behavior: "smooth" });
    } else if (section === "contact") {
      contactRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <Header onNavigate={handleNavigate} />
      
      <div ref={homeRef}>
        <Hero />
      </div>
      
      {/* Shop by Categories */}
      <CategoryGrid />

      {/* Promo Code Banner */}
      <PromoBanner />
      
      {/* New Arrivals */}
      <div ref={productsRef} id="products">
        <FeaturedProducts />
      </div>

      {/* Best Sellers */}
      <div id="best-sellers">
        <BestSellers />
      </div>

      {/* Most Loved Categories */}
      <MostLovedCategories />

      {/* Product of the Day */}
      <div id="product-of-the-day">
        <ProductOfTheDay />
      </div>

      {/* Newsletter */}
      <NewsletterSection />
      
      <div ref={aboutRef} id="about">
        <BrandStory />
      </div>
      
      <div ref={contactRef} id="contact">
        <ContactSection />
      </div>
      
      <Footer onNavigate={handleNavigate} />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
