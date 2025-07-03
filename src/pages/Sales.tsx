
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Search, Download, Eye, DollarSign, CreditCard, Smartphone } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Navigation from "@/components/Navigation";
import FloatingNavigation from "@/components/FloatingNavigation";

const Sales = () => {
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [paymentMethod, setPaymentMethod] = useState<'all' | 'efectivo' | 'tarjeta' | 'transferencia'>('all');
  const [orderType, setOrderType] = useState<'all' | 'mesa' | 'para_llevar'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Obtener órdenes con filtros
  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales-orders', dateFrom, dateTo, paymentMethod, orderType, searchTerm],
    queryFn: async () => {
      let query = supabase
        .from('orders')
        .select(`
          *,
          tables (number, name),
          users (name),
          order_items (
            *,
            products (name, price)
          )
        `)
        .in('status', ['pagada', 'entregada'])
        .gte('created_at', `${dateFrom} 00:00:00`)
        .lte('created_at', `${dateTo} 23:59:59`)
        .order('created_at', { ascending: false });

      if (paymentMethod !== 'all') {
        query = query.eq('payment_method', paymentMethod);
      }

      if (orderType !== 'all') {
        query = query.eq('type', orderType);
      }

      if (searchTerm) {
        query = query.ilike('order_number', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'efectivo':
        return <DollarSign className="w-4 h-4" />;
      case 'tarjeta':
        return <CreditCard className="w-4 h-4" />;
      case 'transferencia':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pagada':
        return 'bg-green-500';
      case 'entregada':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTotalSales = () => {
    return orders?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;
  };

  const exportToCSV = () => {
    if (!orders || orders.length === 0) return;

    const csvData = orders.map(order => ({
      'Número de Orden': order.order_number,
      'Fecha': format(new Date(order.created_at), 'dd/MM/yyyy HH:mm'),
      'Tipo': order.type === 'mesa' ? `Mesa ${order.tables?.number || 'N/A'}` : 'Para Llevar',
      'Estado': order.status,
      'Método de Pago': order.payment_method,
      'Subtotal': order.subtotal,
      'Impuestos': order.tax,
      'Total': order.total,
      'Vendedor': order.users?.name || 'N/A'
    }));

    const csvString = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventas-${dateFrom}-${dateTo}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Calendar className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">📊 Ventas Realizadas</h1>
              <p className="text-orange-100">Taquería El Sabroso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Filtros */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5" />
              Filtros de Búsqueda
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Fecha Desde</label>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Fecha Hasta</label>
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Método de Pago</label>
                <Select value={paymentMethod} onValueChange={(value: 'all' | 'efectivo' | 'tarjeta' | 'transferencia') => setPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="efectivo">Efectivo</SelectItem>
                    <SelectItem value="tarjeta">Tarjeta</SelectItem>
                    <SelectItem value="transferencia">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Orden</label>
                <Select value={orderType} onValueChange={(value: 'all' | 'mesa' | 'para_llevar') => setOrderType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="mesa">Mesa</SelectItem>
                    <SelectItem value="para_llevar">Para Llevar</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Buscar Orden</label>
                <Input
                  placeholder="Número de orden..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumen */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4 bg-green-50 border-green-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-green-600" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  ${getTotalSales().toFixed(2)}
                </div>
                <div className="text-sm text-green-700">Total en Ventas</div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 bg-blue-50 border-blue-200">
            <div className="flex items-center gap-3">
              <Calendar className="w-8 h-8 text-blue-600" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {orders?.length || 0}
                </div>
                <div className="text-sm text-blue-700">Órdenes Completadas</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-purple-50 border-purple-200">
            <div className="flex items-center gap-3">
              <CreditCard className="w-8 h-8 text-purple-600" />
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  ${(orders?.filter(o => o.payment_method === 'tarjeta').reduce((sum, o) => sum + (o.total || 0), 0) || 0).toFixed(2)}
                </div>
                <div className="text-sm text-purple-700">Ventas con Tarjeta</div>
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-yellow-50 border-yellow-200">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-yellow-600" />
              <div>
                <div className="text-2xl font-bold text-yellow-600">
                  ${(orders?.filter(o => o.payment_method === 'efectivo').reduce((sum, o) => sum + (o.total || 0), 0) || 0).toFixed(2)}
                </div>
                <div className="text-sm text-yellow-700">Ventas en Efectivo</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tabla de órdenes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Lista de Ventas</CardTitle>
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Cargando ventas...</div>
            ) : !orders || orders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No se encontraron ventas con los filtros seleccionados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Orden</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Método Pago</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        {order.order_number}
                      </TableCell>
                      <TableCell>
                        {format(new Date(order.created_at), 'dd/MM/yyyy HH:mm', { locale: es })}
                      </TableCell>
                      <TableCell>
                        {order.type === 'mesa' ? `Mesa ${order.tables?.number || 'N/A'}` : 'Para Llevar'}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getStatusColor(order.status)} text-white`}>
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getPaymentMethodIcon(order.payment_method)}
                          <span className="capitalize">{order.payment_method}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-bold">
                        ${order.total?.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {order.users?.name || 'N/A'}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      
      <FloatingNavigation />
    </div>
  );
};

export default Sales;
