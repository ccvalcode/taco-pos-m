
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItem {
  id: number;
  product: {
    name: string;
    price: number;
  };
  modifiers: Array<{
    name: string;
    price: number;
  }>;
  quantity: number;
  total: number;
}

interface CartProps {
  items: CartItem[];
  onUpdateItem: (id: number, quantity: number) => void;
}

const Cart = ({ items, onUpdateItem }: CartProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-2">🛒</div>
        <p>El carrito está vacío</p>
        <p className="text-sm">Selecciona productos del menú</p>
      </div>
    );
  }

  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {items.map((item) => (
        <div key={item.id} className="bg-gray-50 rounded-lg p-3">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h4 className="font-medium text-gray-800">{item.product.name}</h4>
              <div className="text-sm text-gray-600">
                ${item.product.price.toFixed(2)} c/u
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateItem(item.id, 0)}
              className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Modificadores */}
          {item.modifiers.length > 0 && (
            <div className="space-y-1 mb-2">
              {item.modifiers.map((modifier, index) => (
                <div key={index} className="flex justify-between text-xs text-gray-600">
                  <span>+ {modifier.name}</span>
                  {modifier.price > 0 && (
                    <span>+${modifier.price.toFixed(2)}</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <Separator className="my-2" />

          {/* Controles de cantidad */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateItem(item.id, item.quantity - 1)}
                className="h-8 w-8 p-0"
              >
                <Minus className="w-4 h-4" />
              </Button>
              <Badge variant="secondary" className="px-3 py-1">
                {item.quantity}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onUpdateItem(item.id, item.quantity + 1)}
                className="h-8 w-8 p-0"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="font-bold text-red-600">
              ${item.total.toFixed(2)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Cart;
