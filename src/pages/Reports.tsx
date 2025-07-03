
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, BarChart3, TrendingUp, Calendar, Download, DollarSign } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import Navigation from "@/components/Navigation";
import FloatingNavigation from "@/components/FloatingNavigation";

const Reports = () => {
  const [dateFrom, setDateFrom] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [reportType, setReportType] = useState<'sales' | 'products' | 'inventory' | 'users'>('sales');

  // Obtener datos para reportes de ventas
  const { data: salesData } = useQuery({
    queryKey: ['reports-sales', dateFrom, dateTo],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (name),
          order_items (
            *,
            products (name, categories (name))
          )
        `)
        .in('status', ['pagada', 'entregada'])
        .gte('created_at', `${dateFrom} 00:00:00`)
        .lte('created_at', `${dateTo} 23:59:59`);
      
      if (error) throw error;
      return data;
    }
  });

  // Obtener datos de productos
  const { data: productsData } = useQuery({
    queryKey: ['reports-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories (name, color),
          order_items (quantity, created_at)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Calcular métricas de ventas
  const salesMetrics = salesData ? {
    totalSales: salesData.reduce((sum, order) => sum + (order.total || 0), 0),
    totalOrders: salesData.length,
    averageTicket: salesData.length > 0 ? salesData.reduce((sum, order) => sum + (order.total || 0), 0) / salesData.length : 0,
    byPaymentMethod: salesData.reduce((acc, order) => {
      const method = order.payment_method || 'unknown';
      acc[method] = (acc[method] || 0) + (order.total || 0);
      return acc;
    }, {} as Record<string, number>),
    byUser: salesData.reduce((acc, order) => {
      const user = order.users?.name || 'Desconocido';
      acc[user] = (acc[user] || 0) + (order.total || 0);
      return acc;
    }, {} as Record<string, number>),
    dailySales: salesData.reduce((acc, order) => {
      const date = format(new Date(order.created_at), 'yyyy-MM-dd');
      acc[date] = (acc[date] || 0) + (order.total || 0);
      return acc;
    }, {} as Record<string, number>)
  } : null;

  // Calcular productos más vendidos
  const topProducts = salesData ? 
    salesData.flatMap(order => order.order_items || [])
      .reduce((acc, item) => {
        const productName = item.products?.name || 'Desconocido';
        acc[productName] = (acc[productName] || 0) + (item.quantity || 0);
        return acc;
      }, {} as Record<string, number>) : null;

  const exportReport = () => {
    if (!salesData) return;

    const reportData = {
      periodo: `${dateFrom} al ${dateTo}`,
      metricas: salesMetrics,
      ordenes: salesData.length,
      fecha_generacion: new Date().toISOString()
    };

    const dataStr = JSON.stringify(reportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = window.URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte-${reportType}-${dateFrom}-${dateTo}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-50">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <PieChart className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">📊 Reportes y Análisis</h1>
              <p className="text-pink-100">Taquería El Sabroso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Controles */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Configuración de Reporte</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Reporte</label>
                <Select value={reportType} onValueChange={(value: any) => setReportType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales">Ventas</SelectItem>
                    <SelectItem value="products">Productos</SelectItem>
                    <SelectItem value="inventory">Inventario</SelectItem>
                    <SelectItem value="users">Usuarios</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
              <div className="flex items-end">
                <Button onClick={exportReport} className="w-full">
                  <Download className="w-4 h-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reporte de Ventas */}
        {reportType === 'sales' && salesMetrics && (
          <>
            {/* Métricas principales */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Card className="p-4 bg-green-50 border-green-200">
                <div className="flex items-center gap-3">
                  <DollarSign className="w-8 h-8 text-green-600" />
                  <div>
                    <div className="text-2xl font-bold text-green-600">
                      ${salesMetrics.totalSales.toFixed(2)}
                    </div>
                    <div className="text-sm text-green-700">Ventas Totales</div>
                  </div>
                </div>
              </Card>
              
              <Card className="p-4 bg-blue-50 border-blue-200">
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-8 h-8 text-blue-600" />
                  <div>
                    <div className="text-2xl font-bold text-blue-600">
                      {salesMetrics.totalOrders}
                    </div>
                    <div className="text-sm text-blue-700">Órdenes Totales</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-purple-50 border-purple-200">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-purple-600" />
                  <div>
                    <div className="text-2xl font-bold text-purple-600">
                      ${salesMetrics.averageTicket.toFixed(2)}
                    </div>
                    <div className="text-sm text-purple-700">Ticket Promedio</div>
                  </div>
                </div>
              </Card>

              <Card className="p-4 bg-orange-50 border-orange-200">
                <div className="flex items-center gap-3">
                  <Calendar className="w-8 h-8 text-orange-600" />
                  <div>
                    <div className="text-2xl font-bold text-orange-600">
                      {Object.keys(salesMetrics.dailySales).length}
                    </div>
                    <div className="text-sm text-orange-700">Días Activos</div>
                  </div>
                </div>
              </Card>
            </div>

            {/* Ventas por método de pago */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Método de Pago</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(salesMetrics.byPaymentMethod).map(([method, amount]) => (
                      <div key={method} className="flex justify-between items-center">
                        <span className="capitalize font-medium">{method}</span>
                        <span className="font-bold">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Ventas por Usuario</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(salesMetrics.byUser).map(([user, amount]) => (
                      <div key={user} className="flex justify-between items-center">
                        <span className="font-medium">{user}</span>
                        <span className="font-bold">${amount.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Productos más vendidos */}
            {topProducts && (
              <Card>
                <CardHeader>
                  <CardTitle>Productos Más Vendidos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {Object.entries(topProducts)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 10)
                      .map(([product, quantity]) => (
                        <div key={product} className="flex justify-between items-center">
                          <span className="font-medium">{product}</span>
                          <span className="font-bold">{quantity} unidades</span>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Reporte de Productos */}
        {reportType === 'products' && productsData && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumen de Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Total de Productos:</span>
                    <span className="font-bold">{productsData.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Productos Activos:</span>
                    <span className="font-bold">{productsData.filter(p => p.is_active).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Valor Total Inventario:</span>
                    <span className="font-bold">
                      ${productsData.reduce((sum, p) => sum + ((p.stock_quantity || 0) * (p.cost || 0)), 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Productos por Categoría</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(
                    productsData.reduce((acc, product) => {
                      const category = product.categories?.name || 'Sin Categoría';
                      acc[category] = (acc[category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center">
                      <span className="font-medium">{category}</span>
                      <span className="font-bold">{count} productos</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Placeholder para otros tipos de reporte */}
        {(reportType === 'inventory' || reportType === 'users') && (
          <Card>
            <CardContent className="p-8 text-center">
              <PieChart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Reporte en Desarrollo
              </h3>
              <p className="text-gray-500">
                Este tipo de reporte estará disponible próximamente.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
      
      <FloatingNavigation />
    </div>
  );
};

export default Reports;
