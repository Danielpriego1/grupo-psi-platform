import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeTable } from "@/hooks/useRealtimeTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Plus, Search, Package, AlertTriangle, Upload, ImageIcon, X, FileText, Trash2, Loader2, ArrowLeft, ArrowRight, Star, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const SUBCATEGORY_OPTIONS = [
  "EPP-Guantes",
  "EPP-Protección-Pies",
  "EPP-Protección-Cabeza",
  "EPP-Protección-Visual",
  "EPP-Protección-Respiratoria",
  "EPP-Protección-Auditiva",
  "EPP-Protección-Caídas",
  "EPP-Overoles",
  "EPP-Señalización",
  "EPP-General",
  "Extintores-Accesorios",
  "Contra-Incendio",
  "Detección-Emergencia",
  "Primeros-Auxilios",
  "Señalización-Vial",
];

export default function AdminInventory() {
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  type GalleryImg = { url: string; file?: File; uploading?: boolean; error?: string };
  const [images, setImages] = useState<GalleryImg[]>([]);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfName, setPdfName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    product_id: "",
    product_name: "",
    category: "",
    subcategory: "",
    description: "",
    stock: "",
    min_stock: "5",
    unit_price: "",
    location: "",
    spec_pdf_url: "",
  });
  const [deleteConfirm, setDeleteConfirm] = useState<any>(null);
  const { toast } = useToast();

  const fetchItems = async () => {
    const { data } = await supabase.from("inventory").select("*").order("product_name");
    setItems(data ?? []);
  };

  useEffect(() => { fetchItems(); }, []);
  useRealtimeTable({ table: "inventory", onChange: () => fetchItems() });

  const openNew = () => {
    setEditItem(null);
    setForm({ product_id: "", product_name: "", category: "", subcategory: "", description: "", stock: "", min_stock: "5", unit_price: "", location: "", spec_pdf_url: "" });
    setImages([]);
    setPdfFile(null);
    setPdfName(null);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditItem(item);
    setForm({
      product_id: item.product_id,
      product_name: item.product_name,
      category: item.category ?? "",
      subcategory: item.subcategory ?? "",
      description: item.description ?? "",
      stock: String(item.stock),
      min_stock: String(item.min_stock),
      unit_price: String(item.unit_price),
      location: item.location ?? "",
      spec_pdf_url: item.spec_pdf_url ?? "",
    });
    const list: string[] = Array.isArray(item.image_urls) && item.image_urls.length
      ? item.image_urls
      : (item.image_url ? [item.image_url] : []);
    setImages(list.map((url) => ({ url })));
    setPdfFile(null);
    setPdfName(item.spec_pdf_url ? "Ficha técnica cargada" : null);
    setDialogOpen(true);
  };

  // Revoca object URLs creados localmente (no toca URLs remotas https://)
  const revokeLocal = (img: GalleryImg) => {
    if (img.file && img.url.startsWith("blob:")) {
      try { URL.revokeObjectURL(img.url); } catch { /* noop */ }
    }
  };

  // Limpieza al cerrar diálogo
  useEffect(() => {
    if (!dialogOpen) {
      images.forEach(revokeLocal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dialogOpen]);

  // Normaliza una imagen: la encaja (contain) en un lienzo cuadrado 1600x1600 sobre fondo blanco,
  // así todas las fichas del carrusel salen completas, centradas y al mismo tamaño (sin recortes).
  const normalizeImage = (file: File): Promise<File> => new Promise((resolve) => {
    if (!file.type.startsWith("image/")) return resolve(file);
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const SIZE = 1600;
        const canvas = document.createElement("canvas");
        canvas.width = SIZE; canvas.height = SIZE;
        const ctx = canvas.getContext("2d");
        if (!ctx) return resolve(file);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, SIZE, SIZE);
        const ratio = Math.min(SIZE / img.width, SIZE / img.height);
        const w = img.width * ratio;
        const h = img.height * ratio;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, (SIZE - w) / 2, (SIZE - h) / 2, w, h);
        canvas.toBlob((blob) => {
          if (!blob) return resolve(file);
          const newFile = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
          resolve(newFile);
        }, "image/jpeg", 0.9);
      };
      img.onerror = () => resolve(file);
      img.src = String(reader.result);
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });

  const handleImagesSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!files.length) return;
    const tooLarge = files.filter((f) => f.size > 8 * 1024 * 1024);
    if (tooLarge.length) {
      toast({ title: "Imagen muy grande", description: `${tooLarge.length} archivo(s) > 8MB fueron omitidos.`, variant: "destructive" });
    }
    const valid = files.filter((f) => f.size <= 8 * 1024 * 1024);
    const normalized = await Promise.all(valid.map(normalizeImage));
    setImages((prev) => [...prev, ...normalized.map((f) => ({ url: URL.createObjectURL(f), file: f }))]);
  };

  const moveImage = (i: number, dir: -1 | 1) => {
    setImages((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  };
  const moveImageTo = (from: number, to: number) => {
    setImages((prev) => {
      if (from === to || from < 0 || from >= prev.length || to < 0 || to >= prev.length) return prev;
      const next = [...prev];
      const [pick] = next.splice(from, 1);
      next.splice(to, 0, pick);
      return next;
    });
  };
  const removeImageAt = (i: number) => setImages((prev) => {
    const target = prev[i];
    if (target) revokeLocal(target);
    return prev.filter((_, idx) => idx !== i);
  });
  const makePrimary = (i: number) => setImages((prev) => {
    if (i === 0 || i >= prev.length) return prev;
    const next = [...prev];
    const [pick] = next.splice(i, 1);
    return [pick, ...next];
  });

  const handlePdfSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPdfFile(file);
    setPdfName(file.name);
  };

  const removePdf = () => {
    setPdfFile(null);
    setPdfName(null);
    setForm({ ...form, spec_pdf_url: "" });
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  const uploadFile = async (file: File, prefix: string): Promise<string | null> => {
    const ext = file.name.split(".").pop();
    const path = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(path, file);
    if (error) {
      toast({ title: "Error al subir archivo", description: error.message, variant: "destructive" });
      return null;
    }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
    return urlData.publicUrl;
  };

  const saveItem = async () => {
    if (!form.product_id || !form.product_name) {
      toast({ title: "Faltan datos", description: "ID y Nombre son obligatorios", variant: "destructive" });
      return;
    }
    setUploading(true);

    const pending = images.filter((i) => i.file).length + (pdfFile ? 1 : 0);
    setUploadProgress({ current: 0, total: pending });

    const finalUrls: string[] = [];
    let failed = 0;
    let done = 0;
    for (let idx = 0; idx < images.length; idx++) {
      const img = images[idx];
      if (img.file) {
        setImages((prev) => prev.map((it, k) => (k === idx ? { ...it, uploading: true, error: undefined } : it)));
        const url = await uploadFile(img.file, "img");
        done++;
        setUploadProgress({ current: done, total: pending });
        if (url) {
          finalUrls.push(url);
          setImages((prev) => prev.map((it, k) => (k === idx ? { url, uploading: false } : it)));
        } else {
          failed++;
          setImages((prev) => prev.map((it, k) => (k === idx ? { ...it, uploading: false, error: "Error al subir" } : it)));
        }
      } else if (img.url) {
        finalUrls.push(img.url);
      }
    }

    let specPdfUrl = form.spec_pdf_url || null;
    if (pdfFile) {
      const url = await uploadFile(pdfFile, "spec");
      done++;
      setUploadProgress({ current: done, total: pending });
      if (url) specPdfUrl = url;
      else failed++;
    }

    if (failed > 0) {
      setUploading(false);
      toast({ title: "Subida incompleta", description: `${failed} archivo(s) fallaron. Revisa antes de guardar.`, variant: "destructive" });
      return;
    }

    const payload: any = {
      product_id: form.product_id,
      product_name: form.product_name,
      category: form.category || null,
      subcategory: form.subcategory || null,
      description: form.description || null,
      stock: parseInt(form.stock) || 0,
      min_stock: parseInt(form.min_stock) || 5,
      unit_price: parseFloat(form.unit_price) || 0,
      location: form.location || null,
      image_url: finalUrls[0] || null,
      image_urls: finalUrls,
      spec_pdf_url: specPdfUrl,
    };

    if (editItem) {
      const { error } = await supabase.from("inventory").update(payload).eq("id", editItem.id);
      setUploading(false);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Producto actualizado", description: `${finalUrls.length} foto(s) en el carrusel.` });
    } else {
      const { error } = await supabase.from("inventory").insert(payload);
      setUploading(false);
      if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Producto agregado", description: `${finalUrls.length} foto(s) en el carrusel.` });
    }
    setDialogOpen(false);
    fetchItems();
  };

  const deleteItem = async (item: any) => {
    const { error } = await supabase.from("inventory").delete().eq("id", item.id);
    if (error) {
      toast({ title: "Error al eliminar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Producto eliminado", description: `"${item.product_name}" fue eliminado del inventario.` });
    setDeleteConfirm(null);
    fetchItems();
  };

  const filtered = items.filter(
    (i) =>
      i.product_name?.toLowerCase().includes(search.toLowerCase()) ||
      i.product_id?.toLowerCase().includes(search.toLowerCase()) ||
      i.category?.toLowerCase().includes(search.toLowerCase()) ||
      i.subcategory?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar producto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openNew} className="rounded-xl font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-4 h-4 mr-2" /> Agregar Producto
        </Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto bg-[#121214] border-white/10 rounded-[2rem] shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight uppercase">
              {editItem ? "Editar Producto" : "Nuevo Producto"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>ID Producto</Label>
                <Input value={form.product_id} onChange={(e) => setForm({ ...form, product_id: e.target.value })} placeholder="ext-1" />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="EPP" />
              </div>
            </div>
            {/* Subcategory selector */}
            <div className="space-y-2">
              <Label>Subcategoría</Label>
              <select
                value={form.subcategory}
                onChange={(e) => setForm({ ...form, subcategory: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Seleccionar subcategoría...</option>
                {SUBCATEGORY_OPTIONS.map((sc) => (
                  <option key={sc} value={sc}>{sc}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.product_name} onChange={(e) => setForm({ ...form, product_name: e.target.value })} placeholder="Extintor PQS 6kg" />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Textarea 
                value={form.description} 
                onChange={(e) => setForm({ ...form, description: e.target.value })} 
                placeholder="Describe las características principales del producto..."
                className="min-h-[100px]"
              />
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
            {/* Image upload + ordering */}
            <div className="space-y-2">
              <Label>Fotos del producto ({images.length})</Label>
              <p className="text-xs text-muted-foreground">La primera imagen es la principal. Usa las flechas para reordenar.</p>
              <input type="file" ref={fileInputRef} accept="image/*" multiple onChange={handleImagesSelect} className="hidden" />
              {images.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-muted/30 py-8">
                  <ImageIcon className="w-8 h-8 text-muted-foreground/60" />
                  <p className="text-xs text-muted-foreground">Aún no hay fotos. Sube al menos una para mostrar en el carrusel.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {images.map((img, i) => (
                    <div
                      key={`${img.url}-${i}`}
                      draggable={!uploading}
                      onDragStart={(e) => { setDragIndex(i); e.dataTransfer.effectAllowed = "move"; }}
                      onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; if (dragOverIndex !== i) setDragOverIndex(i); }}
                      onDragLeave={() => { if (dragOverIndex === i) setDragOverIndex(null); }}
                      onDrop={(e) => { e.preventDefault(); if (dragIndex !== null) moveImageTo(dragIndex, i); setDragIndex(null); setDragOverIndex(null); }}
                      onDragEnd={() => { setDragIndex(null); setDragOverIndex(null); }}
                      className={cn(
                        "relative group rounded-lg overflow-hidden border border-border bg-white aspect-square transition-all",
                        !uploading && "cursor-grab active:cursor-grabbing",
                        dragIndex === i && "opacity-40 scale-95",
                        dragOverIndex === i && dragIndex !== i && "ring-2 ring-primary scale-[1.03]"
                      )}
                    >
                      <img src={img.url} alt={`Imagen ${i + 1}`} className="w-full h-full object-contain p-2 pointer-events-none" />
                      {i === 0 && (
                        <div className="absolute top-1 left-1 rounded-md bg-primary px-1.5 py-0.5 text-[9px] font-black uppercase text-white flex items-center gap-1">
                          <Star className="w-2.5 h-2.5" /> Principal
                        </div>
                      )}
                      {img.uploading && (
                        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1 text-white">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span className="text-[10px] font-bold uppercase">Subiendo</span>
                        </div>
                      )}
                      {img.error && (
                        <div className="absolute inset-0 bg-destructive/80 flex flex-col items-center justify-center gap-1 text-white px-2 text-center">
                          <AlertCircle className="w-5 h-5" />
                          <span className="text-[10px] font-bold uppercase">{img.error}</span>
                        </div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/70 backdrop-blur-sm px-1 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => moveImage(i, -1)} disabled={i === 0 || uploading} aria-label="Mover a la izquierda">
                          <ArrowLeft className="w-3 h-3" />
                        </Button>
                        {i !== 0 && (
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => makePrimary(i)} disabled={uploading} aria-label="Marcar como principal" title="Hacer principal">
                            <Star className="w-3 h-3" />
                          </Button>
                        )}
                        <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-white hover:bg-white/20" onClick={() => moveImage(i, 1)} disabled={i === images.length - 1 || uploading} aria-label="Mover a la derecha">
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                      <Button type="button" variant="destructive" size="icon" className="absolute top-1 right-1 w-6 h-6 opacity-0 group-hover:opacity-100" onClick={() => removeImageAt(i)} disabled={uploading} aria-label="Eliminar imagen">
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </div>

              )}
              {uploading && uploadProgress.total > 0 && (
                <div className="space-y-1 pt-1">
                  <div className="flex items-center justify-between text-[11px] font-bold uppercase text-muted-foreground">
                    <span>Subiendo archivos…</span>
                    <span>{uploadProgress.current} / {uploadProgress.total}</span>
                  </div>
                  <Progress value={uploadProgress.total ? (uploadProgress.current / uploadProgress.total) * 100 : 0} className="h-1.5" />
                </div>
              )}
              <Button type="button" variant="outline" className="w-full h-16 border-dashed flex flex-col gap-1" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                <Upload className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{images.length ? "Agregar más fotos" : "Seleccionar imágenes (puedes elegir varias, máx 8MB c/u)"}</span>
              </Button>
            </div>


            {/* PDF upload */}
            <div className="space-y-2">
              <Label>Ficha Técnica (PDF)</Label>
              <input type="file" ref={pdfInputRef} accept=".pdf" onChange={handlePdfSelect} className="hidden" />
              {pdfName ? (
                <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/50 px-3 py-2">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-foreground truncate flex-1">{pdfName}</span>
                  <Button variant="ghost" size="icon" className="w-6 h-6 flex-shrink-0" onClick={removePdf}>
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="outline" className="w-full h-14 border-dashed flex flex-col gap-1" onClick={() => pdfInputRef.current?.click()}>
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Subir ficha técnica PDF</span>
                </Button>
              )}
            </div>
            <Button 
              onClick={saveItem} 
              className="w-full h-12 rounded-xl font-black uppercase tracking-widest shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]" 
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Subiendo...
                </>
              ) : editItem ? "Guardar Cambios" : "Agregar al Inventario"}
            </Button>
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
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-muted-foreground">{item.category} · {item.product_id}</p>
                          {item.subcategory && (
                            <Badge variant="secondary" className="text-[10px]">{item.subcategory}</Badge>
                          )}
                          {item.spec_pdf_url && (
                            <FileText className="w-3 h-3 text-primary" />
                          )}
                        </div>
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 h-8 w-8"
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(item); }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
      {/* Delete confirmation dialog */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar producto?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará <strong>"{deleteConfirm?.product_name}"</strong> del inventario. 
              El producto dejará de aparecer en el catálogo público automáticamente. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteItem(deleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
