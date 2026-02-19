import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

const BlogsPage = () => {
  const navigate = useNavigate();

  const { data: blogs, isLoading } = useQuery({
    queryKey: ["publicBlogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const handleNavigate = (section: string) => {
    if (section === "home") navigate("/");
    else if (section === "about") navigate("/#about");
    else if (section === "contact") navigate("/#contact");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigate} />
      <main className="container mx-auto px-4 py-10 md:py-14">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground text-center mb-10">
          Our Blog
        </h1>

        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[16/10] w-full rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        )}

        {!isLoading && !blogs?.length && (
          <p className="text-center text-muted-foreground py-16">No blog posts yet. Check back soon!</p>
        )}

        {!isLoading && blogs && blogs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog: any) => {
              const firstImage = blog.image_url1 || blog.image_url2 || blog.image_url3 || blog.image_url4 || blog.image_url5;
              return (
                <Link
                  key={blog.id}
                  to={`/blog/${blog.id}`}
                  className="group border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  {firstImage ? (
                    <div className="aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={firstImage}
                        alt={blog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-muted flex items-center justify-center text-muted-foreground">
                      No Image
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {new Date(blog.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
                    </div>
                    <h2 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                      {blog.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {blog.body}
                    </p>
                    <span className="inline-block text-xs uppercase tracking-wider text-primary font-medium pt-1">
                      Read More →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default BlogsPage;
