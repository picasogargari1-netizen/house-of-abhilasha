import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Upload, Pencil, ImageIcon } from "lucide-react";

const useCategoryImagesWithSync = () => {
  return useQuery({
    queryKey: ["adminCategoryImages"],
    queryFn: async () => {
      const [catRes, imgRes] = await Promise.all([
        supabase.from("product_categories").select("*").order("display_order", { ascending: true }),
        supabase.from("category_images").select("*"),
      ]);

      if (catRes.error) throw catRes.error;
      const cats = catRes.data || [];
      const images = imgRes.data || [];

      const imageMap = new Map(images.map((img: any) => [img.category_slug, img]));

      const newEntries = cats.filter((cat: any) => !imageMap.has(cat.slug));
      if (newEntries.length > 0) {
        await supabase.from("category_images").insert(
          newEntries.map((cat: any) => ({
            category_name: cat.name,
            category_slug: cat.slug,
          }))
        );
        const { data: refreshed } = await supabase.from("category_images").select("*");
        const refreshedMap = new Map((refreshed || []).map((img: any) => [img.category_slug, img]));
        return cats.map((cat: any) => refreshedMap.get(cat.slug) || { id: cat.id, category_name: cat.name, category_slug: cat.slug, image_url: null });
      }

      return cats.map((cat: any) => imageMap.get(cat.slug) || { id: cat.id, category_name: cat.name, category_slug: cat.slug, image_url: null });
    },
  });
};

const AdminCategoryImagesTab = () => {
  const { data: categories, isLoading } = useCategoryImagesWithSync();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleEditOpen = (category: any) => {
    setEditingCategory(category);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsEditOpen(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    if (!editingCategory || !selectedFile) {
      toast({ title: "Error", description: "Please select an image", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileName = `${editingCategory.category_slug}-${Date.now()}.${selectedFile.name.split('.').pop()}`;
      const { error: uploadError } = await supabase.storage
        .from("category-images")
        .upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("category-images").getPublicUrl(fileName);

      if (editingCategory.image_url) {
        try {
          const oldUrl = new URL(editingCategory.image_url);
          const pathParts = oldUrl.pathname.split("/category-images/");
          if (pathParts[1]) {
            await supabase.storage.from("category-images").remove([decodeURIComponent(pathParts[1])]);
          }
        } catch {}
      }

      const { error } = await supabase
        .from("category_images")
        .update({ image_url: urlData.publicUrl })
        .eq("id", editingCategory.id);
      if (error) throw error;

      toast({ title: "Updated", description: `${editingCategory.category_name} image updated successfully` });
      queryClient.invalidateQueries({ queryKey: ["adminCategoryImages"] });
      queryClient.invalidateQueries({ queryKey: ["shopByCategories"] });
      queryClient.invalidateQueries({ queryKey: ["mostLovedCategories"] });
      setIsEditOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading categories...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Update Category Image</DialogTitle>
            <DialogDescription>
              Upload a new image for {editingCategory?.category_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Current Image</Label>
              {editingCategory?.image_url ? (
                <img src={previewUrl || editingCategory.image_url} alt={editingCategory.category_name} className="w-full h-48 object-cover rounded-md border" />
              ) : previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover rounded-md border" />
              ) : (
                <div className="w-full h-48 bg-muted rounded-md border flex items-center justify-center">
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Select New Image</Label>
              <Input type="file" accept="image/*" onChange={handleFileSelect} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={uploading || !selectedFile}>
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Update Image"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Category Images ({categories?.length || 0})</CardTitle>
          <CardDescription>Manage images for each product category displayed on the homepage. Categories are managed in the Categories tab.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories?.map((cat: any) => (
              <div key={cat.id} className="border rounded-lg overflow-hidden">
                {cat.image_url ? (
                  <img src={cat.image_url} alt={cat.category_name} className="w-full h-48 object-cover" />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
                <div className="p-3 flex items-center justify-between">
                  <p className="font-medium text-sm">{cat.category_name}</p>
                  <Button variant="outline" size="sm" onClick={() => handleEditOpen(cat)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    {cat.image_url ? "Update" : "Add"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminCategoryImagesTab;
