import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Users as UsersIcon, UserPlus, Edit, Trash2, Clock, DollarSign, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";

const AVAILABLE_PERMISSIONS = [
  { id: 'pos_access', label: 'Acceso al POS', description: 'Permite usar el sistema de punto de venta' },
  { id: 'kitchen_access', label: 'Acceso a Cocina', description: 'Permite ver y gestionar órdenes de cocina' },
  { id: 'sales_view', label: 'Ver Ventas', description: 'Permite ver reportes de ventas' },
  { id: 'users_manage', label: 'Gestionar Usuarios', description: 'Permite crear y editar usuarios' },
  { id: 'cash_manage', label: 'Gestionar Caja', description: 'Permite hacer cortes de caja' },
  { id: 'reports_view', label: 'Ver Reportes', description: 'Permite acceder a todos los reportes' },
  { id: 'inventory_manage', label: 'Gestionar Inventario', description: 'Permite gestionar productos e inventario' }
];

const Users = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isShiftDialogOpen, setIsShiftDialogOpen] = useState(false);
  const [isPermissionsDialogOpen, setIsPermissionsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [selectedUserForPermissions, setSelectedUserForPermissions] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    role: 'cajero'
  });
  const [shiftForm, setShiftForm] = useState({
    userId: '',
    initialCash: 0
  });

  // Obtener usuarios con permisos
  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select(`
          *,
          user_permissions (permission)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data?.map(user => ({
        ...user,
        permissions: user.user_permissions?.map((up: any) => up.permission) || []
      }));
    }
  });

  // Obtener turnos activos
  const { data: activeShifts } = useQuery({
    queryKey: ['active-shifts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shifts')
        .select(`
          *,
          users!shifts_user_id_fkey (name, email)
        `)
        .eq('is_active', true)
        .order('opened_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  // Crear/actualizar usuario
  const createUserMutation = useMutation({
    mutationFn: async (userData: any) => {
      if (editingUser) {
        const { error } = await supabase
          .from('users')
          .update(userData)
          .eq('id', editingUser.id);
        if (error) throw error;
      } else {
        // Para crear usuarios nuevos, necesitaríamos usar Supabase Auth
        // Por ahora solo permitimos editar usuarios existentes
        throw new Error('La creación de usuarios debe hacerse a través del registro de autenticación');
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsUserDialogOpen(false);
      setEditingUser(null);
      setUserForm({ name: '', email: '', role: 'cajero' });
      toast({
        title: "Usuario actualizado",
        description: "El usuario ha sido actualizado correctamente."
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo guardar el usuario.",
        variant: "destructive"
      });
    }
  });

  // Actualizar permisos de usuario
  const updatePermissionsMutation = useMutation({
    mutationFn: async ({ userId, permissions }: { userId: string, permissions: string[] }) => {
      // Eliminar permisos existentes
      await supabase
        .from('user_permissions')
        .delete()
        .eq('user_id', userId);

      // Agregar nuevos permisos
      if (permissions.length > 0) {
        const permissionsData = permissions.map(permission => ({
          user_id: userId,
          permission: permission
        }));

        const { error } = await supabase
          .from('user_permissions')
          .insert(permissionsData);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setIsPermissionsDialogOpen(false);
      setSelectedUserForPermissions(null);
      toast({
        title: "Permisos actualizados",
        description: "Los permisos del usuario han sido actualizados correctamente."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudieron actualizar los permisos.",
        variant: "destructive"
      });
    }
  });

  // Iniciar turno
  const startShiftMutation = useMutation({
    mutationFn: async ({ userId, initialCash }: { userId: string, initialCash: number }) => {
      const { error } = await supabase
        .from('shifts')
        .insert({
          user_id: userId,
          initial_cash: initialCash,
          opened_at: new Date().toISOString(),
          is_active: true
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      setIsShiftDialogOpen(false);
      setShiftForm({ userId: '', initialCash: 0 });
      toast({
        title: "Turno iniciado",
        description: "El turno ha sido iniciado correctamente."
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "No se pudo iniciar el turno.",
        variant: "destructive"
      });
    }
  });

  // Cerrar turno
  const closeShiftMutation = useMutation({
    mutationFn: async (shiftId: string) => {
      const { error } = await supabase
        .from('shifts')
        .update({
          closed_at: new Date().toISOString(),
          is_active: false
        })
        .eq('id', shiftId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['active-shifts'] });
      toast({
        title: "Turno cerrado",
        description: "El turno ha sido cerrado correctamente."
      });
    }
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-red-600';
      case 'admin':
        return 'bg-red-500';
      case 'supervisor':
        return 'bg-purple-500';
      case 'cajero':
        return 'bg-blue-500';
      case 'mesero':
        return 'bg-green-500';
      case 'cocina':
        return 'bg-orange-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createUserMutation.mutate(userForm);
  };

  const openEditUser = (user: any) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      role: user.role
    });
    setIsUserDialogOpen(true);
  };

  const openPermissionsDialog = (user: any) => {
    setSelectedUserForPermissions(user);
    setIsPermissionsDialogOpen(true);
  };

  const handlePermissionsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const selectedPermissions = AVAILABLE_PERMISSIONS
      .filter(permission => formData.get(permission.id))
      .map(permission => permission.id);
    
    updatePermissionsMutation.mutate({
      userId: selectedUserForPermissions.id,
      permissions: selectedPermissions
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <Navigation />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <UsersIcon className="w-8 h-8" />
            <div>
              <h1 className="text-3xl font-bold">👥 Gestión de Usuarios y Turnos</h1>
              <p className="text-blue-100">Taquería El Sabroso</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        {/* Turnos Activos */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Turnos Activos
            </CardTitle>
            <Dialog open={isShiftDialogOpen} onOpenChange={setIsShiftDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Clock className="w-4 h-4 mr-2" />
                  Iniciar Turno
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Iniciar Nuevo Turno</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleShiftSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Usuario</label>
                    <Select value={shiftForm.userId} onValueChange={(value) => setShiftForm({...shiftForm, userId: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar usuario" />
                      </SelectTrigger>
                      <SelectContent>
                        {users?.map((user) => (
                          <SelectItem key={user.id} value={user.id}>
                            {user.name} - {user.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Efectivo Inicial</label>
                    <Input
                      type="number"
                      step="0.01"
                      value={shiftForm.initialCash}
                      onChange={(e) => setShiftForm({...shiftForm, initialCash: parseFloat(e.target.value) || 0})}
                      placeholder="0.00"
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={startShiftMutation.isPending}>
                    Iniciar Turno
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {!activeShifts || activeShifts.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay turnos activos
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {activeShifts.map((shift) => (
                  <Card key={shift.id} className="p-4 border-green-200 bg-green-50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">{shift.users?.name}</h3>
                        <p className="text-sm text-gray-600">{shift.users?.email}</p>
                      </div>
                      <Badge className="bg-green-500 text-white">Activo</Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Inicio:</span>
                        <span>{new Date(shift.opened_at).toLocaleTimeString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Efectivo inicial:</span>
                        <span>${shift.initial_cash?.toFixed(2)}</span>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="w-full mt-3"
                      onClick={() => closeShiftMutation.mutate(shift.id)}
                    >
                      Cerrar Turno
                    </Button>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gestión de Usuarios */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UsersIcon className="w-5 h-5" />
              Usuarios del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <div className="text-center py-8">Cargando usuarios...</div>
            ) : !users || users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No hay usuarios registrados
              </div>
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
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`${getRoleColor(user.role)} text-white`}>
                          {user.role.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.permissions?.slice(0, 2).map((permission: string) => (
                            <Badge key={permission} variant="outline" className="text-xs">
                              {AVAILABLE_PERMISSIONS.find(p => p.id === permission)?.label}
                            </Badge>
                          ))}
                          {user.permissions?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.permissions.length - 2} más
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={user.is_active ? 'bg-green-500' : 'bg-red-500'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openEditUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => openPermissionsDialog(user)}
                          >
                            <Shield className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Dialog para editar usuario */}
      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUserSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Nombre</label>
              <Input
                value={userForm.name}
                onChange={(e) => setUserForm({...userForm, name: e.target.value})}
                placeholder="Nombre completo"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input
                type="email"
                value={userForm.email}
                onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                placeholder="usuario@ejemplo.com"
                required
                disabled={!!editingUser}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Rol</label>
              <Select value={userForm.role} onValueChange={(value) => setUserForm({...userForm, role: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="super_admin">Super Administrador</SelectItem>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                  <SelectItem value="cajero">Cajero</SelectItem>
                  <SelectItem value="mesero">Mesero</SelectItem>
                  <SelectItem value="cocina">Cocina</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" className="w-full" disabled={createUserMutation.isPending}>
              {editingUser ? 'Actualizar' : 'Crear'} Usuario
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog para gestionar permisos */}
      <Dialog open={isPermissionsDialogOpen} onOpenChange={setIsPermissionsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gestionar Permisos - {selectedUserForPermissions?.name}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePermissionsSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
              {AVAILABLE_PERMISSIONS.map((permission) => (
                <div key={permission.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={permission.id}
                    name={permission.id}
                    defaultChecked={selectedUserForPermissions?.permissions?.includes(permission.id)}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={permission.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {permission.label}
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <Button type="submit" className="w-full" disabled={updatePermissionsMutation.isPending}>
              Actualizar Permisos
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Users;
