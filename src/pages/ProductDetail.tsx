import { useParams } from "react-router-dom";
import { getProductById } from "@/data/products";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ShoppingCart, Truck, Wrench } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";

const ProductDetail = () => {
  const { id } = useParams();
  const product = getProductById(id || "");
  const [date, setDate] = useState<Date>();
  const [serviceType, setServiceType] = useState<"delivery" | "maintenance">("delivery");

  if (!product) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <h1 className="text-2xl font-bold">Producto no encontrado</h1>
      </div>
    );
  }

  const handleAddToCart = () => {
    toast.success("Producto agregado al carrito");
  };

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Main Content (Images & Description) */}
          <div className="flex-1 space-y-8">
            {/* Gallery */}
            <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-muted/30 md:aspect-[16/9] lg:aspect-[4/3]">
              <img
                src={product.image || "/placeholder.svg"}
                alt={product.name}
                className="h-full w-full object-contain p-8 mix-blend-multiply"
              />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold tracking-tight">Descripción del producto</h2>
              <div className="prose prose-sm dark:prose-invert sm:prose-base max-w-none">
                <p className="whitespace-pre-wrap leading-relaxed text-muted-foreground">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Sticky Widget (Booking/Cart) Airbnb style */}
          <div className="w-full lg:w-[400px]">
            <div className="sticky top-24 rounded-2xl border border-border/50 bg-card p-6 shadow-xl">
              <div className="mb-6 space-y-2">
                <div className="text-sm font-medium text-primary uppercase tracking-wider">
                  {product.category}
                </div>
                <h1 className="text-2xl font-bold text-card-foreground">
                  {product.name}
                </h1>
                <div className="text-3xl font-extrabold">
                  ${product.priceOriginalMxn.toFixed(2)} <span className="text-base font-normal text-muted-foreground">MXN</span>
                </div>
              </div>

              <div className="mb-6 space-y-4 rounded-xl border border-border bg-muted/10 p-4">
                <div className="font-medium">Agendar servicio</div>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={serviceType === "delivery" ? "default" : "outline"}
                    className="w-full justify-start text-xs"
                    onClick={() => setServiceType("delivery")}
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Entrega
                  </Button>
                  <Button
                    variant={serviceType === "maintenance" ? "default" : "outline"}
                    className="w-full justify-start text-xs"
                    onClick={() => setServiceType("maintenance")}
                  >
                    <Wrench className="mr-2 h-4 w-4" />
                    Mantenimiento
                  </Button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-muted-foreground">
                    Fecha programada
                  </label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : "Selecciona una fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                        className="p-3 pointer-events-auto"
                        disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <Button size="lg" className="w-full text-base" onClick={handleAddToCart}>
                <ShoppingCart className="mr-2 h-5 w-5" />
                Agregar al carrito
              </Button>
              
              {product.purchaseUrl && (
                <div className="mt-4 text-center">
                  <a 
                    href={product.purchaseUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Comprar ahora via Stripe
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
