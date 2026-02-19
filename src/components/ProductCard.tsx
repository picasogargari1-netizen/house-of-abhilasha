import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, MessageCircle, ShoppingCart } from "lucide-react";
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

const ProductCard = ({ product }: ProductCardProps) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const navigate = useNavigate();
  const { addToCart } = useCart();

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

  return (
    <>
      <div 
        className="group bg-card rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleProductClick}
      >
        {/* Image Container */}
        <div className="relative aspect-[3/4] overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-colors hidden sm:flex items-center justify-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity gap-2"
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
                  <p className="text-base sm:text-lg font-bold text-primary">₹{product.discountedPrice}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground line-through">₹{product.price}</p>
                </>
              ) : (
                <p className="text-base sm:text-lg font-bold text-primary">₹{product.price}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddToCart}
              className="gap-1 text-xs sm:text-sm px-2 sm:px-3"
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
              src={product.image}
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
                    <p className="text-2xl font-bold text-primary">₹{product.discountedPrice}</p>
                    <p className="text-lg text-muted-foreground line-through">₹{product.price}</p>
                  </div>
                ) : (
                  <p className="text-2xl font-bold text-primary">₹{product.price}</p>
                )}
              </div>
              <div className="space-y-2 mt-auto">
                <Button onClick={handleAddToCart} className="w-full gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  Add to Cart
                </Button>
                <Button variant="outline" onClick={handleWhatsAppOrder} className="w-full gap-2">
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
