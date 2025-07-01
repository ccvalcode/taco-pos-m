
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Eye, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const Orders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendiente' | 'en_preparacion' | 'lista' | 'pagada' | 'entregada' | 'cancelada'>('all');

  // Obtener órdenes
  const { data: orders, isLoading } = useQuery({
    queryKey: ['orders', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          tables (number, name),
          users (name),
          order_items (
            *,
            products (name),
            order_item_modifiers (
              *,
              modifiers (name, price)
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Cambiar estado de orden
  const updateOrderStatus = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string, status: string }) => {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status, 
          updated_at: new Date().toISOString(),
          ...(status === 'entregada' && { completed_at: new Date().toISOString() })
        })
        .eq('id', orderId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
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
      case 'lista':
        return 'bg-blue-500';
      case 'pagada':
        return 'bg-green-500';
      case 'entregada':
        return 'bg-green-600';
      case 'cancelada':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pendiente':
        return <AlertTriangle className="w-4 h-4" />;
      case 'en_preparacion':
        return <Clock className="w-4 h-4" />;
      case 'lista':
        return <CheckCircle className="w-4 h-4" />;
      case 'pagada':
        return <CheckCircle className="w-4 h-4" />;
      case 'entregada':
        return <CheckCircle className="w-4 h-4" />;
      case 'cancelada':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'pendiente': 'Pendiente',
      'en_preparacion': 'En Preparación',
      'lista': 'Lista',
      'pagada': 'Pagada',
      'entregada': 'Entregada',
      'cancelada': 'Cancelada'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">📋 Gestión de Órdenes</h1>
              <p className="text-blue-100">Taquería El Sabroso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-center">
              <div>
                <label className="block text-sm font-medium mb-2">Estado</label>
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="pendiente">Pendientes</SelectItem>
                    <SelectItem value="en_preparacion">En Preparación</SelectItem>
                    <SelectItem value="lista">Listas</SelectItem>
                    <SelectItem value="pagada">Pagadas</SelectItem>
                    <SelectItem value="entregada">Entregadas</SelectItem>
                    <SelectItem value="cancelada">Canceladas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Estadísticas */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
          {[
            { status: 'pendiente', label: 'Pendientes', color: 'bg-red-50 border-red-200 text-red-600' },
            { status: 'en_preparacion', label: 'En Preparación', color: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
            { status: 'lista', label: 'Listas', color: 'bg-blue-50 border-blue-200 text-blue-600' },
            { status: 'pagada', label: 'Pagadas', color: 'bg-green-50 border-green-200 text-green-600' },
            { status: 'entregada', label: 'Entregadas', color: 'bg-green-100 border-green-300 text-green-700' },
            { status: 'cancelada', label: 'Canceladas', color: 'bg-gray-50 border-gray-200 text-gray-600' }
          ].map(({ status, label, color }) => (
            <Card key={status} className={`p-4 ${color}`}>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {orders?.filter(o => o.status === status).length || 0}
                </div>
                <div className="text-sm font-medium">{label}</div>
              </div>
            </Card>
          ))}
        </div>

        {/* Lista de órdenes */}
        {isLoading ? (
          <Card className="p-8 text-center">
            <div>Cargando órdenes...</div>
          </Card>
        ) : !orders || orders.length === 0 ? (
          <Card className="p-8 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay órdenes
            </h3>
            <p className="text-gray-500">
              No se encontraron órdenes con los filtros seleccionados
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {orders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-lg">#{order.order_number}</div>
                      <div className="text-sm text-gray-600">
                        {order.type === 'mesa' ? `Mesa ${order.tables?.number}` : 'Para Llevar'}
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(order.status)} text-white flex items-center gap-1`}>
                      {getStatusIcon(order.status)}
                      {getStatusText(order.status)}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Items de la orden */}
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-sm font-medium mb-2">Items:</div>
                      {order.order_items?.map((item, index) => (
                        <div key={index} className="text-sm">
                          {item.quantity}x {item.products?.name}
                        </div>
                      ))}
                    </div>

                    {/* Información adicional */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Total:</span> ${order.total?.toFixed(2)}
                      </div>
                      <div>
                        <span className="font-medium">Vendedor:</span> {order.users?.name}
                      </div>
                    </div>

                    <div className="text-xs text-gray-500">
                      Creada: {new Date(order.created_at).toLocaleString()}
                    </div>

                    {/* Acciones */}
                    <div className="flex gap-2 pt-2">
                      {order.status === 'pendiente' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus.mutate({
                            orderId: order.id,
                            status: 'en_preparacion'
                          })}
                          className="bg-yellow-500 hover:bg-yellow-600"
                        >
                          Iniciar
                        </Button>
                      )}
                      
                      {order.status === 'lista' && (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus.mutate({
                            orderId: order.id,
                            status: 'entregada'
                          })}
                          className="bg-green-500 hover:bg-green-600"
                        >
                          Entregar
                        </Button>
                      )}

                      <Button variant="outline" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Orders;
