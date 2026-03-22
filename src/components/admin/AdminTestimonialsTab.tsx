import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { uploadToImageKit } from "@/lib/imagekit";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Upload, Video, User } from "lucide-react";
import { proxyImageUrl } from "@/lib/utils";

type Testimonial = {
  id: string;
  testimonial_type: "video" | "photo";
  customer_name: string;
  customer_photo_url: string | null;
  feedback_text: string | null;
  video_url: string | null;
  display_order: number;
  is_active: boolean;
};

const useTestimonials = (type: "video" | "photo") =>
  useQuery({
    queryKey: ["adminTestimonials", type],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .eq("testimonial_type", type)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as Testimonial[];
    },
  });

const VideoTestimonialsSection = () => {
  const { data: videos, isLoading } = useTestimonials("video");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!videoFile) {
      toast({ title: "Error", description: "Please select a video file", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const videoUrl = await uploadToImageKit(videoFile, "/testimonials/videos");
      const nextOrder = (videos?.length || 0) + 1;
      const { error } = await supabase.from("testimonials").insert({
        testimonial_type: "video",
        customer_name: name.trim() || "Customer",
        video_url: videoUrl,
        display_order: nextOrder,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Video Added", description: "Customer review video uploaded successfully" });
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials", "video"] });
      queryClient.invalidateQueries({ queryKey: ["publicTestimonials"] });
      setIsAddOpen(false);
      setName("");
      setVideoFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to upload video", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("testimonials").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials", "video"] });
      queryClient.invalidateQueries({ queryKey: ["publicTestimonials"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials", "video"] });
      queryClient.invalidateQueries({ queryKey: ["publicTestimonials"] });
      toast({ title: "Deleted", description: "Video testimonial removed" });
    },
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><Video className="h-5 w-5" />Video Testimonials</CardTitle>
          <CardDescription>Upload customer review videos (max 4 shown on homepage)</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm" disabled={(videos?.length || 0) >= 4}>
              <Plus className="h-4 w-4 mr-2" />Add Video
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Video Testimonial</DialogTitle>
              <DialogDescription>Upload a customer review video (MP4, MOV, WebM recommended)</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Customer Name (optional)</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Customer name" />
              </div>
              <div className="space-y-2">
                <Label>Video File *</Label>
                <Input type="file" accept="video/*" onChange={handleVideoSelect} />
                {previewUrl && (
                  <video src={previewUrl} controls className="w-full rounded-md border max-h-40 object-contain bg-black" />
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={uploading || !videoFile}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Video"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : !videos?.length ? (
          <p className="text-muted-foreground text-sm text-center py-6">No video testimonials yet. Add up to 4.</p>
        ) : (
          <div className="space-y-3">
            {videos.map((v, i) => (
              <div key={v.id} className="flex items-center gap-4 p-3 border rounded-lg">
                <span className="text-sm font-medium text-muted-foreground w-5">#{i + 1}</span>
                <video src={v.video_url!} className="w-24 h-16 object-cover rounded bg-black shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{v.customer_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{v.video_url}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={v.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: v.id, is_active: checked })}
                  />
                  <Badge variant={v.is_active ? "default" : "secondary"}>{v.is_active ? "Active" : "Hidden"}</Badge>
                  <Button
                    variant="destructive" size="sm"
                    onClick={() => { if (confirm("Delete this video?")) deleteItem.mutate(v.id); }}
                    disabled={deleteItem.isPending}
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
  );
};

const PhotoTestimonialsSection = () => {
  const { data: photos, isLoading } = useTestimonials("photo");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [feedback, setFeedback] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!name.trim() || !feedback.trim()) {
      toast({ title: "Error", description: "Customer name and feedback are required", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      let photoUrl: string | null = null;
      if (photoFile) {
        photoUrl = await uploadToImageKit(photoFile, "/testimonials/photos");
      }
      const nextOrder = (photos?.length || 0) + 1;
      const { error } = await supabase.from("testimonials").insert({
        testimonial_type: "photo",
        customer_name: name.trim(),
        feedback_text: feedback.trim(),
        customer_photo_url: photoUrl,
        display_order: nextOrder,
        is_active: true,
      });
      if (error) throw error;
      toast({ title: "Testimonial Added", description: "Customer testimonial added successfully" });
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials", "photo"] });
      queryClient.invalidateQueries({ queryKey: ["publicTestimonials"] });
      setIsAddOpen(false);
      setName("");
      setFeedback("");
      setPhotoFile(null);
      setPreviewUrl(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to add testimonial", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("testimonials").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials", "photo"] });
      queryClient.invalidateQueries({ queryKey: ["publicTestimonials"] });
    },
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("testimonials").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminTestimonials", "photo"] });
      queryClient.invalidateQueries({ queryKey: ["publicTestimonials"] });
      toast({ title: "Deleted", description: "Testimonial removed" });
    },
  });

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Photo Testimonials</CardTitle>
          <CardDescription>Add customer photos and written feedback</CardDescription>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add Testimonial</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add Photo Testimonial</DialogTitle>
              <DialogDescription>Add a customer photo and their feedback</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Customer Name *</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Priya Sharma" />
              </div>
              <div className="space-y-2">
                <Label>Customer Photo (optional)</Label>
                <Input type="file" accept="image/*" onChange={handlePhotoSelect} />
                {previewUrl && (
                  <img src={previewUrl} alt="Preview" className="w-16 h-16 rounded-full object-cover border" />
                )}
              </div>
              <div className="space-y-2">
                <Label>Feedback / Review *</Label>
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Write the customer's feedback here..."
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd} disabled={uploading}>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Saving..." : "Add Testimonial"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-muted-foreground text-sm">Loading...</p>
        ) : !photos?.length ? (
          <p className="text-muted-foreground text-sm text-center py-6">No photo testimonials yet.</p>
        ) : (
          <div className="space-y-3">
            {photos.map((p) => (
              <div key={p.id} className="flex items-start gap-4 p-3 border rounded-lg">
                {p.customer_photo_url ? (
                  <img src={proxyImageUrl(p.customer_photo_url)} alt={p.customer_name} className="w-12 h-12 rounded-full object-cover shrink-0 border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <User className="h-6 w-6 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{p.customer_name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.feedback_text}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch
                    checked={p.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: p.id, is_active: checked })}
                  />
                  <Badge variant={p.is_active ? "default" : "secondary"}>{p.is_active ? "Active" : "Hidden"}</Badge>
                  <Button
                    variant="destructive" size="sm"
                    onClick={() => { if (confirm("Delete this testimonial?")) deleteItem.mutate(p.id); }}
                    disabled={deleteItem.isPending}
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
  );
};

const AdminTestimonialsTab = () => (
  <div className="space-y-0">
    <VideoTestimonialsSection />
    <PhotoTestimonialsSection />
  </div>
);

export default AdminTestimonialsTab;
