import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";

interface Category {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface SubCategory {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  display_order: number;
}

const AdminCategoriesTab = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCat, setExpandedCat] = useState<string | null>(null);

  // Category form
  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [catName, setCatName] = useState("");

  // SubCategory form
  const [subDialogOpen, setSubDialogOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);
  const [subName, setSubName] = useState("");
  const [subParentId, setSubParentId] = useState<string>("");

  const fetchData = async () => {
    setLoading(true);
    const [catRes, subRes] = await Promise.all([
      supabase.from("product_categories").select("*").order("display_order"),
      supabase.from("product_subcategories").select("*").order("display_order"),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (subRes.data) setSubCategories(subRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const toSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  // Category CRUD
  const openAddCategory = () => {
    setEditingCat(null);
    setCatName("");
    setCatDialogOpen(true);
  };

  const openEditCategory = (cat: Category) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDialogOpen(true);
  };

  const saveCategory = async () => {
    const name = catName.trim();
    if (!name) return;
    const slug = toSlug(name);
    try {
      if (editingCat) {
        const { error } = await supabase.from("product_categories").update({ name, slug }).eq("id", editingCat.id);
        if (error) throw error;
        toast({ title: "Category updated" });
      } else {
        const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.display_order)) + 1 : 0;
        const { error } = await supabase.from("product_categories").insert({ name, slug, display_order: maxOrder });
        if (error) throw error;
        toast({ title: "Category added" });
      }
      setCatDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save category", variant: "destructive" });
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const { error } = await supabase.from("product_categories").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Category deleted" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    }
  };

  // SubCategory CRUD
  const openAddSub = (categoryId: string) => {
    setEditingSub(null);
    setSubName("");
    setSubParentId(categoryId);
    setSubDialogOpen(true);
  };

  const openEditSub = (sub: SubCategory) => {
    setEditingSub(sub);
    setSubName(sub.name);
    setSubParentId(sub.category_id);
    setSubDialogOpen(true);
  };

  const saveSub = async () => {
    const name = subName.trim();
    if (!name || !subParentId) return;
    const slug = toSlug(name);
    try {
      if (editingSub) {
        const { error } = await supabase.from("product_subcategories").update({ name, slug }).eq("id", editingSub.id);
        if (error) throw error;
        toast({ title: "Sub-category updated" });
      } else {
        const subs = subCategories.filter(s => s.category_id === subParentId);
        const maxOrder = subs.length > 0 ? Math.max(...subs.map(s => s.display_order)) + 1 : 0;
        const { error } = await supabase.from("product_subcategories").insert({ name, slug, category_id: subParentId, display_order: maxOrder });
        if (error) throw error;
        toast({ title: "Sub-category added" });
      }
      setSubDialogOpen(false);
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
    }
  };

  const deleteSub = async (id: string) => {
    try {
      const { error } = await supabase.from("product_subcategories").delete().eq("id", id);
      if (error) throw error;
      toast({ title: "Sub-category deleted" });
      fetchData();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to delete", variant: "destructive" });
    }
  };

  if (loading) return <p className="text-muted-foreground py-8 text-center">Loading categories...</p>;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Product Categories</CardTitle>
        <Button size="sm" onClick={openAddCategory}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {categories.length === 0 && <p className="text-muted-foreground text-sm">No categories yet.</p>}
        {categories.map((cat) => {
          const isExpanded = expandedCat === cat.id;
          const subs = subCategories.filter((s) => s.category_id === cat.id);
          return (
            <div key={cat.id} className="border border-border rounded-lg">
              <div className="flex items-center justify-between p-3">
                <button
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                  onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                >
                  {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  {cat.name}
                  <span className="text-xs text-muted-foreground">({subs.length} sub)</span>
                </button>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => openEditCategory(cat)}><Pencil className="h-4 w-4" /></Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete "{cat.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>This will also delete all its sub-categories. This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => deleteCategory(cat.id)}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-border p-3 pl-8 space-y-2">
                  {subs.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between py-1.5 px-3 bg-muted/50 rounded">
                      <span className="text-sm">{sub.name}</span>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditSub(sub)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete "{sub.name}"?</AlertDialogTitle>
                              <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSub(sub.id)}>Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={() => openAddSub(cat.id)}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add Sub-Category
                  </Button>
                </div>
              )}
            </div>
          );
        })}

        {/* Category Dialog */}
        <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingCat ? "Edit Category" : "Add Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Category Name" value={catName} onChange={(e) => setCatName(e.target.value)} />
              <Button onClick={saveCategory} className="w-full">{editingCat ? "Update" : "Add"}</Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* SubCategory Dialog */}
        <Dialog open={subDialogOpen} onOpenChange={setSubDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSub ? "Edit Sub-Category" : "Add Sub-Category"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <Input placeholder="Sub-Category Name" value={subName} onChange={(e) => setSubName(e.target.value)} />
              <Button onClick={saveSub} className="w-full">{editingSub ? "Update" : "Add"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default AdminCategoriesTab;
