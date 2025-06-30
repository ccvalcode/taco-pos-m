
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Clock, ChefHat, CheckCircle, AlertCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Kitchen = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar hora cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Obtener órdenes para cocina
  const { data: orders, isLoading } = useQuery({
    queryKey: ['kitchen-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          tables (number),
          order_items (
            *,
            products (name),
            order_item_modifiers (
              *,
              modifiers (name, price)
            )
          )
        `)
        .in('status', ['pendiente', 'en_preparacion'])
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000 // Actualizar cada 30 segundos
  });

  // Mutation para actualizar estado de orden
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: 'pendiente' | 'en_preparacion' | 'lista' | 'pagada' | 'entregada' }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kitchen-orders'] });
      toast({
        title: "Estado actualizado",
        description: "El estado de la orden ha sido actualizado correctamente."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado de la orden.",
        variant: "destructive"
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'bg-red-500';
      case 'en_preparacion':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pendiente':
        return 'Pendiente';
      case 'en_preparacion':
        return 'En Preparación';
      default:
        return status;
    }
  };

  const getTimeElapsed = (createdAt: string) => {
    const created = new Date(createdAt);
    const diff = currentTime.getTime() - created.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Recién creada';
    if (minutes === 1) return '1 minuto';
    return `${minutes} minutos`;
  };

  const getOrderTypeDisplay = (order: any) => {
    if (order.type === 'mesa' && order.tables) {
      return `Mesa ${order.tables.number}`;
    }
    return 'Para Llevar';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <ChefHat className="w-16 h-16 text-red-600 mx-auto mb-4 animate-pulse" />
          <p className="text-lg text-gray-600">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <ChefHat className="w-8 h-8" />
              <div>
                <h1 className="text-3xl font-bold">🍳 Comandero de Cocina</h1>
                <p className="text-orange-100">Taquería El Sabroso</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {currentTime.toLocaleTimeString('es-MX', { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </div>
              <div className="text-orange-100">
                {currentTime.toLocaleDateString('es-MX', { 
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long'
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estadísticas rápidas */}
      <div className="container mx-auto px-4 py-4">
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-red-50 border-red-200">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-8 h-8 text-red-600" />
              <div>
                <div className="text-2xl font-bold text-red-600">
                  {orders?.filter(o => o.status === 'pendiente').length || 0}
                </div>
                <div className="text-sm text-red-700">Órdenes Pendientes</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  {orders?.filter(o => o.status === 'en_preparacion').length || 0}
                </div>
                <div className="text-sm text-yellow-700">En Preparación</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <ChefHat className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {orders?.length || 0}
                </div>
                <div className="text-sm text-blue-700">Total Activas</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Lista de órdenes */}
        {!orders || orders.length === 0 ? (
          <Card className="p-8 text-center">
            <ChefHat className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay órdenes pendientes
            </h3>
            <p className="text-gray-500">
              Todas las órdenes están completadas. ¡Buen trabajo! 👨‍🍳
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="p-4 hover:shadow-lg transition-all duration-200">
                {/* Header de la orden */}
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={`${getStatusColor(order.status)} text-white`}>
                        {getStatusText(order.status)}
                      </Badge>
                      <span className="text-sm text-gray-500">
                        #{order.order_number}
                      </span>
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {getOrderTypeDisplay(order)}
                    </div>
                  </div>
                  <div className="text-right text-sm">
                    <div className="text-gray-600">
                      {new Date(order.created_at).toLocaleTimeString('es-MX', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    <div className="text-red-600 font-medium">
                      {getTimeElapsed(order.created_at)}
                    </div>
                  </div>
                </div>

                <Separator className="mb-3" />

                {/* Items de la orden */}
                <div className="space-y-3 mb-4">
                  {order.order_items?.map((item, index) => (
                    <div key={index} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-gray-800">
                          {item.quantity}x {item.products?.name}
                        </div>
                      </div>

                      {/* Modificadores */}
                      {item.order_item_modifiers && item.order_item_modifiers.length > 0 && (
                        <div className="space-y-1">
                          {item.order_item_modifiers.map((modifier, modIndex) => (
                            <div key={modIndex} className="text-sm text-gray-600 ml-4">
                              • {modifier.modifiers?.name}
                            </div>
                          ))}
                        </div>
                      )}

                      {item.notes && (
                        <div className="mt-2 text-sm text-orange-600 bg-orange-50 p-2 rounded">
                          📝 {item.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {order.notes && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                    <div className="text-sm font-medium text-blue-800 mb-1">
                      Notas de la orden:
                    </div>
                    <div className="text-sm text-blue-700">{order.notes}</div>
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2">
                  {order.status === 'pendiente' && (
                    <Button
                      onClick={() => updateOrderStatus.mutate({
                        orderId: order.id,
                        status: 'en_preparacion'
                      })}
                      className="flex-1 bg-yellow-500 hover:bg-yellow-600"
                      disabled={updateOrderStatus.isPending}
                    >
                      <Clock className="w-4 h-4 mr-2" />
                      Comenzar
                    </Button>
                  )}
                  
                  {order.status === 'en_preparacion' && (
                    <Button
                      onClick={() => updateOrderStatus.mutate({
                        orderId: order.id,
                        status: 'lista'
                      })}
                      className="flex-1 bg-green-500 hover:bg-green-600"
                      disabled={updateOrderStatus.isPending}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Marcar Lista
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Kitchen;
