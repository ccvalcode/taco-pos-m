
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
}

interface Modifier {
  id: string;
  name: string;
  type: string;
  price: number;
}

interface ProductCustomizationProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (product: Product, modifiers: Modifier[]) => void;
}

const ProductCustomization = ({ product, isOpen, onClose, onConfirm }: ProductCustomizationProps) => {
  const [selectedModifiers, setSelectedModifiers] = useState<Modifier[]>([]);
  const [tortillaType, setTortillaType] = useState<string>("");
  const [spiceLevel, setSpiceLevel] = useState<string>("");

  // Obtener modificadores
  const { data: modifiers } = useQuery({
    queryKey: ['modifiers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('modifiers')
        .select('*')
        .eq('is_active', true);
      
      if (error) throw error;
      return data;
    }
  });

  const tortillaOptions = modifiers?.filter(m => m.type === 'tortilla') || [];
  const spiceOptions = modifiers?.filter(m => m.type === 'picante') || [];
  const extraOptions = modifiers?.filter(m => m.type === 'extra') || [];

  const calculateTotal = () => {
    const modifiersTotal = selectedModifiers.reduce((sum, mod) => sum + (mod.price || 0), 0);
    const tortillaPrice = tortillaOptions.find(t => t.id === tortillaType)?.price || 0;
    const spicePrice = spiceOptions.find(s => s.id === spiceLevel)?.price || 0;
    
    return product.price + modifiersTotal + tortillaPrice + spicePrice;
  };

  const handleExtraToggle = (modifier: Modifier, checked: boolean) => {
    if (checked) {
      setSelectedModifiers([...selectedModifiers, modifier]);
    } else {
      setSelectedModifiers(selectedModifiers.filter(m => m.id !== modifier.id));
    }
  };

  const handleConfirm = () => {
    const allModifiers = [];
    
    // Agregar tipo de tortilla
    const selectedTortilla = tortillaOptions.find(t => t.id === tortillaType);
    if (selectedTortilla) allModifiers.push(selectedTortilla);
    
    // Agregar nivel de picante
    const selectedSpice = spiceOptions.find(s => s.id === spiceLevel);
    if (selectedSpice) allModifiers.push(selectedSpice);
    
    // Agregar extras
    allModifiers.push(...selectedModifiers);

    onConfirm(product, allModifiers);
  };

  // Establecer valores por defecto
  useEffect(() => {
    if (tortillaOptions.length > 0 && !tortillaType) {
      setTortillaType(tortillaOptions[0].id);
    }
    if (spiceOptions.length > 0 && !spiceLevel) {
      setSpiceLevel(spiceOptions[0].id);
    }
  }, [tortillaOptions, spiceOptions, tortillaType, spiceLevel]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-red-600">
            Personalizar {product.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Precio base */}
          <div className="bg-red-50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-medium">{product.name}</span>
              <span className="font-bold text-red-600">${product.price.toFixed(2)}</span>
            </div>
            <p className="text-sm text-gray-600 mt-1">{product.description}</p>
          </div>

          {/* Tipo de tortilla */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              🫓 Tipo de Tortilla
            </Label>
            <RadioGroup value={tortillaType} onValueChange={setTortillaType}>
              {tortillaOptions.map((tortilla) => (
                <div key={tortilla.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={tortilla.id} id={tortilla.id} />
                  <Label htmlFor={tortilla.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{tortilla.name}</span>
                      {tortilla.price > 0 && (
                        <Badge variant="outline">+${tortilla.price.toFixed(2)}</Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Nivel de picante */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              🌶️ Nivel de Picante
            </Label>
            <RadioGroup value={spiceLevel} onValueChange={setSpiceLevel}>
              {spiceOptions.map((spice) => (
                <div key={spice.id} className="flex items-center space-x-2">
                  <RadioGroupItem value={spice.id} id={spice.id} />
                  <Label htmlFor={spice.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{spice.name}</span>
                      {spice.price > 0 && (
                        <Badge variant="outline">+${spice.price.toFixed(2)}</Badge>
                      )}
                    </div>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Extras */}
          <div>
            <Label className="text-base font-semibold mb-3 block">
              ➕ Ingredientes Extra
            </Label>
            <div className="space-y-2">
              {extraOptions.map((extra) => (
                <div key={extra.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={extra.id}
                    checked={selectedModifiers.some(m => m.id === extra.id)}
                    onCheckedChange={(checked) => handleExtraToggle(extra, checked as boolean)}
                  />
                  <Label htmlFor={extra.id} className="flex-1 cursor-pointer">
                    <div className="flex justify-between items-center">
                      <span>{extra.name}</span>
                      <Badge variant="outline">+${extra.price.toFixed(2)}</Badge>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Total y botones */}
          <div className="space-y-4">
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-lg font-semibold">Total:</span>
                <span className="text-xl font-bold text-green-600">
                  ${calculateTotal().toFixed(2)}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Cancelar
              </Button>
              <Button 
                onClick={handleConfirm} 
                className="flex-1 bg-red-500 hover:bg-red-600"
                disabled={!tortillaType || !spiceLevel}
              >
                Agregar al Carrito
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductCustomization;
