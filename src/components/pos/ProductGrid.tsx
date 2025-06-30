
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Settings } from "lucide-react";
import ProductCustomization from "./ProductCustomization";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_customizable: boolean;
  categories?: {
    name: string;
    color: string;
  };
}

interface ProductGridProps {
  products: Product[];
  onAddToCart: (product: Product, modifiers?: any[]) => void;
}

const ProductGrid = ({ products, onAddToCart }: ProductGridProps) => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showCustomization, setShowCustomization] = useState(false);

  const handleProductClick = (product: Product) => {
    if (product.is_customizable) {
      setSelectedProduct(product);
      setShowCustomization(true);
    } else {
      onAddToCart(product);
    }
  };

  const handleCustomizationComplete = (product: Product, modifiers: any[]) => {
    onAddToCart(product, modifiers);
    setShowCustomization(false);
    setSelectedProduct(null);
  };

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((product) => (
          <Card 
            key={product.id}
            className="group hover:shadow-lg transition-all duration-200 cursor-pointer border-2 hover:border-red-300"
            onClick={() => handleProductClick(product)}
          >
            <div className="p-4">
              {/* Imagen del producto */}
              <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 rounded-lg mb-3 flex items-center justify-center text-4xl">
                {product.image_url ? (
                  <img 
                    src={product.image_url} 
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span>🌮</span>
                )}
              </div>

              {/* Información del producto */}
              <div className="space-y-2">
                <div className="flex justify-between items-start">
                  <h3 className="font-semibold text-gray-800 line-clamp-2">
                    {product.name}
                  </h3>
                  {product.is_customizable && (
                    <Settings className="w-4 h-4 text-gray-400 flex-shrink-0" />
                  )}
                </div>
                
                <p className="text-sm text-gray-600 line-clamp-2">
                  {product.description}
                </p>
                
                <div className="flex justify-between items-center">
                  <div className="text-lg font-bold text-red-600">
                    ${product.price.toFixed(2)}
                  </div>
                  <Button 
                    size="sm" 
                    className="bg-red-500 hover:bg-red-600 group-hover:scale-105 transition-transform"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProductClick(product);
                    }}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {product.categories && (
                  <Badge 
                    variant="secondary" 
                    className="text-xs"
                    style={{ backgroundColor: `${product.categories.color}20`, color: product.categories.color }}
                  >
                    {product.categories.name}
                  </Badge>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Modal de personalización */}
      {showCustomization && selectedProduct && (
        <ProductCustomization
          product={selectedProduct}
          isOpen={showCustomization}
          onClose={() => {
            setShowCustomization(false);
            setSelectedProduct(null);
          }}
          onConfirm={handleCustomizationComplete}
        />
      )}
    </>
  );
};

export default ProductGrid;
