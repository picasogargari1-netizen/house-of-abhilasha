import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

const BlogDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: blog, isLoading } = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .eq("id", id!)
        .eq("is_published", true)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleNavigate = (section: string) => {
    if (section === "home") navigate("/");
    else if (section === "about") navigate("/#about");
    else if (section === "contact") navigate("/#contact");
  };

  const images = blog
    ? [blog.image_url1, blog.image_url2, blog.image_url3, blog.image_url4, blog.image_url5].filter(Boolean) as string[]
    : [];

  return (
    <div className="min-h-screen bg-background">
      <Header onNavigate={handleNavigate} />
      <main className="container mx-auto px-4 py-10 md:py-14 max-w-3xl">
        <Button variant="ghost" size="sm" onClick={() => navigate("/blogs")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Blogs
        </Button>

        {isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        )}

        {!isLoading && !blog && (
          <p className="text-center text-muted-foreground py-16">Blog post not found.</p>
        )}

        {!isLoading && blog && (
          <article className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground mb-3">
                {blog.title}
              </h1>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                {new Date(blog.created_at).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}
              </div>
            </div>

            <div className="prose prose-sm max-w-none text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {blog.body}
            </div>

            {images.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-sm uppercase tracking-wider text-muted-foreground font-medium">Gallery</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {images.map((url, i) => (
                    <div key={i} className="aspect-[4/3] overflow-hidden rounded-lg bg-muted">
                      <img src={url} alt={`${blog.title} - image ${i + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </article>
        )}
      </main>
      <Footer onNavigate={handleNavigate} />
    </div>
  );
};

export default BlogDetailPage;
