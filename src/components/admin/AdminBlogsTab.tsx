import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, ImageIcon, X } from "lucide-react";

interface Blog {
  id: string;
  title: string;
  body: string;
  image_url1: string | null;
  image_url2: string | null;
  image_url3: string | null;
  image_url4: string | null;
  image_url5: string | null;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

const useBlogs = () => {
  return useQuery({
    queryKey: ["adminBlogs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blogs")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Blog[];
    },
  });
};

const uploadBlogImage = async (file: File): Promise<string> => {
  const fileName = `${Date.now()}-${file.name}`;
  const { error } = await supabase.storage.from("blog-images").upload(fileName, file);
  if (error) throw error;
  const { data } = supabase.storage.from("blog-images").getPublicUrl(fileName);
  return data.publicUrl;
};

const AdminBlogsTab = () => {
  const { data: blogs, isLoading } = useBlogs();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [saving, setSaving] = useState(false);

  // Add form state
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newImages, setNewImages] = useState<(File | null)[]>([null, null, null, null, null]);
  const [newPreviews, setNewPreviews] = useState<(string | null)[]>([null, null, null, null, null]);

  // Edit form state
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [editImages, setEditImages] = useState<(File | null)[]>([null, null, null, null, null]);
  const [editPreviews, setEditPreviews] = useState<(string | null)[]>([null, null, null, null, null]);
  const [editExistingUrls, setEditExistingUrls] = useState<(string | null)[]>([null, null, null, null, null]);

  const handleImageSelect = (index: number, file: File | null, isEdit: boolean) => {
    if (isEdit) {
      const files = [...editImages];
      const previews = [...editPreviews];
      const existing = [...editExistingUrls];
      files[index] = file;
      previews[index] = file ? URL.createObjectURL(file) : null;
      if (file) existing[index] = null;
      setEditImages(files);
      setEditPreviews(previews);
      setEditExistingUrls(existing);
    } else {
      const files = [...newImages];
      const previews = [...newPreviews];
      files[index] = file;
      previews[index] = file ? URL.createObjectURL(file) : null;
      setNewImages(files);
      setNewPreviews(previews);
    }
  };

  const removeImage = (index: number, isEdit: boolean) => {
    if (isEdit) {
      const files = [...editImages];
      const previews = [...editPreviews];
      const existing = [...editExistingUrls];
      files[index] = null;
      previews[index] = null;
      existing[index] = null;
      setEditImages(files);
      setEditPreviews(previews);
      setEditExistingUrls(existing);
    } else {
      const files = [...newImages];
      const previews = [...newPreviews];
      files[index] = null;
      previews[index] = null;
      setNewImages(files);
      setNewPreviews(previews);
    }
  };

  const handleAdd = async () => {
    if (!newTitle.trim() || !newBody.trim()) {
      toast({ title: "Error", description: "Title and body are required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const urls: (string | null)[] = [null, null, null, null, null];
      for (let i = 0; i < 5; i++) {
        if (newImages[i]) urls[i] = await uploadBlogImage(newImages[i]!);
      }
      const { error } = await supabase.from("blogs").insert({
        title: newTitle.trim(),
        body: newBody.trim(),
        image_url1: urls[0],
        image_url2: urls[1],
        image_url3: urls[2],
        image_url4: urls[3],
        image_url5: urls[4],
        is_published: true,
      });
      if (error) throw error;
      toast({ title: "Blog Added", description: "Blog post created successfully" });
      queryClient.invalidateQueries({ queryKey: ["adminBlogs"] });
      queryClient.invalidateQueries({ queryKey: ["publicBlogs"] });
      setIsAddOpen(false);
      setNewTitle("");
      setNewBody("");
      setNewImages([null, null, null, null, null]);
      setNewPreviews([null, null, null, null, null]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleEditOpen = (blog: Blog) => {
    setEditingBlog(blog);
    setEditTitle(blog.title);
    setEditBody(blog.body);
    setEditImages([null, null, null, null, null]);
    setEditPreviews([null, null, null, null, null]);
    setEditExistingUrls([
      blog.image_url1, blog.image_url2, blog.image_url3, blog.image_url4, blog.image_url5,
    ]);
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingBlog || !editTitle.trim() || !editBody.trim()) return;
    setSaving(true);
    try {
      const urls: (string | null)[] = [...editExistingUrls];
      for (let i = 0; i < 5; i++) {
        if (editImages[i]) urls[i] = await uploadBlogImage(editImages[i]!);
      }
      const { error } = await supabase.from("blogs").update({
        title: editTitle.trim(),
        body: editBody.trim(),
        image_url1: urls[0],
        image_url2: urls[1],
        image_url3: urls[2],
        image_url4: urls[3],
        image_url5: urls[4],
      }).eq("id", editingBlog.id);
      if (error) throw error;
      toast({ title: "Blog Updated", description: "Blog post updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["adminBlogs"] });
      queryClient.invalidateQueries({ queryKey: ["publicBlogs"] });
      setIsEditOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("blogs").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBlogs"] });
      queryClient.invalidateQueries({ queryKey: ["publicBlogs"] });
    },
  });

  const deleteBlog = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blogs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBlogs"] });
      queryClient.invalidateQueries({ queryKey: ["publicBlogs"] });
      toast({ title: "Deleted", description: "Blog post removed" });
    },
  });

  const ImageUploadGrid = ({ images, previews, existingUrls, isEdit }: {
    images: (File | null)[];
    previews: (string | null)[];
    existingUrls?: (string | null)[];
    isEdit: boolean;
  }) => (
    <div className="grid grid-cols-5 gap-2">
      {[0, 1, 2, 3, 4].map((i) => {
        const preview = previews[i];
        const existing = existingUrls?.[i];
        const displayUrl = preview || existing;
        return (
          <div key={i} className="relative">
            {displayUrl ? (
              <div className="relative aspect-square rounded-md overflow-hidden border">
                <img src={displayUrl} alt={`Image ${i + 1}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i, isEdit)}
                  className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                <ImageIcon className="h-5 w-5 text-muted-foreground mb-1" />
                <span className="text-[10px] text-muted-foreground">Image {i + 1}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect(i, e.target.files?.[0] || null, isEdit)}
                />
              </label>
            )}
          </div>
        );
      })}
    </div>
  );

  if (isLoading) {
    return <Card><CardContent className="p-6"><p className="text-center text-muted-foreground">Loading blogs...</p></CardContent></Card>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Blog</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Blog Post</DialogTitle>
              <DialogDescription>Create a new blog post with images.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Heading *</Label>
                <Input value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="Blog title" />
              </div>
              <div className="space-y-2">
                <Label>Body *</Label>
                <Textarea value={newBody} onChange={(e) => setNewBody(e.target.value)} placeholder="Write your blog content..." rows={8} />
              </div>
              <div className="space-y-2">
                <Label>Images (up to 5)</Label>
                <ImageUploadGrid images={newImages} previews={newPreviews} isEdit={false} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={saving}>
                {saving ? "Saving..." : "Add Blog"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Blog Post</DialogTitle>
            <DialogDescription>Update blog post content and images.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Heading *</Label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Blog title" />
            </div>
            <div className="space-y-2">
              <Label>Body *</Label>
              <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} placeholder="Write your blog content..." rows={8} />
            </div>
            <div className="space-y-2">
              <Label>Images (up to 5)</Label>
              <ImageUploadGrid images={editImages} previews={editPreviews} existingUrls={editExistingUrls} isEdit={true} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Blog Posts ({blogs?.length || 0})</CardTitle>
          <CardDescription>Manage your blog posts.</CardDescription>
        </CardHeader>
        <CardContent>
          {!blogs?.length ? (
            <p className="text-center text-muted-foreground py-8">No blog posts yet. Add your first blog.</p>
          ) : (
            <div className="grid gap-4">
              {blogs.map((blog) => {
                const imageCount = [blog.image_url1, blog.image_url2, blog.image_url3, blog.image_url4, blog.image_url5].filter(Boolean).length;
                return (
                  <div key={blog.id} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{blog.title}</p>
                      <p className="text-sm text-muted-foreground truncate">{blog.body.substring(0, 100)}...</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {imageCount} image{imageCount !== 1 ? "s" : ""} · {new Date(blog.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={blog.is_published}
                          onCheckedChange={(checked) => togglePublished.mutate({ id: blog.id, is_published: checked })}
                        />
                        <Badge variant={blog.is_published ? "default" : "secondary"}>
                          {blog.is_published ? "Published" : "Draft"}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleEditOpen(blog)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => { if (confirm("Delete this blog post?")) deleteBlog.mutate(blog.id); }}
                        disabled={deleteBlog.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminBlogsTab;
