import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminAnnouncementsSection from "./AdminAnnouncementsSection";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, GripVertical, Pencil } from "lucide-react";

const useBanners = () => {
  return useQuery({
    queryKey: ["adminBanners"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};

const AdminBannersTab = () => {
  const { data: banners, isLoading } = useBanners();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: "", link: "", button_text: "Shop Now" });
  const [editBanner, setEditBanner] = useState({ title: "", link: "", button_text: "Shop Now" });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editPreviewUrl, setEditPreviewUrl] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast({ title: "Error", description: "Please select an image", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const fileName = `${Date.now()}-${selectedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(fileName, selectedFile);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("banners").getPublicUrl(fileName);

      const nextOrder = (banners?.length || 0) + 1;
      const { error: insertError } = await supabase
        .from("banners")
        .insert({
          image_url: urlData.publicUrl,
          title: newBanner.title || null,
          link: newBanner.link || null,
          button_text: newBanner.button_text || "Shop Now",
          display_order: nextOrder,
          is_active: true,
        });
      if (insertError) throw insertError;

      toast({ title: "Banner Added", description: "Hero banner uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
      setIsAddOpen(false);
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewBanner({ title: "", link: "", button_text: "Shop Now" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to upload banner", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("banners").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminBanners"] }),
  });

  const deleteBanner = useMutation({
    mutationFn: async (id: string) => {
      const banner = banners?.find((b: any) => b.id === id);
      if (banner) {
        // Extract file name from URL and delete from storage
        const url = new URL(banner.image_url);
        const pathParts = url.pathname.split("/banners/");
        if (pathParts[1]) {
          await supabase.storage.from("banners").remove([decodeURIComponent(pathParts[1])]);
        }
      }
      const { error } = await supabase.from("banners").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
      toast({ title: "Deleted", description: "Banner removed" });
    },
  });

  const handleEditOpen = (banner: any) => {
    setEditingBanner(banner);
    setEditBanner({ title: banner.title || "", link: banner.link || "", button_text: banner.button_text || "Shop Now" });
    setEditFile(null);
    setEditPreviewUrl(null);
    setIsEditOpen(true);
  };

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditFile(file);
      setEditPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleEditSave = async () => {
    if (!editingBanner) return;
    setUploading(true);
    try {
      let imageUrl = editingBanner.image_url;

      // If a new file was selected, upload it and delete the old one
      if (editFile) {
        const fileName = `${Date.now()}-${editFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("banners")
          .upload(fileName, editFile);
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from("banners").getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;

        // Delete old file from storage
        const oldUrl = new URL(editingBanner.image_url);
        const pathParts = oldUrl.pathname.split("/banners/");
        if (pathParts[1]) {
          await supabase.storage.from("banners").remove([decodeURIComponent(pathParts[1])]);
        }
      }

      const { error } = await supabase
        .from("banners")
        .update({
          image_url: imageUrl,
          title: editBanner.title || null,
          link: editBanner.link || null,
          button_text: editBanner.button_text || "Shop Now",
        })
        .eq("id", editingBanner.id);
      if (error) throw error;

      toast({ title: "Banner Updated", description: "Banner has been updated successfully" });
      queryClient.invalidateQueries({ queryKey: ["adminBanners"] });
      setIsEditOpen(false);
      setEditingBanner(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update banner", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading banners...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button disabled={(banners?.length || 0) >= 6}><Plus className="h-4 w-4 mr-2" />Add Banner</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>Add Hero Banner</DialogTitle>
              <DialogDescription>Upload an image for the homepage hero carousel.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4 overflow-y-auto flex-1">
              <div className="space-y-2">
                <Label>Banner Image *</Label>
                <Input type="file" accept="image/*" onChange={handleFileSelect} />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-full h-28 object-cover rounded-md border" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Title (optional)</Label>
                <Input value={newBanner.title} onChange={(e) => setNewBanner({ ...newBanner, title: e.target.value })} placeholder="Banner title" />
              </div>
              <div className="space-y-2">
                <Label>Link (optional)</Label>
                <Input value={newBanner.link} onChange={(e) => setNewBanner({ ...newBanner, link: e.target.value })} placeholder="/all-products" />
              </div>
              <div className="space-y-2">
                <Label>Button Text</Label>
                <Input value={newBanner.button_text} onChange={(e) => setNewBanner({ ...newBanner, button_text: e.target.value })} placeholder="Shop Now" />
              </div>
            </div>
            <DialogFooter className="shrink-0">
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleUpload} disabled={uploading || !selectedFile}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Banner Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Banner</DialogTitle>
            <DialogDescription>Update banner details or replace the image.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4 overflow-y-auto flex-1">
            <div className="space-y-2">
              <Label>Current Image</Label>
              {editingBanner && (
                <img src={editPreviewUrl || editingBanner.image_url} alt="Banner" className="w-full h-28 object-cover rounded-md border" />
              )}
              <Label className="text-sm text-muted-foreground">Replace Image (optional)</Label>
              <Input type="file" accept="image/*" onChange={handleEditFileSelect} />
            </div>
            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input value={editBanner.title} onChange={(e) => setEditBanner({ ...editBanner, title: e.target.value })} placeholder="Banner title" />
            </div>
            <div className="space-y-2">
              <Label>Link (optional)</Label>
              <Input value={editBanner.link} onChange={(e) => setEditBanner({ ...editBanner, link: e.target.value })} placeholder="/all-products" />
            </div>
            <div className="space-y-2">
              <Label>Button Text</Label>
              <Input value={editBanner.button_text} onChange={(e) => setEditBanner({ ...editBanner, button_text: e.target.value })} placeholder="Shop Now" />
            </div>
          </div>
          <DialogFooter className="shrink-0">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave} disabled={uploading}>
              {uploading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Hero Banners ({banners?.length || 0})</CardTitle>
          <CardDescription>Manage the homepage hero carousel images (max 6). Banners display in order.</CardDescription>
        </CardHeader>
        <CardContent>
          {!banners?.length ? (
            <p className="text-center text-muted-foreground py-8">No banners yet. Add your first hero banner.</p>
          ) : (
            <div className="grid gap-4">
              {banners.map((banner: any, index: number) => (
                <div key={banner.id} className="flex items-center gap-4 p-3 border rounded-lg">
                  <div className="flex items-center text-muted-foreground">
                    <GripVertical className="h-5 w-5" />
                    <span className="ml-1 text-sm font-medium">#{index + 1}</span>
                  </div>
                  <img src={banner.image_url} alt={banner.title || "Banner"} className="w-32 h-20 object-cover rounded" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{banner.title || "Untitled Banner"}</p>
                    {banner.link && <p className="text-sm text-muted-foreground truncate">{banner.link}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={banner.is_active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: banner.id, is_active: checked })}
                      />
                      <Badge variant={banner.is_active ? "default" : "secondary"}>
                        {banner.is_active ? "Active" : "Hidden"}
                      </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => handleEditOpen(banner)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        if (confirm("Delete this banner?")) deleteBanner.mutate(banner.id);
                      }}
                      disabled={deleteBanner.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      <AdminAnnouncementsSection />
    </div>
  );
};

export default AdminBannersTab;
