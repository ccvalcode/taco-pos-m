import { useState, useCallback } from "react";
import {
  Card, CardHeader, CardTitle, CardContent,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
} from "@/components/ui/select";
import {
  Plus, Minus, Edit, Search, Package, AlertTriangle,
  Upload as UploadIcon, X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import Navigation from "@/components/Navigation";
import { useAuth } from "@/contexts/AuthContext";

const MAX_IMG_SIZE = 2 * 1024 * 1024; // 2 MB

const Inventory = () => {
  /* ----------- Auth ---------- */
  const { userProfile, hasPermission } = useAuth();
  const canAddProduct = hasPermission("inventory_manage");

  /* ----------- Hooks ---------- */
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState("");
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", sku: "", price: 0, cost: 0, stock_quantity: 0,
    category_id: "", imageFile: null as File | null,
  });
  const [formErr, setFormErr] = useState<string | null>(null);

  /* ----------- Categorías ---------- */
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,name,color");
      if (error) throw error;
      return data;
    },
  });

  /* ----------- Productos ---------- */
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["inventory-products", searchTerm],
    queryFn: async () => {
      let q = supabase.from("products").select("*,categories(id,name,color)").eq("is_active", true).order("name");
      if (searchTerm)
        q = q.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  /* ----------- Mutación agregar ---------- */
  const addProduct = useMutation({
    mutationFn: async (p: typeof newProduct) => {
      let image_url = null;
      if (p.imageFile) {
        const ext = p.imageFile.name.split(".").pop();
        const fileName = `${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from("product_images").upload(fileName, p.imageFile);
        if (upErr) throw upErr;
        image_url = supabase.storage.from("product_images").getPublicUrl(fileName).data.publicUrl;
      }
      const { error } = await supabase.from("products").insert({
        name: p.name,
        sku: p.sku,
        price: p.price,
        cost: p.cost,
        stock_quantity: p.stock_quantity,
        category_id: p.category_id || null,
        image_url,
        is_active: true,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
      toast({ title: "Producto agregado" });
      resetForm();
      setIsAddOpen(false);
    },
    onError: () => toast({ title: "Error al agregar", variant: "destructive" }),
  });

  const resetForm = () =>
    setNewProduct({
      name: "", sku: "", price: 0, cost: 0, stock_quantity: 0,
      category_id: "", imageFile: null,
    });

  /* ----------- Drag & drop ---------- */
  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return setFormErr("Debe ser imagen");
    if (file.size > MAX_IMG_SIZE) return setFormErr("Máx 2 MB");
    setFormErr(null);
    setNewProduct((p) => ({ ...p, imageFile: file }));
  };
  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }, []);

  /* ----------- Validación ---------- */
  const validate = () => {
    if (!newProduct.name.trim()) return "Nombre requerido";
    if (!newProduct.category_id) return "Categoría requerida";
    if (newProduct.price <= 0) return "Precio > 0";
    if (newProduct.imageFile && newProduct.imageFile.size > MAX_IMG_SIZE) return "Imagen >2 MB";
    return null;
  };

  /* ----------- UI helpers ---------- */
  const stockBadge = (p: any) => {
    const s = p.stock_quantity || 0, m = p.min_stock || 0;
    if (s === 0) return { t: "Sin Stock", c: "bg-red-500" };
    if (s <= m) return { t: "Stock Bajo", c: "bg-yellow-500" };
    return { t: "Stock OK", c: "bg-green-500" };
  };

  /* --------------------------- Render --------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 pb-20">
      <Navigation />

      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center gap-4">
          <Package className="w-8 h-8" />
          <h1 className="text-3xl font-bold">📦 Inventario</h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Buscador + btn */}
        <div className="flex justify-between items-center">
          <div className="relative w-1/2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input className="pl-10" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          {canAddProduct && (
            <Dialog open={isAddOpen} onOpenChange={(o) => { setIsAddOpen(o); resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-1" />Nuevo producto</Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader><DialogTitle>Agregar producto</DialogTitle></DialogHeader>
                <div className="space-y-3" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
                  <Input placeholder="Nombre" value={newProduct.name} onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })} />
                  <Input placeholder="SKU" value={newProduct.sku} onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })} />

                  <div className="grid grid-cols-2 gap-2">
                    <Input type="number" placeholder="Precio" value={newProduct.price} onChange={(e) => setNewProduct({ ...newProduct, price: +e.target.value })} />
                    <Input type="number" placeholder="Costo" value={newProduct.cost} onChange={(e) => setNewProduct({ ...newProduct, cost: +e.target.value })} />
                  </div>

                  <Input type="number" placeholder="Stock inicial" value={newProduct.stock_quantity} onChange={(e) => setNewProduct({ ...newProduct, stock_quantity: +e.target.value })} />

                  <Select value={newProduct.category_id} onValueChange={(v) => setNewProduct({ ...newProduct, category_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                    <SelectContent>
                      {categories.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Área imagen */}
                  <div className="border-2 border-dashed rounded p-4 text-center cursor-pointer" onClick={() => document.getElementById("fileInput")?.click()}>
                    {newProduct.imageFile ? (
                      <div className="relative inline-block">
                        <img src={URL.createObjectURL(newProduct.imageFile)} alt="preview" className="h-24 object-cover rounded" />
                        <Button size="icon" variant="ghost" className="absolute -top-2 -right-2" onClick={() => setNewProduct({ ...newProduct, imageFile: null })}><X className="w-4 h-4" /></Button>
                      </div>
                    ) : (
                      <p className="text-gray-500 flex flex-col items-center">
                        <UploadIcon className="w-6 h-6 mb-1" />
                        Suelta o haz clic para subir (2 MB)
                      </p>
                    )}
                    <Input id="fileInput" type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files && handleFile(e.target.files[0])} />
                  </div>

                  {formErr && <p className="text-sm text-red-500">{formErr}</p>}

                  <Button className="w-full" disabled={!!validate() || addProduct.isPending} onClick={() => {
                    const v = validate();
                    if (v) return setFormErr(v);
                    setFormErr(null);
                    addProduct.mutate(newProduct);
                  }}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* Tabla */}
        <Card>
          <CardHeader><CardTitle>Inventario</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8">Cargando...</p>
            ) : !products.length ? (
              <p className="text-center py-8 text-gray-500">No hay productos</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((p: any) => {
                    const st = stockBadge(p);
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="flex items-center gap-2">
                          {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 object-cover rounded" />}
                          {p.name}
                        </TableCell>
                        <TableCell>{p.sku}</TableCell>
                        <TableCell>
                          <Badge style={{ backgroundColor: p.categories?.color }}>{p.categories?.name}</Badge>
                        </TableCell>
                        <TableCell>{p.stock_quantity}</TableCell>
                        <TableCell><Badge className={`${st.c} text-white`}>{st.t}</Badge></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Inventory;
