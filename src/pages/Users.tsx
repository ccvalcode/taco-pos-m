import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Settings, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UserRow {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  permissions: string[];
}

const ALL_PERMISSIONS = [
  "admin",
  "can_create",
  "can_edit",
  "can_delete",
  "view_reports",
  "manage_users",
];

const ITEMS_PER_PAGE = 10;

const UsersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "", role: "staff" });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);

  /* ------------------------------ QUERY USERS ------------------------------ */
  const { data: users, isLoading, error } = useQuery<UserRow[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error: usersErr } = await supabase.from("users").select("id, email, name, role, is_active").order("created_at", { ascending: false });
      if (usersErr) throw usersErr;
      const ids = data?.map((u) => u.id) || [];
      const map: Record<string, string[]> = {};
      if (ids.length) {
        const { data: perms, error: permsErr } = await supabase.from("user_permissions").select("user_id, permission").in("user_id", ids);
        if (permsErr) throw permsErr;
        perms?.forEach((p: any) => {
          map[p.user_id] = map[p.user_id] || [];
          map[p.user_id].push(p.permission);
        });
      }
      return (
        data?.map((u: any) => ({ ...u, permissions: map[u.id] || [] })) || []
      );
    },
  });

  /* ----------------------------- MUTATIONS ----------------------------- */
  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("users").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });

  const updatePermissions = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      await supabase.from("user_permissions").delete().eq("user_id", userId);
      if (permissions.length) await supabase.from("user_permissions").insert(permissions.map((p) => ({ user_id: userId, permission: p })));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Permisos actualizados" });
      setSelectedUser(null);
    },
  });

  const createUser = useMutation({
    mutationFn: async ({ name, email, password, role }: typeof newUser) => {
      const { data, error: signErr } = await supabase.auth.signUp({ email, password, options: { data: { name, role } } });
      if (signErr) throw signErr;
      const id = data.user?.id;
      if (id) await supabase.from("users").insert({ id, auth_user_id: id, email, name, role, is_active: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Usuario creado" });
      setCreateDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "staff" });
      setFormErrors({});
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  /* ---------------------------- VALIDACIONES ---------------------------- */
  const validateForm = () => {
    const errors: { [k: string]: string } = {};
    if (!newUser.name.trim()) errors.name = "Nombre requerido";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newUser.email)) errors.email = "Email inválido";
    if (newUser.password.length < 6) errors.password = "Mínimo 6 caracteres";
    if (!newUser.role.trim()) errors.role = "Rol requerido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ------------------------- FILTRO + BÚSQUEDA ------------------------- */
  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      if (filter === "active" && !u.is_active) return false;
      if (filter === "inactive" && u.is_active) return false;
      const term = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.permissions.some((p) => p.toLowerCase().includes(term))
      );
    });
  }, [users, search, filter]);

  /* ------------------------------ PAGINACIÓN ----------------------------- */
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentPageUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  const changePage = (page: number) => setCurrentPage(Math.min(Math.max(1, page), totalPages));

  /* -------------------------------- RENDER -------------------------------- */
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50">
      {/* HEADER */}
      <div className="bg-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">👥 Gestión de Usuarios</h1>
            <p className="text-indigo-200">Activa, desactiva y gestiona permisos</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={(o) => { setCreateDialogOpen(o); setFormErrors({}); }}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700 text-white"><Plus className="w-4 h-4 mr-2" />Nuevo usuario</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle>Crear nuevo usuario</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Nombre" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                {formErrors.name && <p className="text-xs text-red-500">{formErrors.name}</p>}
                <Input placeholder="Email" type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
                {formErrors.email && <p className="text-xs text-red-500">{formErrors.email}</p>}
                <Input placeholder="Contraseña (mín 6)" type="password" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
                {formErrors.password && <p className="text-xs text-red-500">{formErrors.password}</p>}
                <Input placeholder="Rol" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} />
                {formErrors.role && <p className="text-xs text-red-500">{formErrors.role}</p>}
                <Button className="w-full" disabled={createUser.isPending} onClick={() => validateForm() && createUser.mutate(newUser)}>Guardar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input className="pl-10" placeholder="Buscar nombre, email o permiso..." value={search} onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }} />
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Todos", value: "all" },
                  { label: "Activos", value: "active" },
                  { label: "Inactivos", value: "inactive" },
                ].map((opt) => (
                  <Button key={opt.value} size="sm" variant={filter === opt.value ? "default" : "outline"} onClick={() => { setFilter(opt.value as any); setCurrentPage(1); }}>{opt.label}</Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABLE */}
        <Card>
          <CardHeader><CardTitle>Usuarios ({filteredUsers.length})</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-center py-8">Cargando...</p>
            ) : error ? (
              <p className="text-center py-8 text-red-500">{(error as Error).message}</p>
            ) : filteredUsers.length === 0 ? (
              <p className="text-center py-8 text-gray-500">Sin resultados</p>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nombre</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Rol</TableHead>
                      <TableHead>Permisos</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-center">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentPageUsers.map((u) => (
                      <TableRow key={u.id} className="even:bg-gray-50">
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                        <TableCell>
                          {u.permissions.length ? (
                            <div className="flex flex-wrap gap-1 max-w-64">
                              {u.permissions.map((perm) => (
                                <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                              ))}
                            </div>
                          ) : <span className="text-xs text-gray-400">Sin permisos</span>}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${u.is_active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{u.is_active ? "Activo" : "Inactivo"}</span>
                        </TableCell>
                        <TableCell className="flex gap-2 justify-center">
                          <Switch checked={u.is_active} onCheckedChange={(c) => toggleUserStatus.mutate({ id: u.id, is_active: c })} />
                          <Button size="icon" variant="ghost" onClick={() => { setSelectedUser(u); setEditingPermissions(u.permissions); }}><Settings className="w-4 h-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {/* PAGINATION */}
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm">Página {currentPage} de {totalPages}</span>
                  <div className="flex gap-1">
                    <Button size="icon" variant="outline" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}><ChevronLeft className="w-4 h-4" /></Button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <Button key={p} size="sm" variant={p === currentPage ? "default" : "outline"} onClick={() => changePage(p)}>{p}</Button>
                    ))}
                    <Button size="icon" variant="outline" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}><ChevronRight className="w-4 h-4" /></Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* PERMISSIONS MODAL */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Permisos de {selectedUser?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {ALL_PERMISSIONS.map((perm) => (
              <div key={perm} className="flex items-center gap-2">
                <Checkbox checked={editingPermissions.includes(perm)} onCheckedChange={(checked) => setEditingPermissions((prev) => checked ? [...prev, perm] : prev.filter((p) => p !== perm))} />
                <span className="text-sm capitalize">{perm.replace(/_/g, " ")}</span>
              </div>
            ))}
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
              <Button onClick={() => selectedUser && updatePermissions.mutate({ userId: selectedUser.id, permissions: editingPermissions })}>Guardar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
