
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Calculator, DollarSign, CreditCard, Smartphone, FileText, AlertTriangle } from "lucide-react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const CashCut = () => {
  const { toast } = useToast();
  const [cutType, setCutType] = useState<'corte_x' | 'corte_z'>('corte_x');
  const [cashCounted, setCashCounted] = useState<string>('');
  const [selectedShift, setSelectedShift] = useState<string>('');

  // Obtener turnos activos
  const { data: activeShifts } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          users!shifts_user_id_fkey (name, email)
        `)
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  // Obtener resumen de ventas del turno seleccionado
  const { data: salesSummary, isLoading: salesLoading } = useQuery({
    queryKey: ['sales-summary', selectedShift],
    queryFn: async () => {
      if (!selectedShift) return null;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('*')
        .eq('shift_id', selectedShift)
        .in('status', ['pagada', 'entregada']);

      if (error) throw error;

      const summary = {
        totalSales: 0,
        totalCash: 0,
        totalCard: 0,
        totalTransfer: 0,
        orderCount: orders.length
      };

      orders.forEach(order => {
        summary.totalSales += order.total || 0;
        
        switch (order.payment_method) {
          case 'efectivo':
            summary.totalCash += order.total || 0;
            break;
          case 'tarjeta':
            summary.totalCard += order.total || 0;
            break;
          case 'transferencia':
            summary.totalTransfer += order.total || 0;
            break;
        }
      });

      return summary;
    },
    enabled: !!selectedShift
  });

  // Realizar corte de caja
  const performCashCutMutation = useMutation({
    mutationFn: async () => {
      if (!selectedShift || !salesSummary) {
        throw new Error('Datos incompletos');
      }

      const shift = activeShifts?.find(s => s.id === selectedShift);
      if (!shift) throw new Error('Turno no encontrado');

      const cashCountedValue = parseFloat(cashCounted) || 0;
      const expectedCash = (shift.initial_cash || 0) + salesSummary.totalCash;
      const difference = cashCountedValue - expectedCash;

      const { error } = await supabase
        .from('cash_cuts')
        .insert({
          shift_id: selectedShift,
          user_id: shift.user_id,
          type: cutType,
          total_sales: salesSummary.totalSales,
          total_cash: salesSummary.totalCash,
          total_card: salesSummary.totalCard,
          total_transfer: salesSummary.totalTransfer,
          cash_counted: cashCountedValue,
          difference: difference
        });

      if (error) throw error;

      // Si es corte Z, cerrar el turno
      if (cutType === 'corte_z') {
        const { error: shiftError } = await supabase
          .from('shifts')
          .update({
            closed_at: new Date().toISOString(),
            final_cash: cashCountedValue,
            is_active: false
          })
          .eq('id', selectedShift);

        if (shiftError) throw shiftError;
      }

      return { difference, expectedCash, cashCountedValue };
    },
    onSuccess: (data) => {
      toast({
        title: "Corte de caja realizado",
        description: `Corte ${cutType.toUpperCase()} completado. Diferencia: $${data.difference.toFixed(2)}`
      });
      setCashCounted('');
      setSelectedShift('');
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo realizar el corte de caja.",
        variant: "destructive"
      });
    }
  });

  const selectedShiftData = activeShifts?.find(s => s.id === selectedShift);
  const expectedCash = selectedShiftData && salesSummary 
    ? (selectedShiftData.initial_cash || 0) + salesSummary.totalCash
    : 0;
  const cashCountedValue = parseFloat(cashCounted) || 0;
  const difference = cashCountedValue - expectedCash;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <Calculator className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">💰 Corte de Caja</h1>
              <p className="text-green-100">Taquería El Sabroso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Panel de Control */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Realizar Corte de Caja
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Tipo de Corte */}
              <div>
                <label className="block text-sm font-medium mb-2">Tipo de Corte</label>
                <div className="flex gap-2">
                  <Button
                    variant={cutType === 'corte_x' ? 'default' : 'outline'}
                    onClick={() => setCutType('corte_x')}
                    className="flex-1"
                  >
                    Corte X (Parcial)
                  </Button>
                  <Button
                    variant={cutType === 'corte_z' ? 'default' : 'outline'}
                    onClick={() => setCutType('corte_z')}
                    className="flex-1"
                  >
                    Corte Z (Final)
                  </Button>
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  {cutType === 'corte_x' 
                    ? 'Reporte parcial sin cerrar turno' 
                    : 'Reporte final que cierra el turno'
                  }
                </p>
              </div>

              {/* Selección de Turno */}
              <div>
                <label className="block text-sm font-medium mb-2">Turno a Cortar</label>
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  disabled={!activeShifts || activeShifts.length === 0}
                >
                  <option value="">Seleccionar turno...</option>
                  {activeShifts?.map((shift) => (
                    <option key={shift.id} value={shift.id}>
                      {shift.users?.name} - Iniciado: {new Date(shift.opened_at).toLocaleTimeString()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Efectivo Contado */}
              <div>
                <label className="block text-sm font-medium mb-2">Efectivo Contado Manualmente</label>
                <Input
                  type="number"
                  step="0.01"
                  value={cashCounted}
                  onChange={(e) => setCashCounted(e.target.value)}
                  placeholder="0.00"
                  className="text-lg font-mono"
                />
              </div>

              {/* Diferencias */}
              {selectedShift && salesSummary && cashCounted && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Análisis de Diferencias</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Efectivo esperado:</span>
                      <span className="font-mono">${expectedCash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Efectivo contado:</span>
                      <span className="font-mono">${cashCountedValue.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className={`flex justify-between font-bold ${
                      difference === 0 ? 'text-green-600' : 
                      difference > 0 ? 'text-blue-600' : 'text-red-600'
                    }`}>
                      <span>Diferencia:</span>
                      <span className="font-mono">
                        {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  
                  {Math.abs(difference) > 10 && (
                    <div className="mt-3 p-2 bg-yellow-100 border border-yellow-300 rounded flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm text-yellow-800">
                        Diferencia significativa detectada
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Botón de Corte */}
              <Button
                onClick={() => performCashCutMutation.mutate()}
                disabled={!selectedShift || !cashCounted || performCashCutMutation.isPending}
                className="w-full"
                size="lg"
              >
                <FileText className="w-4 h-4 mr-2" />
                Realizar {cutType === 'corte_x' ? 'Corte X' : 'Corte Z'}
              </Button>
            </CardContent>
          </Card>

          {/* Resumen de Ventas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Resumen del Turno
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedShift ? (
                <div className="text-center py-8 text-gray-500">
                  Selecciona un turno para ver el resumen
                </div>
              ) : salesLoading ? (
                <div className="text-center py-8">Cargando resumen...</div>
              ) : salesSummary ? (
                <div className="space-y-4">
                  {/* Información del Turno */}
                  {selectedShiftData && (
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <h4 className="font-medium mb-2">Información del Turno</h4>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Usuario:</span>
                          <span>{selectedShiftData.users?.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Inicio:</span>
                          <span>{new Date(selectedShiftData.opened_at).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Efectivo inicial:</span>
                          <span>${selectedShiftData.initial_cash?.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Totales por Método de Pago */}
                  <div className="grid grid-cols-3 gap-3">
                    <Card className="p-3 bg-green-50 border-green-200">
                      <div className="flex items-center gap-2 mb-1">
                        <DollarSign className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium">Efectivo</span>
                      </div>
                      <div className="text-lg font-bold text-green-600">
                        ${salesSummary.totalCash.toFixed(2)}
                      </div>
                    </Card>

                    <Card className="p-3 bg-blue-50 border-blue-200">
                      <div className="flex items-center gap-2 mb-1">
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium">Tarjeta</span>
                      </div>
                      <div className="text-lg font-bold text-blue-600">
                        ${salesSummary.totalCard.toFixed(2)}
                      </div>
                    </Card>

                    <Card className="p-3 bg-purple-50 border-purple-200">
                      <div className="flex items-center gap-2 mb-1">
                        <Smartphone className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium">Transfer.</span>
                      </div>
                      <div className="text-lg font-bold text-purple-600">
                        ${salesSummary.totalTransfer.toFixed(2)}
                      </div>
                    </Card>
                  </div>

                  {/* Resumen Total */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Total de órdenes:</span>
                        <span className="font-bold">{salesSummary.orderCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total en ventas:</span>
                        <span className="font-bold">${salesSummary.totalSales.toFixed(2)}</span>
                      </div>
                      <Separator />
                      <div className="flex justify-between text-lg font-bold">
                        <span>Efectivo esperado:</span>
                        <span>${expectedCash.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay datos de ventas para este turno
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CashCut;
