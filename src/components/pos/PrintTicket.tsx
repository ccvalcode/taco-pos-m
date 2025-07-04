import { forwardRef } from "react";
import { Separator } from "@/components/ui/separator";

interface PrintTicketProps {
  orderData: {
    orderNumber: string;
    items: any[];
    total: number;
    tax: number;
    subtotal: number;
    paymentMethod: string;
    orderType: "mesa" | "para_llevar";
    tableNumber?: number | null;
    customerName?: string;
    date: string;
  };
}

const PrintTicket = forwardRef<HTMLDivElement, PrintTicketProps>(({ orderData }, ref) => {
  return (
    <div ref={ref} className="max-w-sm mx-auto p-4 bg-white text-black text-sm font-mono print:text-xs">
      {/* Header */}
      <div className="text-center mb-4">
        <h1 className="text-lg font-bold">🌮 TAQUERÍA EL SABROSO</h1>
        <p className="text-xs">Sistema POS</p>
        <p className="text-xs">Tel: (555) 123-4567</p>
        <Separator className="my-2" />
      </div>

      {/* Order Info */}
      <div className="mb-3">
        <div className="flex justify-between">
          <span>Orden:</span>
          <span className="font-bold">{orderData.orderNumber}</span>
        </div>
        <div className="flex justify-between">
          <span>Fecha:</span>
          <span>{orderData.date}</span>
        </div>
        <div className="flex justify-between">
          <span>Tipo:</span>
          <span>{orderData.orderType === "mesa" ? "Para Mesa" : "Para Llevar"}</span>
        </div>
        {orderData.orderType === "mesa" && orderData.tableNumber && (
          <div className="flex justify-between">
            <span>Mesa:</span>
            <span>{orderData.tableNumber}</span>
          </div>
        )}
        {orderData.customerName && (
          <div className="flex justify-between">
            <span>Cliente:</span>
            <span>{orderData.customerName}</span>
          </div>
        )}
      </div>

      <Separator className="my-2" />

      {/* Items */}
      <div className="mb-3">
        <div className="font-bold mb-2">PRODUCTOS</div>
        {orderData.items.map((item, index) => (
          <div key={index} className="mb-2">
            <div className="flex justify-between">
              <span className="flex-1">{item.product.name}</span>
              <span className="mx-2">x{item.quantity}</span>
              <span>${item.total.toFixed(2)}</span>
            </div>
            {item.modifiers && item.modifiers.length > 0 && (
              <div className="ml-2 text-xs text-gray-600">
                {item.modifiers.map((mod: any, modIndex: number) => (
                  <div key={modIndex}>
                    + {mod.name} {mod.price > 0 && `$${mod.price.toFixed(2)}`}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <Separator className="my-2" />

      {/* Totals */}
      <div className="mb-3">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>${orderData.subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>IVA (16%):</span>
          <span>${orderData.tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-bold text-lg">
          <span>TOTAL:</span>
          <span>${orderData.total.toFixed(2)}</span>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Payment */}
      <div className="mb-3">
        <div className="flex justify-between">
          <span>Método de Pago:</span>
          <span className="capitalize">{orderData.paymentMethod}</span>
        </div>
      </div>

      <Separator className="my-2" />

      {/* Footer */}
      <div className="text-center text-xs mt-4">
        <p>¡GRACIAS POR SU PREFERENCIA!</p>
        <p>Conserve su ticket</p>
        <p className="mt-2">www.taqueria-elsabroso.com</p>
      </div>
    </div>
  );
});

PrintTicket.displayName = "PrintTicket";

export default PrintTicket;