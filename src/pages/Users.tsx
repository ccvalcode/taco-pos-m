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
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Search, Settings } from "lucide-react";
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

const UsersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [editingPermissions, setEditingPermissions] = useState<string[]>([]);

  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery<UserRow[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data: usersData, error: usersErr } = await supabase
        .from("users")
        .select("id, email, name, role, is_active")
        .order("created_at", { ascending: false });

      if (usersErr) throw usersErr;

      const ids = usersData?.map((u) => u.id) || [];
      let permissionsMap: Record<string, string[]> = {};

      if (ids.length > 0) {
        const { data: permsData, error: permsErr } = await supabase
          .from("user_permissions")
          .select("user_id, permission")
          .in("user_id", ids);

        if (permsErr) throw permsErr;

        permsData?.forEach((p: any) => {
          permissionsMap[p.user_id] = permissionsMap[p.user_id] || [];
          permissionsMap[p.user_id].push(p.permission);
        });
      }

      return (
        usersData?.map((u: any) => ({
          ...u,
          permissions: permissionsMap[u.id] || [],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Estado actualizado" });
    },
    onError: (e: any) => {
      toast({
        title: "Error al actualizar",
        description: e.message ?? "No se pudo cambiar el estado del usuario.",
        variant: "destructive",
      });
    },
  });

  const updatePermissions = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string; permissions: string[] }) => {
      const { error: delError } = await supabase
        .from("user_permissions")
        .delete()
        .eq("user_id", userId);
      if (delError) throw delError;

      const inserts = permissions.map((perm) => ({ user_id: userId, permission: perm }));
      const { error: insError } = await supabase.from("user_permissions").insert(inserts);
      if (insError) throw insError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast({ title: "Permisos actualizados" });
      setSelectedUser(null);
    },
    onError: (e: any) => {
      toast({
        title: "Error al actualizar permisos",
        description: e.message ?? "No se pudo actualizar la lista de permisos.",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      if ((filter === "active" && !u.is_active) || (filter === "inactive" && u.is_active)) return false;
      const term = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term) ||
        u.permissions.some((perm) => perm.toLowerCase().includes(term))
      );
    });
  }, [users, search, filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50">
      <div className="bg-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">👥 Gestión de Usuarios</h1>
          <p className="text-indigo-200">Activa o desactiva cuentas rápidamente</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre, email o permiso..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                {["all", "active", "inactive"].map((value) => (
                  <Button
                    key={value}
                    variant={filter === value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(value as any)}
                  >
                    {value === "all" ? "Todos" : value === "active" ? "Activos" : "Inactivos"}
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
            {usersLoading ? (
              <div className="text-center py-8">Cargando usuarios...</div>
            ) : usersError ? (
              <div className="text-center py-8 text-red-500">
                Error: {(usersError as Error).message}
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Sin resultados</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Permisos</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell><div className="font-medium">{u.name}</div></TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell><Badge variant="secondary">{u.role}</Badge></TableCell>
                      <TableCell>
                        {u.permissions.length ? (
                          <div className="flex flex-wrap gap-1">
                            {u.permissions.map((perm) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Sin permisos</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "default" : "outline"}>{u.is_active ? "Activo" : "Inactivo"}</Badge>
                      </TableCell>
                      <TableCell className="flex gap-2 items-center">
                        <Switch
                          checked={u.is_active}
                          onCheckedChange={(checked) => toggleUserStatus.mutate({ id: u.id, is_active: checked })}
                          disabled={toggleUserStatus.isPending}
                        />
                        <Button variant="ghost" size="icon" onClick={() => { setSelectedUser(u); setEditingPermissions(u.permissions); }}>
                          <Settings className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar permisos de {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {ALL_PERMISSIONS.map((perm) => (
              <div key={perm} className="flex items-center gap-3">
                <Checkbox
                  checked={editingPermissions.includes(perm)}
                  onCheckedChange={(checked) => {
                    setEditingPermissions((prev) =>
                      checked ? [...prev, perm] : prev.filter((p) => p !== perm)
                    );
                  }}
                />
                <span className="text-sm">{perm}</span>
              </div>
            ))}
            <div className="pt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>Cancelar</Button>
              <Button
                onClick={() => {
                  if (selectedUser) {
                    updatePermissions.mutate({ userId: selectedUser.id, permissions: editingPermissions });
                  }
                }}
              >
                Guardar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
