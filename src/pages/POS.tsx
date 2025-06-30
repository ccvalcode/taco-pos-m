
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, User, Clock, Home, Calculator, FileText, Package, BarChart3 } from "lucide-react";
import ProductGrid from "@/components/pos/ProductGrid";
import Cart from "@/components/pos/Cart";
import OrderSummary from "@/components/pos/OrderSummary";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const POS = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [orderType, setOrderType] = useState<"mesa" | "para_llevar">("mesa");
  const [selectedTable, setSelectedTable] = useState<number | null>(null);

  // Obtener categorías
  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('order_position');
      
      if (error) throw error;
      return data;
    }
  });

  // Obtener productos
  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (
            name,
            color
          )
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Obtener mesas disponibles
  const { data: tables } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tables')
        .select('*')
        .order('number');
      
      if (error) throw error;
      return data;
    }
  });

  const addToCart = (product: any, modifiers: any[] = []) => {
    const newItem = {
      id: Date.now(),
      product,
      modifiers,
      quantity: 1,
      total: product.price + modifiers.reduce((sum, mod) => sum + (mod.price || 0), 0)
    };
    setCartItems([...cartItems, newItem]);
  };

  const updateCartItem = (id: number, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.id !== id));
    } else {
      setCartItems(cartItems.map(item => 
        item.id === id 
          ? { ...item, quantity, total: (item.product.price + item.modifiers.reduce((sum: number, mod: any) => sum + (mod.price || 0), 0)) * quantity }
          : item
      ));
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.total, 0);
  };

  const filteredProducts = products?.filter(product => 
    selectedCategory === "all" || product.category_id === selectedCategory
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold">🌮 Taquería El Sabroso</div>
              <Badge variant="secondary" className="bg-white/20 text-white">
                Sistema POS
              </Badge>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span>Cajero: Juan Pérez</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Turno: 08:00 - 16:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            {[
              { id: 'pos', name: 'Punto de Venta', icon: Home, active: true },
              { id: 'kitchen', name: 'Cocina', icon: Calculator },
              { id: 'orders', name: 'Órdenes', icon: FileText },
              { id: 'inventory', name: 'Inventario', icon: Package },
              { id: 'reports', name: 'Reportes', icon: BarChart3 }
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={tab.active ? "default" : "ghost"}
                className={`rounded-none border-b-2 ${
                  tab.active 
                    ? 'border-red-500 bg-red-50 text-red-600' 
                    : 'border-transparent'
                }`}
              >
                <tab.icon className="w-4 h-4 mr-2" />
                {tab.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Productos y Categorías */}
          <div className="col-span-8">
            <Card className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Menú</h2>
                
                {/* Selector de tipo de orden */}
                <div className="flex gap-2">
                  <Button
                    variant={orderType === "mesa" ? "default" : "outline"}
                    onClick={() => setOrderType("mesa")}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    🍽️ Para Mesa
                  </Button>
                  <Button
                    variant={orderType === "para_llevar" ? "default" : "outline"}
                    onClick={() => setOrderType("para_llevar")}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    🥡 Para Llevar
                  </Button>
                </div>
              </div>

              {/* Selector de mesa si es para mesa */}
              {orderType === "mesa" && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-3">Seleccionar Mesa</h3>
                  <div className="grid grid-cols-5 gap-2">
                    {tables?.map((table) => (
                      <Button
                        key={table.id}
                        variant={selectedTable === table.number ? "default" : "outline"}
                        onClick={() => setSelectedTable(table.number)}
                        className={`h-16 ${
                          table.status === 'ocupada' 
                            ? 'bg-red-100 border-red-300 text-red-700' 
                            : table.status === 'sucia'
                            ? 'bg-yellow-100 border-yellow-300 text-yellow-700'
                            : 'bg-green-100 border-green-300 text-green-700'
                        }`}
                        disabled={table.status === 'ocupada'}
                      >
                        <div className="text-center">
                          <div className="font-bold">Mesa {table.number}</div>
                          <div className="text-xs">{table.capacity} personas</div>
                          <div className="text-xs capitalize">{table.status}</div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Categorías */}
              <div className="flex gap-2 mb-6 overflow-x-auto">
                <Button
                  variant={selectedCategory === "all" ? "default" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                  className="bg-gray-600 hover:bg-gray-700 whitespace-nowrap"
                >
                  🍽️ Todos
                </Button>
                {categories?.map((category) => (
                  <Button
                    key={category.id}
                    variant={selectedCategory === category.id ? "default" : "outline"}
                    onClick={() => setSelectedCategory(category.id)}
                    className="whitespace-nowrap"
                    style={{ 
                      backgroundColor: selectedCategory === category.id ? category.color : 'transparent',
                      borderColor: category.color 
                    }}
                  >
                    {category.icon} {category.name}
                  </Button>
                ))}
              </div>

              {/* Grid de productos */}
              <ProductGrid 
                products={filteredProducts || []} 
                onAddToCart={addToCart}
              />
            </Card>
          </div>

          {/* Carrito y Resumen */}
          <div className="col-span-4">
            <div className="sticky top-4 space-y-4">
              {/* Carrito */}
              <Card className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart className="w-5 h-5 text-red-600" />
                  <h3 className="text-lg font-semibold">Carrito</h3>
                  <Badge variant="secondary">{cartItems.length}</Badge>
                </div>
                
                <Cart 
                  items={cartItems}
                  onUpdateItem={updateCartItem}
                />
              </Card>

              {/* Resumen de orden */}
              {cartItems.length > 0 && (
                <Card className="p-4">
                  <OrderSummary 
                    items={cartItems}
                    total={getCartTotal()}
                    orderType={orderType}
                    tableNumber={selectedTable}
                    onProcessOrder={() => {
                      // Aquí se procesaría la orden
                      console.log('Procesando orden:', {
                        items: cartItems,
                        type: orderType,
                        table: selectedTable,
                        total: getCartTotal()
                      });
                    }}
                  />
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POS;
