import aboutImage from "@/assets/about-image.jpg";

const BrandStory = () => {
  return (
    <section
      className="relative py-16 md:py-20 bg-cover bg-center bg-no-repeat min-h-[500px] md:min-h-[600px] flex items-center"
      style={{ backgroundImage: `url(${aboutImage})` }}
    >
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-lg">
          <div className="bg-background/85 rounded-lg p-6 md:p-10">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-medium mb-4">
              Our Story
            </p>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-foreground mb-6 leading-tight">
              Where Tradition Meets Contemporary Design
            </h2>
            <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
              <p>
                House of Abhilasha is a handcrafted fashion boutique specialising in hand-embroidered clothing and artisanal accessories. Rooted in slow fashion and thoughtful design, we bring together traditional craftsmanship and contemporary silhouettes.
              </p>
              <p>
                Based in Kolkata, we create designs meant to be worn every day, cherished over time, and connected to stories of craft, culture, and conscious living.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-6 mt-10 pt-8 border-t border-border">
              <div>
                <p className="text-xl md:text-2xl font-bold text-primary font-serif">500+</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Happy Customers</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-primary font-serif">100+</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Unique Products</p>
              </div>
              <div>
                <p className="text-xl md:text-2xl font-bold text-primary font-serif">50+</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Original Designs</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandStory;
