// NewProductForm.tsx
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const NewProductForm = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    name: "",
    sku: "",
    price: "",
    cost: "",
    stock_quantity: "",
    min_stock: ""
  });

  const createProduct = useMutation({
    mutationFn: async (p: typeof form) => {
      const { error } = await supabase.from("products").insert({
        ...p,
        price: parseFloat(p.price),
        cost: parseFloat(p.cost),
        stock_quantity: parseInt(p.stock_quantity, 10),
        min_stock: parseInt(p.min_stock, 10),
        is_active: true
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Producto creado" });
      queryClient.invalidateQueries({ queryKey: ["inventory-products"] });
    },
    onError: (e: any) => {
      toast({ title: "Error al crear", description: e.message, variant: "destructive" });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(form);
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Nuevo producto</DialogTitle>
      </DialogHeader>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Nombre"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <Input
          placeholder="SKU"
          value={form.sku}
          onChange={(e) => setForm({ ...form, sku: e.target.value })}
        />
        <Input
          type="number"
          placeholder="Precio de venta"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          required
        />
        <Input
          type="number"
          placeholder="Costo"
          value={form.cost}
          onChange={(e) => setForm({ ...form, cost: e.target.value })}
        />
        <Input
          type="number"
          placeholder="Stock inicial"
          value={form.stock_quantity}
          onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })}
          required
        />
        <Input
          type="number"
          placeholder="Stock mínimo"
          value={form.min_stock}
          onChange={(e) => setForm({ ...form, min_stock: e.target.value })}
        />

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700 text-white"
          disabled={createProduct.isPending}
        >
          Guardar
        </Button>
      </form>
    </DialogContent>
  );
};

export default NewProductForm;
