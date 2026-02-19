import { useState, useEffect } from "react";
import { useAdminProducts, useCreateProduct, useDeleteProduct, useUpdateProduct } from "@/hooks/useAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Pencil, Upload, X, ImageIcon } from "lucide-react";

type FilterType = "all" | "new_arrivals" | "best_sellers" | "product_of_day";

const filterTabs: { key: FilterType; label: string }[] = [
  { key: "all", label: "All Products" },
  { key: "new_arrivals", label: "New Arrivals" },
  { key: "best_sellers", label: "Best Sellers" },
  { key: "product_of_day", label: "Products of the Day" },
];

const emptyProduct = {
  name: "",
  description: "",
  short_description: "",
  price: "",
  discounted_price: "",
  category: "",
  sub_category: "",
  image_url1: "",
  image_url2: "",
  image_url3: "",
  in_stock: true,
  featured: false,
  is_new_arrival: false,
  is_best_seller: false,
  is_product_of_day: false,
};

const AdminProductsTab = () => {
  const { data: adminProducts, isLoading: productsLoading } = useAdminProducts();
  const createProduct = useCreateProduct();
  const deleteProduct = useDeleteProduct();
  const updateProduct = useUpdateProduct();
  const { toast } = useToast();

  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({ ...emptyProduct });
  const [editProduct, setEditProduct] = useState({ ...emptyProduct });
  const [newImageFiles, setNewImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [newImagePreviews, setNewImagePreviews] = useState<(string | null)[]>([null, null, null]);
  const [editImageFiles, setEditImageFiles] = useState<(File | null)[]>([null, null, null]);
  const [editImagePreviews, setEditImagePreviews] = useState<(string | null)[]>([null, null, null]);
  const [uploading, setUploading] = useState(false);
  const [subCategories, setSubCategories] = useState<{ id: string; category_id: string; name: string }[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    const fetchCategoriesAndSubs = async () => {
      const [catRes, subRes] = await Promise.all([
        supabase.from("product_categories").select("id, name").order("display_order"),
        supabase.from("product_subcategories").select("id, category_id, name").order("display_order"),
      ]);
      if (catRes.data) setCategories(catRes.data);
      if (subRes.data) setSubCategories(subRes.data);
    };
    fetchCategoriesAndSubs();
  }, []);

  const isLoading = productsLoading;

  const uploadImage = async (file: File): Promise<string> => {
    const fileName = `${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) throw error;
    const { data } = supabase.storage.from("product-images").getPublicUrl(fileName);
    return data.publicUrl;
  };

  const handleImageSelect = (index: number, file: File | null, isEdit: boolean) => {
    if (isEdit) {
      const files = [...editImageFiles];
      const previews = [...editImagePreviews];
      files[index] = file;
      previews[index] = file ? URL.createObjectURL(file) : null;
      setEditImageFiles(files);
      setEditImagePreviews(previews);
    } else {
      const files = [...newImageFiles];
      const previews = [...newImagePreviews];
      files[index] = file;
      previews[index] = file ? URL.createObjectURL(file) : null;
      setNewImageFiles(files);
      setNewImagePreviews(previews);
    }
  };

  const handleAddProduct = async () => {
    if (!newProduct.name || !newProduct.price || !newProduct.category) {
      toast({ title: "Validation Error", description: "Please fill in name, price, and category", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const urls: (string | undefined)[] = [undefined, undefined, undefined];
      for (let i = 0; i < 3; i++) {
        if (newImageFiles[i]) {
          urls[i] = await uploadImage(newImageFiles[i]!);
        }
      }
      await createProduct.mutateAsync({
        name: newProduct.name,
        description: newProduct.description,
        short_description: newProduct.short_description,
        price: parseFloat(newProduct.price),
        category: newProduct.category,
        sub_category: newProduct.sub_category || null,
        discounted_price: newProduct.discounted_price ? parseFloat(newProduct.discounted_price) : null,
        image_url1: urls[0],
        image_url2: urls[1],
        image_url3: urls[2],
        in_stock: newProduct.in_stock,
        featured: newProduct.featured,
        is_new_arrival: newProduct.is_new_arrival,
        is_best_seller: newProduct.is_best_seller,
        is_product_of_day: newProduct.is_product_of_day,
      });
      toast({ title: "Product Added", description: `${newProduct.name} has been added successfully` });
      setIsAddDialogOpen(false);
      setNewProduct({ ...emptyProduct });
      setNewImageFiles([null, null, null]);
      setNewImagePreviews([null, null, null]);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to add product", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleEditOpen = (product: any) => {
    setEditingProductId(product.id);
    setEditProduct({
      name: product.name || "",
      description: product.description || "",
      short_description: product.short_description || "",
      price: String(product.price ?? ""),
      discounted_price: product.discounted_price ? String(product.discounted_price) : "",
      category: product.category || "",
      sub_category: product.sub_category || "",
      image_url1: product.image_url1 || "",
      image_url2: product.image_url2 || "",
      image_url3: product.image_url3 || "",
      in_stock: product.in_stock ?? true,
      featured: product.featured ?? false,
      is_new_arrival: product.is_new_arrival ?? false,
      is_best_seller: product.is_best_seller ?? false,
      is_product_of_day: product.is_product_of_day ?? false,
    });
    setEditImageFiles([null, null, null]);
    setEditImagePreviews([null, null, null]);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingProductId || !editProduct.name || !editProduct.price || !editProduct.category) {
      toast({ title: "Validation Error", description: "Please fill in name, price, and category", variant: "destructive" });
      return;
    }
    setUploading(true);
    try {
      const urlKeys = ["image_url1", "image_url2", "image_url3"] as const;
      const updatedUrls: Record<string, string | undefined> = {};
      for (let i = 0; i < 3; i++) {
        if (editImageFiles[i]) {
          updatedUrls[urlKeys[i]] = await uploadImage(editImageFiles[i]!);
        } else {
          updatedUrls[urlKeys[i]] = editProduct[urlKeys[i]] || undefined;
        }
      }
      await updateProduct.mutateAsync({
        id: editingProductId,
        updates: {
          name: editProduct.name,
          description: editProduct.description,
          short_description: editProduct.short_description,
          price: parseFloat(editProduct.price),
          category: editProduct.category,
          sub_category: editProduct.sub_category || null,
          discounted_price: editProduct.discounted_price ? parseFloat(editProduct.discounted_price) : null,
          ...updatedUrls,
          in_stock: editProduct.in_stock,
          featured: editProduct.featured,
          is_new_arrival: editProduct.is_new_arrival,
          is_best_seller: editProduct.is_best_seller,
          is_product_of_day: editProduct.is_product_of_day,
        },
      });
      toast({ title: "Product Updated", description: `${editProduct.name} has been updated` });
      setIsEditDialogOpen(false);
      setEditingProductId(null);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update product", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteProduct = async (productId: string, productName: string) => {
    if (!confirm(`Are you sure you want to delete "${productName}"?`)) return;
    try {
      await deleteProduct.mutateAsync(productId);
      toast({ title: "Product Deleted", description: `${productName} has been deleted` });
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to delete product", variant: "destructive" });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading products...</p>
        </CardContent>
      </Card>
    );
  }

  const allProducts = adminProducts || [];
  const filteredProducts = allProducts.filter((p: any) => {
    if (activeFilter === "all") return true;
    if (activeFilter === "new_arrivals") return p.is_new_arrival;
    if (activeFilter === "best_sellers") return p.is_best_seller;
    if (activeFilter === "product_of_day") return p.is_product_of_day;
    return true;
  });

  const renderProductFormFields = (product: typeof emptyProduct, setProduct: (p: typeof emptyProduct) => void, isEdit?: boolean) => {
    const imageFiles = isEdit ? editImageFiles : newImageFiles;
    const imagePreviews = isEdit ? editImagePreviews : newImagePreviews;
    const urlKeys = ["image_url1", "image_url2", "image_url3"] as const;

    return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Product Name *</Label>
          <Input value={product.name} onChange={(e) => setProduct({ ...product, name: e.target.value })} placeholder="Enter product name" />
        </div>
        <div className="space-y-2">
          <Label>Price (₹) *</Label>
          <Input type="number" value={product.price} onChange={(e) => setProduct({ ...product, price: e.target.value })} placeholder="0" />
        </div>
        <div className="space-y-2">
          <Label>Discounted Price (₹)</Label>
          <Input type="number" value={product.discounted_price} onChange={(e) => setProduct({ ...product, discounted_price: e.target.value })} placeholder="Optional" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Category *</Label>
          <Select value={product.category} onValueChange={(value) => setProduct({ ...product, category: value, sub_category: "" })}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (<SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Sub-Category (Optional)</Label>
          {(() => {
            const matchedCat = categories.find(c => c.name === product.category);
            const filteredSubs = matchedCat ? subCategories.filter(s => s.category_id === matchedCat.id) : [];
            return (
              <Select value={product.sub_category} onValueChange={(value) => setProduct({ ...product, sub_category: value })}>
                <SelectTrigger><SelectValue placeholder={filteredSubs.length ? "Select sub-category" : "No sub-categories"} /></SelectTrigger>
                <SelectContent>
                  {filteredSubs.map((sub) => (<SelectItem key={sub.id} value={sub.name}>{sub.name}</SelectItem>))}
                </SelectContent>
              </Select>
            );
          })()}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={product.description} onChange={(e) => setProduct({ ...product, description: e.target.value })} placeholder="Product description (shown in Description tab)" rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Order Details</Label>
        <Textarea value={product.short_description} onChange={(e) => setProduct({ ...product, short_description: e.target.value })} placeholder="Delivery timeline, return policy, etc. (shown in Order Details tab)" rows={3} />
      </div>
      <div className="space-y-2">
        <Label>Product Images</Label>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => {
            const currentUrl = product[urlKeys[i]];
            const preview = imagePreviews[i];
            const hasImage = preview || currentUrl;
            return (
              <div key={i} className="space-y-2">
                <p className="text-xs text-muted-foreground">Image {i + 1}</p>
                {hasImage ? (
                  <div className="relative">
                    <img src={preview || currentUrl} alt={`Image ${i + 1}`} className="w-full h-28 object-cover rounded-md border" />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-1 right-1 h-6 w-6"
                      onClick={() => {
                        handleImageSelect(i, null, !!isEdit);
                        setProduct({ ...product, [urlKeys[i]]: "" });
                      }}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                    <ImageIcon className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-xs text-muted-foreground">Upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleImageSelect(i, file, !!isEdit);
                      }}
                    />
                  </label>
                )}
                {hasImage && !imageFiles[i] && (
                  <label className="block">
                    <span className="text-xs text-primary cursor-pointer hover:underline">Replace</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        handleImageSelect(i, file, !!isEdit);
                      }}
                    />
                  </label>
                )}
              </div>
            );
          })}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Product Sections</Label>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-2">
            <Checkbox id={`${isEdit ? 'edit' : 'new'}_new_arrival`} checked={product.is_new_arrival} onCheckedChange={(checked) => setProduct({ ...product, is_new_arrival: !!checked })} />
            <Label htmlFor={`${isEdit ? 'edit' : 'new'}_new_arrival`}>New Arrival</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id={`${isEdit ? 'edit' : 'new'}_best_seller`} checked={product.is_best_seller} onCheckedChange={(checked) => setProduct({ ...product, is_best_seller: !!checked })} />
            <Label htmlFor={`${isEdit ? 'edit' : 'new'}_best_seller`}>Best Seller</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox id={`${isEdit ? 'edit' : 'new'}_product_of_day`} checked={product.is_product_of_day} onCheckedChange={(checked) => setProduct({ ...product, is_product_of_day: !!checked })} />
            <Label htmlFor={`${isEdit ? 'edit' : 'new'}_product_of_day`}>Product of the Day</Label>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6">
        <div className="flex items-center space-x-2">
          <Checkbox id={`${isEdit ? 'edit' : 'new'}_in_stock`} checked={product.in_stock} onCheckedChange={(checked) => setProduct({ ...product, in_stock: !!checked })} />
          <Label htmlFor={`${isEdit ? 'edit' : 'new'}_in_stock`}>In Stock</Label>
        </div>
        <div className="flex items-center space-x-2">
          <Checkbox id={`${isEdit ? 'edit' : 'new'}_featured`} checked={product.featured} onCheckedChange={(checked) => setProduct({ ...product, featured: !!checked })} />
          <Label htmlFor={`${isEdit ? 'edit' : 'new'}_featured`}>Featured</Label>
        </div>
      </div>
    </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Add Product Button */}
      <div className="flex justify-end">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Product</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>Fill in the product details below.</DialogDescription>
            </DialogHeader>
            {renderProductFormFields(newProduct, setNewProduct)}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddProduct} disabled={createProduct.isPending || uploading}>
                {uploading ? "Uploading..." : createProduct.isPending ? "Adding..." : "Add Product"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {filterTabs.map((tab) => (
          <Button
            key={tab.key}
            variant={activeFilter === tab.key ? "default" : "outline"}
            size="sm"
            onClick={() => setActiveFilter(tab.key)}
          >
            {tab.label}
            {tab.key !== "all" && (
              <Badge variant="secondary" className="ml-2">
                {allProducts.filter((p: any) =>
                  tab.key === "new_arrivals" ? p.is_new_arrival :
                  tab.key === "best_sellers" ? p.is_best_seller :
                  tab.key === "product_of_day" ? p.is_product_of_day : false
                ).length}
              </Badge>
            )}
          </Button>
        ))}
      </div>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>Update the product details below.</DialogDescription>
          </DialogHeader>
          {renderProductFormFields(editProduct, setEditProduct, true)}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={updateProduct.isPending || uploading}>
              {uploading ? "Uploading..." : updateProduct.isPending ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            {activeFilter === "all" ? "All products in the catalog" : `Showing ${filterTabs.find(t => t.key === activeFilter)?.label}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No products found in this section.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Sub Category</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Sections</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product: any) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        {product.image_url1 ? (
                          <img src={product.image_url1} alt={product.name} className="w-12 h-12 object-cover rounded" />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs">No img</div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px]"><p className="truncate">{product.name}</p></TableCell>
                      <TableCell>
                        <Badge variant="outline">{product.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {product.sub_category ? <Badge variant="secondary">{product.sub_category}</Badge> : <span className="text-muted-foreground text-xs">—</span>}
                      </TableCell>
                      <TableCell>
                        {product.discounted_price ? (
                          <div>
                            <span className="text-muted-foreground line-through text-xs">₹{Number(product.price).toLocaleString()}</span>
                            <span className="ml-1 font-medium">₹{Number(product.discounted_price).toLocaleString()}</span>
                          </div>
                        ) : (
                          <span>₹{Number(product.price).toLocaleString()}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {product.is_new_arrival && <Badge variant="secondary" className="text-xs">New</Badge>}
                          {product.is_best_seller && <Badge variant="secondary" className="text-xs">Best Seller</Badge>}
                          {product.is_product_of_day && <Badge variant="secondary" className="text-xs">POTD</Badge>}
                        </div>
                      </TableCell>
                      <TableCell><Badge variant={product.in_stock ? "default" : "secondary"}>{product.in_stock ? "Yes" : "No"}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleEditOpen(product)}>
                            <Pencil className="h-4 w-4 mr-1" />Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => handleDeleteProduct(product.id, product.name)} disabled={deleteProduct.isPending}>
                            <Trash2 className="h-4 w-4 mr-1" />Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminProductsTab;
