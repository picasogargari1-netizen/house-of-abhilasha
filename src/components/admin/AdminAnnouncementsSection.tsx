import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Megaphone } from "lucide-react";

const useAnnouncements = () => {
  return useQuery({
    queryKey: ["adminAnnouncements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });
};

const AdminAnnouncementsSection = () => {
  const { data: announcements, isLoading } = useAnnouncements();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [editMessage, setEditMessage] = useState("");

  const handleAdd = async () => {
    if (!newMessage.trim()) {
      toast({ title: "Error", description: "Please enter a message", variant: "destructive" });
      return;
    }
    try {
      const nextOrder = (announcements?.length || 0) + 1;
      const { error } = await supabase
        .from("announcements")
        .insert({ message: newMessage.trim(), display_order: nextOrder });
      if (error) throw error;
      toast({ title: "Added", description: "Announcement added successfully" });
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      setIsAddOpen(false);
      setNewMessage("");
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleEditOpen = (ann: any) => {
    setEditingAnnouncement(ann);
    setEditMessage(ann.message);
    setIsEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editingAnnouncement || !editMessage.trim()) return;
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ message: editMessage.trim() })
        .eq("id", editingAnnouncement.id);
      if (error) throw error;
      toast({ title: "Updated", description: "Announcement updated" });
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      setIsEditOpen(false);
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("announcements").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] }),
  });

  const deleteAnnouncement = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("announcements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAnnouncements"] });
      toast({ title: "Deleted", description: "Announcement removed" });
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading announcements...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
            <DialogDescription>Update the scrolling message text.</DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Label>Message</Label>
            <Input value={editMessage} onChange={(e) => setEditMessage(e.target.value)} placeholder="Announcement message" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
            <Button onClick={handleEditSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5" />
              Announcements ({announcements?.length || 0})
            </CardTitle>
            <CardDescription>Manage the scrolling messages shown above the header.</CardDescription>
          </div>
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="h-4 w-4 mr-2" />Add</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Announcement</DialogTitle>
                <DialogDescription>Add a new scrolling message for the announcement bar.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-2">
                <Label>Message *</Label>
                <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="e.g. Free Shipping on Orders Above ₹999" />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Add Announcement</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {!announcements?.length ? (
            <p className="text-center text-muted-foreground py-4">No announcements yet.</p>
          ) : (
            <div className="grid gap-3">
              {announcements.map((ann: any, index: number) => (
                <div key={ann.id} className="flex items-center gap-3 p-3 border rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                  <p className="flex-1 text-sm truncate">{ann.message}</p>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={ann.is_active}
                      onCheckedChange={(checked) => toggleActive.mutate({ id: ann.id, is_active: checked })}
                    />
                    <Badge variant={ann.is_active ? "default" : "secondary"}>
                      {ann.is_active ? "Active" : "Hidden"}
                    </Badge>
                    <Button variant="outline" size="sm" onClick={() => handleEditOpen(ann)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => { if (confirm("Delete this announcement?")) deleteAnnouncement.mutate(ann.id); }}
                      disabled={deleteAnnouncement.isPending}
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
    </>
  );
};

export default AdminAnnouncementsSection;
