
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Package, Plus, Minus, AlertTriangle, Edit, Search } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const Inventory = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    quantity: 0,
    reason: '',
    type: 'in' as 'in' | 'out' | 'adjustment'
  });

  // Obtener productos con inventario
  const { data: products, isLoading } = useQuery({
    queryKey: ['inventory-products', searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select(`
          *,
          categories (name, color),
          inventory_movements (
            quantity,
            type,
            created_at
          )
        `)
        .eq('is_active', true)
        .order('name');

      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Ajustar inventario
  const adjustInventory = useMutation({
    mutationFn: async ({ productId, quantity, type, reason }: {
      productId: string;
      quantity: number;
      type: 'in' | 'out' | 'adjustment';
      reason: string;
    }) => {
      // Obtener stock actual
      const { data: product } = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', productId)
        .single();

      if (!product) throw new Error('Producto no encontrado');

      let newStock = product.stock_quantity || 0;
      
      if (type === 'in') {
        newStock += quantity;
      } else if (type === 'out') {
        newStock -= quantity;
      } else {
        newStock = quantity; // adjustment = establecer cantidad exacta
      }

      // Actualizar stock
      const { error: updateError } = await supabase
        .from('products')
        .update({ 
          stock_quantity: Math.max(0, newStock),
          updated_at: new Date().toISOString()
        })
        .eq('id', productId);

      if (updateError) throw updateError;

      // Registrar movimiento
      const { error: movementError } = await supabase
        .from('inventory_movements')
        .insert({
          product_id: productId,
          type,
          quantity: type === 'adjustment' ? quantity - (product.stock_quantity || 0) : quantity,
          reason
        });

      if (movementError) throw movementError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory-products'] });
      setSelectedProduct(null);
      setAdjustmentForm({ quantity: 0, reason: '', type: 'in' });
      toast({
        title: "Inventario actualizado",
        description: "El inventario ha sido actualizado correctamente."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el inventario.",
        variant: "destructive"
      });
    }
  });

  const getStockStatus = (product: any) => {
    const stock = product.stock_quantity || 0;
    const min = product.min_stock || 0;
    
    if (stock === 0) {
      return { status: 'Sin Stock', color: 'bg-red-500', textColor: 'text-red-600' };
    } else if (stock <= min) {
      return { status: 'Stock Bajo', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
    } else {
      return { status: 'Stock Normal', color: 'bg-green-500', textColor: 'text-green-600' };
    }
  };

  const handleAdjustment = () => {
    if (!selectedProduct || adjustmentForm.quantity === 0) return;
    
    adjustInventory.mutate({
      productId: selectedProduct.id,
      quantity: Math.abs(adjustmentForm.quantity),
      type: adjustmentForm.type,
      reason: adjustmentForm.reason
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Package className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">📦 Gestión de Inventario</h1>
              <p className="text-purple-100">Taquería El Sabroso</p>
            </div>
          </div>
        </div>
      </div>

      {/* Botón + Dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button className="bg-green-600 hover:bg-green-700 text-white mb-4">
            <Plus className="w-4 h-4 mr-2" />
            Nuevo producto
          </Button>
        </DialogTrigger>
        <NewProductForm />
      </Dialog>

      <div className="container mx-auto px-4 py-6">
        {/* Búsqueda */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar productos por nombre o SKU..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas de inventario */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {products?.length || 0}
                </div>
                <div className="text-sm text-blue-700">Total Productos</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {products?.filter(p => (p.stock_quantity || 0) === 0).length || 0}
                </div>
                <div className="text-sm text-red-700">Sin Stock</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {products?.filter(p => (p.stock_quantity || 0) <= (p.min_stock || 0) && (p.stock_quantity || 0) > 0).length || 0}
                </div>
                <div className="text-sm text-yellow-700">Stock Bajo</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <Package className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${products?.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost || 0)), 0).toFixed(2) || '0.00'}
                </div>
                <div className="text-sm text-green-700">Valor Inventario</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabla de productos */}
        <Card>
          <CardHeader>
            <CardTitle>Inventario de Productos</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Cargando inventario...</div>
            ) : !products || products.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron productos
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Producto</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Categoría</TableHead>
                    <TableHead>Stock Actual</TableHead>
                    <TableHead>Stock Mínimo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {products.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <TableRow key={product.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{product.name}</div>
                            <div className="text-sm text-gray-500">${product.price?.toFixed(2)}</div>
                          </div>
                        </TableCell>
                        <TableCell>{product.sku || 'N/A'}</TableCell>
                        <TableCell>
                          <Badge 
                            style={{ backgroundColor: product.categories?.color || '#gray' }}
                            className="text-white"
                          >
                            {product.categories?.name}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold">
                          {product.stock_quantity || 0} {product.unit || 'pcs'}
                        </TableCell>
                        <TableCell>{product.min_stock || 0}</TableCell>
                        <TableCell>
                          <Badge className={`${stockStatus.color} text-white`}>
                            {stockStatus.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          ${((product.stock_quantity || 0) * (product.cost || 0)).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => setSelectedProduct(product)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ajustar Inventario - {product.name}</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">Tipo de Movimiento</label>
                                  <div className="flex gap-2">
                                    <Button
                                      variant={adjustmentForm.type === 'in' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setAdjustmentForm({...adjustmentForm, type: 'in'})}
                                    >
                                      <Plus className="w-4 h-4 mr-2" />
                                      Entrada
                                    </Button>
                                    <Button
                                      variant={adjustmentForm.type === 'out' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setAdjustmentForm({...adjustmentForm, type: 'out'})}
                                    >
                                      <Minus className="w-4 h-4 mr-2" />
                                      Salida
                                    </Button>
                                    <Button
                                      variant={adjustmentForm.type === 'adjustment' ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setAdjustmentForm({...adjustmentForm, type: 'adjustment'})}
                                    >
                                      Ajuste
                                    </Button>
                                  </div>
                                </div>
                                
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    {adjustmentForm.type === 'adjustment' ? 'Nueva Cantidad' : 'Cantidad'}
                                  </label>
                                  <Input
                                    type="number"
                                    value={adjustmentForm.quantity}
                                    onChange={(e) => setAdjustmentForm({
                                      ...adjustmentForm, 
                                      quantity: parseInt(e.target.value) || 0
                                    })}
                                    placeholder="0"
                                  />
                                  <div className="text-sm text-gray-500 mt-1">
                                    Stock actual: {product.stock_quantity || 0} {product.unit || 'pcs'}
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-sm font-medium mb-2">Motivo</label>
                                  <Input
                                    value={adjustmentForm.reason}
                                    onChange={(e) => setAdjustmentForm({...adjustmentForm, reason: e.target.value})}
                                    placeholder="Describe el motivo del ajuste..."
                                  />
                                </div>

                                <Button 
                                  onClick={handleAdjustment}
                                  disabled={adjustmentForm.quantity === 0 || !adjustmentForm.reason.trim()}
                                  className="w-full"
                                >
                                  Confirmar Ajuste
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
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
