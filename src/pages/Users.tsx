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
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  Settings,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
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
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "staff",
  });
  const [formErrors, setFormErrors] = useState<{ [k: string]: string }>({});
  const [currentPage, setCurrentPage] = useState(1);
  const [fabOpen, setFabOpen] = useState(false);

  const {
    data: users,
    isLoading,
    error,
  } = useQuery<UserRow[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select("id, email, name, role, is_active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const ids = data?.map((u) => u.id) || [];
      const permMap: Record<string, string[]> = {};

      if (ids.length) {
        const { data: perms, error: permErr } = await supabase
          .from("user_permissions")
          .select("user_id, permission")
          .in("user_id", ids);
        if (permErr) throw permErr;
        perms?.forEach((p) => {
          permMap[p.user_id] = permMap[p.user_id] || [];
          permMap[p.user_id].push(p.permission);
        });
      }

      return (
        data?.map((u: any) => ({
          ...u,
          permissions: permMap[u.id] || [],
        })) || []
      );
    },
  });

  const toggleUserStatus = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("users")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["users"] }),
  });

  const updatePermissions = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      await supabase.from("user_permissions").delete().eq("user_id", userId);
      if (permissions.length) {
        await supabase
          .from("user_permissions")
          .insert(permissions.map((p) => ({ user_id: userId, permission: p })));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Permisos actualizados" });
      setSelectedUser(null);
    },
  });

  const createUser = useMutation({
    mutationFn: async ({ name, email, password, role }: typeof newUser) => {
      const { data, error: signErr } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name, role } },
      });
      if (signErr) throw signErr;

      const id = data.user?.id;
      if (id)
        await supabase.from("users").insert({
          id,
          auth_user_id: id,
          email,
          name,
          role,
          is_active: true,
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Usuario creado" });
      setCreateDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "staff" });
      setFormErrors({});
    },
    onError: (e: any) =>
      toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const validateForm = () => {
    const errs: { [k: string]: string } = {};
    if (!newUser.name.trim()) errs.name = "Nombre requerido";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newUser.email)) errs.email = "Email inválido";
    if (newUser.password.length < 6) errs.password = "Mínimo 6 caracteres";
    if (!newUser.role.trim()) errs.role = "Rol requerido";
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

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

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));
  const currentPageUsers = filteredUsers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );
  const changePage = (p: number) =>
    setCurrentPage(Math.min(Math.max(1, p), totalPages));

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50 pb-20">
      <div className="bg-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">👥 Gestión de Usuarios</h1>
            <p className="text-indigo-200">Activa, desactiva y gestiona permisos</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex flex-col md:flex-row gap-4 md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  className="pl-10"
                  placeholder="Buscar nombre, email o permiso..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
              <div className="flex gap-2">
                {[
                  { label: "Todos", value: "all" },
                  { label: "Activos", value: "active" },
                  { label: "Inactivos", value: "inactive" },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    size="sm"
                    variant={filter === opt.value ? "default" : "outline"}
                    onClick={() => {
                      setFilter(opt.value as any);
                      setCurrentPage(1);
                    }}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Usuarios ({filteredUsers.length})</CardTitle>
          </CardHeader>
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
                      <TableRow key={u.id}>
                        <TableCell>{u.name}</TableCell>
                        <TableCell>{u.email}</TableCell>
                        <TableCell>{u.role}</TableCell>
                        <TableCell>
                          {u.permissions.length ? (
                            <div className="flex flex-wrap gap-1">
                              {u.permissions.map((p) => (
                                <Badge key={p} variant="secondary">{p}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">Sin permisos</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={u.is_active}
                            onCheckedChange={(val) =>
                              toggleUserStatus.mutate({ id: u.id, is_active: val })
                            }
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(u);
                              setEditingPermissions(u.permissions);
                            }}
                          >
                            <Settings className="w-4 h-4 mr-1" />
                            Permisos
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-500">
                    Página {currentPage} de {totalPages}
                  </span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost" disabled={currentPage === 1} onClick={() => changePage(currentPage - 1)}>
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="ghost" disabled={currentPage === totalPages} onClick={() => changePage(currentPage + 1)}>
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Diálogo permisos */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Permisos de {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            {ALL_PERMISSIONS.map((perm) => (
              <label key={perm} className="flex items-center gap-2">
                <Checkbox
                  checked={editingPermissions.includes(perm)}
                  onCheckedChange={(val) =>
                    setEditingPermissions((prev) =>
                      val ? [...prev, perm] : prev.filter((p) => p !== perm)
                    )
                  }
                />
                <span className="capitalize">{perm.replace("_", " ")}</span>
              </label>
            ))}
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
            <Button onClick={() => selectedUser && updatePermissions.mutate({
              userId: selectedUser.id,
              permissions: editingPermissions,
            })}>Guardar</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Diálogo nuevo usuario */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Crear nuevo usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input placeholder="Nombre" value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
            {formErrors.name && <p className="text-sm text-red-500">{formErrors.name}</p>}
            <Input placeholder="Email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
            {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
            <Input type="password" placeholder="Contraseña" value={newUser.password} onChange={(e) => setNewUser({ ...newUser, password: e.target.value })} />
            {formErrors.password && <p className="text-sm text-red-500">{formErrors.password}</p>}
            <Input placeholder="Rol" value={newUser.role} onChange={(e) => setNewUser({ ...newUser, role: e.target.value })} />
            {formErrors.role && <p className="text-sm text-red-500">{formErrors.role}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancelar</Button>
              <Button onClick={() => validateForm() && createUser.mutate(newUser)}>Crear</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* FAB flotante */}
      <div className="fixed bottom-6 right-6 z-50">
        {fabOpen && (
          <div className="mb-2 flex flex-col items-end gap-2 transition-all">
            <Button className="shadow-lg" onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Crear usuario
            </Button>
            <Button variant="secondary" className="shadow-lg">
              <Settings className="w-4 h-4 mr-1" />
              Configuración
            </Button>
          </div>
        )}
        <Button className="rounded-full h-14 w-14 p-0 shadow-xl" onClick={() => setFabOpen(!fabOpen)}>
          {fabOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </Button>
      </div>
    </div>
  );
};

export default UsersPage;
