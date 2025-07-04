import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  FileText, 
  Printer, 
  CheckCircle, 
  AlertTriangle,
  Clock,
  User
} from "lucide-react";

interface CashCutPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
  cutData?: {
    type: 'corte_x' | 'corte_z';
    shiftData: any;
    salesSummary: any;
    cashCounted: number;
    expectedCash: number;
    difference: number;
  };
}

const CashCutPreview = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isProcessing,
  cutData 
}: CashCutPreviewProps) => {
  if (!cutData) return null;

  const { type, shiftData, salesSummary, cashCounted, expectedCash, difference } = cutData;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Previsualización de {type === 'corte_x' ? 'Corte X' : 'Corte Z'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Header del Reporte */}
          <Card className="p-4 bg-gradient-to-r from-blue-50 to-green-50">
            <div className="text-center">
              <h2 className="text-xl font-bold">🌮 TAQUERÍA EL SABROSO</h2>
              <p className="text-sm text-gray-600">Sistema de Punto de Venta</p>
              <Badge variant={type === 'corte_z' ? 'destructive' : 'default'} className="mt-2">
                {type === 'corte_x' ? 'CORTE X - PARCIAL' : 'CORTE Z - FINAL'}
              </Badge>
            </div>
          </Card>

          {/* Información del Turno */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Información del Turno
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Usuario:</span>
                  <span className="font-medium">{shiftData.users?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Inicio:</span>
                  <span>{new Date(shiftData.opened_at).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Efectivo inicial:</span>
                  <span>${shiftData.initial_cash?.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Fecha corte:</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total órdenes:</span>
                  <span className="font-medium">{salesSummary.orderCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estado:</span>
                  <Badge variant="outline">
                    {type === 'corte_z' ? 'Turno Cerrado' : 'Turno Activo'}
                  </Badge>
                </div>
              </div>
            </div>
          </Card>

          {/* Resumen de Ventas por Método de Pago */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Resumen de Ventas</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Efectivo</span>
                </div>
                <div className="text-lg font-bold text-green-600">
                  ${salesSummary.totalCash.toFixed(2)}
                </div>
              </div>

              <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Tarjeta</span>
                </div>
                <div className="text-lg font-bold text-blue-600">
                  ${salesSummary.totalCard.toFixed(2)}
                </div>
              </div>

              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200">
                <div className="flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Transferencia</span>
                </div>
                <div className="text-lg font-bold text-purple-600">
                  ${salesSummary.totalTransfer.toFixed(2)}
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex justify-between text-lg font-bold">
                <span>TOTAL EN VENTAS:</span>
                <span>${salesSummary.totalSales.toFixed(2)}</span>
              </div>
            </div>
          </Card>

          {/* Análisis de Efectivo */}
          <Card className="p-4">
            <h3 className="font-semibold mb-3">Análisis de Efectivo</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Efectivo inicial:</span>
                <span className="font-mono">${shiftData.initial_cash?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas en efectivo:</span>
                <span className="font-mono">${salesSummary.totalCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efectivo esperado:</span>
                <span className="font-mono font-bold">${expectedCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Efectivo contado:</span>
                <span className="font-mono font-bold">${cashCounted.toFixed(2)}</span>
              </div>
              <Separator />
              <div className={`flex justify-between font-bold text-lg ${
                difference === 0 ? 'text-green-600' : 
                difference > 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                <span>DIFERENCIA:</span>
                <span className="font-mono">
                  {difference >= 0 ? '+' : ''}${difference.toFixed(2)}
                </span>
              </div>
            </div>
            
            {Math.abs(difference) > 10 && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-800">Diferencia Significativa</p>
                  <p className="text-sm text-yellow-700">
                    Se recomienda revisar el conteo de efectivo
                  </p>
                </div>
              </div>
            )}
          </Card>

          {/* Advertencia para Corte Z */}
          {type === 'corte_z' && (
            <Card className="p-4 bg-red-50 border-red-200">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-5 h-5" />
                <div>
                  <p className="font-medium">¡ATENCIÓN! - Corte Z Final</p>
                  <p className="text-sm">
                    Este corte cerrará el turno de forma permanente. 
                    No podrá deshacerse esta acción.
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handlePrint}
              variant="outline"
              className="flex-1"
            >
              <Printer className="w-4 h-4 mr-2" />
              Imprimir Previsualización
            </Button>
            
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            
            <Button
              onClick={onConfirm}
              className="flex-1 bg-green-600 hover:bg-green-700"
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar {type === 'corte_x' ? 'Corte X' : 'Corte Z'}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CashCutPreview;