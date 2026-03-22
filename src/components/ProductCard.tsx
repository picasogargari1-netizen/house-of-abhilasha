import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, ShoppingCart } from "lucide-react";
import { proxyImageUrl } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/contexts/CartContext";

interface Product {
  id: number | string;
  name: string;
  description: string;
  price: number;
  discountedPrice?: number | null;
  category: string;
  image: string;
}

interface ProductCardProps {
  product: Product;
}

const isTouchDevice = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(hover: none)").matches;

const ProductCard = ({ product }: ProductCardProps) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [tilting, setTilting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { addToCart } = useCart();

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isTouchDevice() || !cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const cx = (e.clientX - rect.left) / rect.width - 0.5;
    const cy = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: cy * 10, y: cx * -10 });
    setTilting(true);
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
    setTilting(false);
  };

  const handleWhatsAppOrder = () => {
    const displayPrice = product.discountedPrice ?? product.price;
    const message = `Hi! I'm interested in ordering: ${product.name} (₹${displayPrice})`;
    window.open(
      `https://wa.me/918584049992?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart({
      id: String(product.id),
      name: product.name,
      image: product.image,
      price: product.discountedPrice ?? product.price,
    });
  };

  const handleProductClick = () => {
    navigate(`/product/${product.id}`);
  };

  const tiltStyle: React.CSSProperties = isTouchDevice()
    ? {}
    : {
        transform: `perspective(900px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilting ? 6 : 0}px)`,
        transition: tilting
          ? "transform 0.08s ease-out"
          : "transform 0.45s ease-out",
        boxShadow: tilting
          ? "0 20px 40px rgba(0,0,0,0.18), 0 8px 16px rgba(0,0,0,0.12)"
          : "0 2px 8px rgba(0,0,0,0.06)",
      };

  return (
    <>
      <div
        ref={cardRef}
        className="tilt-card group bg-card rounded-lg overflow-hidden cursor-pointer"
        style={tiltStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleProductClick}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={proxyImageUrl(product.image)}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {/* Subtle top-left 3D shine */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "linear-gradient(135deg, rgba(255,255,255,0.12) 0%, transparent 50%)",
            }}
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors hidden sm:flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity gap-2 btn-shimmer-outline"
              onClick={(e) => {
                e.stopPropagation();
                setIsQuickViewOpen(true);
              }}
            >
              <Eye className="h-4 w-4" />
              Quick View
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="p-2.5 sm:p-4">
          <Badge variant="secondary" className="mb-1.5 sm:mb-2 text-xs">
            {product.category}
          </Badge>
          <h3 className="font-semibold text-card-foreground mb-0.5 sm:mb-1 text-sm sm:text-base line-clamp-1">
            {product.name}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mb-1.5 sm:mb-2 line-clamp-1 hidden sm:block">
            {product.description}
          </p>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {product.discountedPrice ? (
                <>
                  <p className="text-base sm:text-lg font-bold text-primary">
                    ₹{product.discountedPrice}
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground line-through">
                    ₹{product.price}
                  </p>
                </>
              ) : (
                <p className="text-base sm:text-lg font-bold text-primary">
                  ₹{product.price}
                </p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              className="gap-1 text-xs sm:text-sm px-2 sm:px-3 btn-shimmer-outline"
            >
              <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Quick View Dialog */}
      <Dialog open={isQuickViewOpen} onOpenChange={setIsQuickViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{product.name}</DialogTitle>
          </DialogHeader>
          <div className="grid md:grid-cols-2 gap-6">
            <img
              src={proxyImageUrl(product.image)}
              alt={product.name}
              className="w-full aspect-square object-cover rounded-lg"
            />
            <div className="flex flex-col">
              <Badge variant="secondary" className="w-fit mb-4">
                {product.category}
              </Badge>
              <p className="text-muted-foreground mb-4">{product.description}</p>
              <div className="mb-6">
                {product.discountedPrice ? (
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-primary">
                      ₹{product.discountedPrice}
                    </p>
                    <p className="text-lg text-muted-foreground line-through">
                      ₹{product.price}
                    </p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-primary">
                    ₹{product.price}
                  </p>
                )}
              </div>
              <div className="space-y-2 mt-auto">
                <Button
                  onClick={handleAddToCart}
                  className="w-full gap-2 btn-gold-shimmer"
                >
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
                <Button
                  variant="outline"
                  onClick={handleWhatsAppOrder}
                  className="w-full gap-2 btn-shimmer-outline"
                >
                  <MessageCircle className="h-4 w-4" />
                  Order on WhatsApp
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProductCard;
