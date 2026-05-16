import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { SERVICE_ICON_OPTIONS, SERVICE_ICONS } from "@/components/ServicesSection";

type Brand = {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  sort_order: number;
};

type Service = {
  id: string;
  title: string;
  description: string | null;
  icon_name: string | null;
  is_active: boolean;
  sort_order: number;
};

export default function AdminContent() {
  return (
    <div className="space-y-10">
      <BrandsManager />
      <ServicesManager />
    </div>
  );
}

// ─── BRANDS ──────────────────────────────────────────────────────────
function BrandsManager() {
  const [items, setItems] = useState<Brand[]>([]);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Brand | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("brand_partners")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Error cargando marcas");
    else setItems((data ?? []) as Brand[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("brand_partners-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brand_partners" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const openNew = () => {
    setEditing({
      id: "",
      name: "",
      logo_url: "",
      is_active: true,
      sort_order: items.length + 1,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    const payload = {
      name: editing.name.trim(),
      logo_url: editing.logo_url?.trim() || null,
      is_active: editing.is_active,
      sort_order: editing.sort_order,
    };
    const { error } = editing.id
      ? await supabase.from("brand_partners").update(payload).eq("id", editing.id)
      : await supabase.from("brand_partners").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Marca guardada");
      setOpen(false);
      setEditing(null);
    }
  };

  const toggleActive = async (b: Brand) => {
    const { error } = await supabase
      .from("brand_partners")
      .update({ is_active: !b.is_active })
      .eq("id", b.id);
    if (error) toast.error(error.message);
  };

  const remove = async (b: Brand) => {
    const { error } = await supabase.from("brand_partners").delete().eq("id", b.id);
    if (error) toast.error(error.message);
    else toast.success("Marca eliminada");
    setConfirmDel(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Marcas aliadas</h2>
          <p className="text-sm text-muted-foreground">
            Marcas mostradas en la franja del sitio público
          </p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Agregar marca
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Orden</th>
              <th className="px-4 py-2.5 font-medium">Nombre</th>
              <th className="px-4 py-2.5 font-medium">Logo</th>
              <th className="px-4 py-2.5 font-medium">Activo</th>
              <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-2.5">{b.sort_order}</td>
                <td className="px-4 py-2.5 font-medium">{b.name}</td>
                <td className="px-4 py-2.5">
                  {b.logo_url ? (
                    <img src={b.logo_url} alt="" className="h-6" />
                  ) : (
                    <span className="text-muted-foreground text-xs">— texto —</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Switch
                    checked={b.is_active}
                    onCheckedChange={() => toggleActive(b)}
                  />
                </td>
                <td className="px-4 py-2.5 text-right">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setEditing(b);
                      setOpen(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setConfirmDel(b)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sin marcas aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing?.id ? "Editar marca" : "Nueva marca"}</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editing.name}
                  onChange={(e) =>
                    setEditing({ ...editing, name: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>URL del logo (opcional)</Label>
                <Input
                  value={editing.logo_url ?? ""}
                  placeholder="https://..."
                  onChange={(e) =>
                    setEditing({ ...editing, logo_url: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.is_active}
                  onCheckedChange={(v) =>
                    setEditing({ ...editing, is_active: v })
                  }
                />
                <Label>Activo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar marca?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && remove(confirmDel)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}

// ─── SERVICES ────────────────────────────────────────────────────────
function ServicesManager() {
  const [items, setItems] = useState<Service[]>([]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [open, setOpen] = useState(false);
  const [confirmDel, setConfirmDel] = useState<Service | null>(null);

  const load = async () => {
    const { data, error } = await supabase
      .from("service_offerings")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) toast.error("Error cargando servicios");
    else setItems((data ?? []) as Service[]);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("service_offerings-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "service_offerings" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, []);

  const openNew = () => {
    setEditing({
      id: "",
      title: "",
      description: "",
      icon_name: "wrench",
      is_active: true,
      sort_order: items.length + 1,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!editing) return;
    if (!editing.title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    const payload = {
      title: editing.title.trim(),
      description: editing.description?.trim() || null,
      icon_name: editing.icon_name || null,
      is_active: editing.is_active,
      sort_order: editing.sort_order,
    };
    const { error } = editing.id
      ? await supabase.from("service_offerings").update(payload).eq("id", editing.id)
      : await supabase.from("service_offerings").insert(payload);
    if (error) toast.error(error.message);
    else {
      toast.success("Servicio guardado");
      setOpen(false);
      setEditing(null);
    }
  };

  const toggleActive = async (s: Service) => {
    const { error } = await supabase
      .from("service_offerings")
      .update({ is_active: !s.is_active })
      .eq("id", s.id);
    if (error) toast.error(error.message);
  };

  const remove = async (s: Service) => {
    const { error } = await supabase.from("service_offerings").delete().eq("id", s.id);
    if (error) toast.error(error.message);
    else toast.success("Servicio eliminado");
    setConfirmDel(null);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Servicios</h2>
          <p className="text-sm text-muted-foreground">
            Servicios mostrados en la sección del sitio público
          </p>
        </div>
        <Button onClick={openNew} size="sm">
          <Plus className="w-4 h-4 mr-1" /> Agregar servicio
        </Button>
      </div>

      <div className="rounded-lg border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left">
            <tr>
              <th className="px-4 py-2.5 font-medium">Orden</th>
              <th className="px-4 py-2.5 font-medium">Icono</th>
              <th className="px-4 py-2.5 font-medium">Título</th>
              <th className="px-4 py-2.5 font-medium">Activo</th>
              <th className="px-4 py-2.5 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => {
              const Icon = (s.icon_name && SERVICE_ICONS[s.icon_name]) || null;
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-4 py-2.5">{s.sort_order}</td>
                  <td className="px-4 py-2.5">
                    {Icon ? <Icon className="w-4 h-4 text-primary" /> : "—"}
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-medium">{s.title}</div>
                    {s.description && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {s.description}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <Switch
                      checked={s.is_active}
                      onCheckedChange={() => toggleActive(s)}
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        setEditing(s);
                        setOpen(true);
                      }}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => setConfirmDel(s)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </td>
                </tr>
              );
            })}
            {items.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                  Sin servicios aún
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editing?.id ? "Editar servicio" : "Nuevo servicio"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div>
                <Label>Título</Label>
                <Input
                  value={editing.title}
                  onChange={(e) =>
                    setEditing({ ...editing, title: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Descripción</Label>
                <Textarea
                  value={editing.description ?? ""}
                  rows={3}
                  onChange={(e) =>
                    setEditing({ ...editing, description: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Icono</Label>
                <Select
                  value={editing.icon_name ?? ""}
                  onValueChange={(v) =>
                    setEditing({ ...editing, icon_name: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un icono" />
                  </SelectTrigger>
                  <SelectContent>
                    {SERVICE_ICON_OPTIONS.map((k) => {
                      const Icon = SERVICE_ICONS[k];
                      return (
                        <SelectItem key={k} value={k}>
                          <span className="inline-flex items-center gap-2">
                            <Icon className="w-4 h-4" />
                            {k}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={editing.sort_order}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      sort_order: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editing.is_active}
                  onCheckedChange={(v) =>
                    setEditing({ ...editing, is_active: v })
                  }
                />
                <Label>Activo</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={save}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDel} onOpenChange={(o) => !o && setConfirmDel(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar servicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => confirmDel && remove(confirmDel)}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
