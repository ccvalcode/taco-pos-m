
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { CreditCard, DollarSign, Smartphone, Receipt, Loader2, Printer } from "lucide-react";
import { useReactToPrint } from "react-to-print";
import PrintTicket from "./PrintTicket";

interface OrderSummaryProps {
  items: any[];
  total: number;
  orderType: "mesa" | "para_llevar";
  tableNumber?: number | null;
  onProcessOrder: (paymentMethod: string) => void;
  isProcessing?: boolean;
  lastOrderNumber?: string;
}

const OrderSummary = ({ 
  items, 
  total, 
  orderType, 
  tableNumber, 
  onProcessOrder,
  isProcessing = false,
  lastOrderNumber
}: OrderSummaryProps) => {
  const [paymentMethod, setPaymentMethod] = useState<"efectivo" | "tarjeta" | "transferencia">("efectivo");
  const printRef = useRef<HTMLDivElement>(null);
  
  const tax = total * 0.16; // IVA 16%
  const finalTotal = total + tax;
  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const paymentMethods = [
    { value: "efectivo", label: "Efectivo", icon: DollarSign, color: "green" },
    { value: "tarjeta", label: "Tarjeta", icon: CreditCard, color: "blue" },
    { value: "transferencia", label: "Transferencia", icon: Smartphone, color: "purple" }
  ];

  const handleProcessOrder = () => {
    onProcessOrder(paymentMethod);
  };

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `Ticket-${lastOrderNumber || 'orden'}`,
    pageStyle: `
      @page { 
        size: 80mm auto; 
        margin: 0; 
      }
      @media print {
        body { 
          margin: 0;
          font-size: 12px;
        }
      }
    `
  });

  const ticketData = lastOrderNumber ? {
    orderNumber: lastOrderNumber,
    items: items,
    total: finalTotal,
    tax: tax,
    subtotal: total,
    paymentMethod: paymentMethod,
    orderType: orderType,
    tableNumber: tableNumber,
    date: new Date().toLocaleString()
  } : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Receipt className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">Resumen de Orden</h3>
      </div>

      {/* Información de la orden */}
      <Card className="p-3 bg-blue-50 border-blue-200">
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="font-medium">Tipo:</span>
            <Badge variant={orderType === "mesa" ? "default" : "secondary"}>
              {orderType === "mesa" ? "🍽️ Para Mesa" : "🥡 Para Llevar"}
            </Badge>
          </div>
          
          {orderType === "mesa" && tableNumber && (
            <div className="flex justify-between items-center">
              <span className="font-medium">Mesa:</span>
              <Badge variant="outline">Mesa {tableNumber}</Badge>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="font-medium">Artículos:</span>
            <Badge variant="secondary">{itemsCount}</Badge>
          </div>
        </div>
      </Card>

      {/* Desglose de precios */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA (16%):</span>
          <span>${tax.toFixed(2)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg font-bold">
          <span>Total:</span>
          <span className="text-green-600">${finalTotal.toFixed(2)}</span>
        </div>
      </div>

      <Separator />

      {/* Método de pago */}
      <div>
        <Label className="text-base font-semibold mb-3 block">
          💳 Método de Pago
        </Label>
        <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
          {paymentMethods.map((method) => (
            <div key={method.value} className="flex items-center space-x-2">
              <RadioGroupItem value={method.value} id={method.value} />
              <Label htmlFor={method.value} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <method.icon className={`w-4 h-4 text-${method.color}-600`} />
                  <span>{method.label}</span>
                </div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Botones de acción */}
      <div className="space-y-2">
        <Button 
          onClick={handleProcessOrder}
          className="w-full bg-green-600 hover:bg-green-700 text-white py-3 text-lg font-semibold"
          disabled={(orderType === "mesa" && !tableNumber) || isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Procesando...
            </>
          ) : (
            orderType === "mesa" ? "Enviar a Cocina" : "Procesar Orden"
          )}
        </Button>
        
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="text-sm" disabled={isProcessing}>
            Guardar Borrador
          </Button>
          <Button 
            variant="outline" 
            className="text-sm" 
            disabled={!lastOrderNumber}
            onClick={handlePrint}
          >
            <Printer className="w-3 h-3 mr-1" />
            Imprimir Ticket
          </Button>
        </div>
      </div>

      {/* Advertencias */}
      {orderType === "mesa" && !tableNumber && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
          <p className="text-sm text-yellow-800">
            ⚠️ Selecciona una mesa para continuar
          </p>
        </div>
      )}

      {/* Componente de impresión oculto */}
      <div className="hidden">
        {ticketData && <PrintTicket ref={printRef} orderData={ticketData} />}
      </div>
    </div>
  );
};

export default OrderSummary;
