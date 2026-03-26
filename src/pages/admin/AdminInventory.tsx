import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Search, Package, AlertTriangle, Upload, ImageIcon, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function AdminInventory() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    product_id: "",
    product_name: "",
    category: "",
    stock: "",
    min_stock: "5",
    unit_price: "",
    location: "",
    image_url: "",
  });
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data } = await supabase.from("inventory").select("*").order("product_name");
    setItems(data ?? []);
  };

  useEffect(() => { fetchItems(); }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({ product_id: "", product_name: "", category: "", stock: "", min_stock: "5", unit_price: "", location: "", image_url: "" });
    setImageFile(null);
    setImagePreview(null);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      product_id: item.product_id,
      product_name: item.product_name,
      category: item.category ?? "",
      stock: String(item.stock),
      min_stock: String(item.min_stock),
      unit_price: String(item.unit_price),
      location: item.location ?? "",
      image_url: item.image_url ?? "",
    });
    setImageFile(null);
    setImagePreview(item.image_url ?? null);
    setDialogOpen(true);
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setForm({ ...form, image_url: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageFile) return form.image_url || null;
    setUploading(true);
    const ext = imageFile.name.split(".").pop();
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
    setUploading(false);
    if (error) {
      toast({ title: "Error al subir imagen", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveItem = async () => {
    const imageUrl = await uploadImage();
    const payload: any = {
      product_id: form.product_id,
      product_name: form.product_name,
      category: form.category || null,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      unit_price: parseFloat(form.unit_price) || 0,
      location: form.location || null,
      image_url: imageUrl || null,
    };

    if (editItem) {
      const { error } = await supabase.from("inventory").update(payload).eq("id", editItem.id);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Producto actualizado" });
    } else {
      const { error } = await supabase.from("inventory").insert(payload);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Producto agregado" });
    }
    setDialogOpen(false);
    fetchItems();
  };

  const filtered = items.filter(
    (i) =>
      i.product_name.toLowerCase().includes(search.toLowerCase()) ||
      i.product_id.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew}><Plus className="w-4 h-4 mr-2" />Agregar Producto</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editItem ? "Editar Producto" : "Agregar Producto"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Producto</Label>
                <Input value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} placeholder="ext-1" />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Extintores" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="Extintor PQS 6kg" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Stock Mín.</Label>
                <Input type="number" value={form.min_stock} onChange={(e) => setForm({ ...form, min_stock: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Precio Unit.</Label>
                <Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Ubicación</Label>
              <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Almacén A" />
            </div>
            {/* Image upload */}
            <div className="space-y-2">
              <Label>Foto del producto</Label>
              <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageSelect} className="hidden" />
              {imagePreview ? (
                <div className="relative w-full h-40 rounded-lg overflow-hidden border border-border bg-muted">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-contain" />
                  <Button variant="destructive" size="icon" className="absolute top-2 right-2 w-7 h-7" onClick={removeImage}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full h-24 border-dashed flex flex-col gap-1" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Seleccionar imagen</span>
                </Button>
              )}
            </div>
            <Button onClick={saveItem} className="w-full" disabled={uploading}>{uploading ? "Subiendo..." : editItem ? "Guardar Cambios" : "Agregar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Card className="border-border">
        <CardHeader><CardTitle className="text-foreground flex items-center gap-2"><Package className="w-5 h-5" />Inventario ({filtered.length})</CardTitle></CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-8">No hay productos en inventario</p>
          ) : (
            <div className="space-y-2">
              {filtered.map((item) => {
                const isLow = item.stock <= item.min_stock;
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg bg-muted/50 gap-3 cursor-pointer hover:bg-muted/80 transition-colors"
                    onClick={() => openEdit(item)}
                  >
                    <div className="flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-10 h-10 rounded object-cover border border-border flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded bg-muted flex items-center justify-center flex-shrink-0">
                          <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                      )}
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-foreground text-sm">{item.product_name}</p>
                          {isLow && (
                            <Badge variant="destructive" className="text-[10px] gap-1">
                              <AlertTriangle className="w-3 h-3" />Stock bajo
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{item.category} · {item.product_id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className={`font-bold ${isLow ? "text-destructive" : "text-foreground"}`}>{item.stock}</p>
                        <p className="text-[10px] text-muted-foreground">Stock</p>
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-foreground">${Number(item.unit_price).toLocaleString("es-MX")}</p>
                        <p className="text-[10px] text-muted-foreground">Precio</p>
                      </div>
                      {item.location && (
                        <div className="text-center">
                          <p className="font-medium text-foreground">{item.location}</p>
                          <p className="text-[10px] text-muted-foreground">Ubicación</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
