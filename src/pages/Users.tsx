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
import { Search } from "lucide-react";
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

const UsersPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "inactive">("all");

  /** ------------------------------------------------------------------
   * USERS QUERY — trae TODOS los usuarios, activos e inactivos
   * ------------------------------------------------------------------ */
  const {
    data: users,
    isLoading: usersLoading,
    error: usersError,
  } = useQuery<UserRow[]>({
    queryKey: ["users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("users")
        .select(
          `*,
          user_permissions (permission)`
        )
        .order("created_at", { ascending: false }); // 🔹 sin filtro is_active

      if (error) throw error;

      return (
        data?.map((u: any) => ({
          ...u,
          permissions: u.user_permissions?.map((p: any) => p.permission) ?? [],
        })) || []
      );
    },
  });

  /** ------------------------------------------------------------------
   * MUTATION — activar / desactivar usuario
   * ------------------------------------------------------------------ */
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

  /** ------------------------------------------------------------------
   * DATOS FILTRADOS
   * ------------------------------------------------------------------ */
  const filteredUsers = useMemo(() => {
    if (!users) return [];

    return users.filter((u) => {
      if (
        filter === "active" && !u.is_active ||
        filter === "inactive" && u.is_active
      )
        return false;

      if (!search.trim()) return true;

      const term = search.toLowerCase();
      return (
        u.name.toLowerCase().includes(term) ||
        u.email.toLowerCase().includes(term)
      );
    });
  }, [users, search, filter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-indigo-50">
      {/* ENCABEZADO */}
      <div className="bg-indigo-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold">👥 Gestión de Usuarios</h1>
          <p className="text-indigo-200">Activa o desactiva cuentas rápidamente</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* BARRA DE FILTRO */}
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                {([
                  { label: "Todos", value: "all" },
                  { label: "Activos", value: "active" },
                  { label: "Inactivos", value: "inactive" },
                ] as const).map((opt) => (
                  <Button
                    key={opt.value}
                    variant={filter === opt.value ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFilter(opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* TABLA USUARIOS */}
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
              <div className="text-center py-8 text-gray-500">
                Sin resultados
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div className="font-medium">{u.name}</div>
                      </TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{u.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={u.is_active ? "default" : "outline"}>
                          {u.is_active ? "Activo" : "Inactivo"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={u.is_active}
                          onCheckedChange={(checked) =>
                            toggleUserStatus.mutate({ id: u.id, is_active: checked })
                          }
                          disabled={toggleUserStatus.isPending}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UsersPage;
