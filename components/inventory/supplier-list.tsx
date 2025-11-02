"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit, Trash2, Plus, Search } from "lucide-react";
import { useProductStore } from "@/lib/stores/productStore";
import { useNotificationStore } from "@/lib/stores/notificationStore";
import { Supplier } from "@/lib/db";

export default function SupplierList() {
  const {
    addSupplier,
    updateSupplier,
    deleteSupplier,
    fetchSuppliers,
    searchSuppliers: storeSearchSuppliers
  } = useProductStore();
  const { showNotification } = useNotificationStore();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    address: "",
  });

  useEffect(() => {
    const loadSuppliers = async () => {
      setLoading(true);
      try {
        await fetchSuppliers();
        // Get the updated suppliers from the store
        const storeState = useProductStore.getState();
        setSuppliers(storeState.suppliers);
      } catch (error) {
        console.error("Error loading suppliers:", error);
        showNotification({
          type: 'low_stock',
          title: "Error",
          message: "Failed to load suppliers",
          data: null,
        });
      } finally {
        setLoading(false);
      }
    };

    loadSuppliers();

    // Subscribe to supplier changes in the store
    const unsubscribe = useProductStore.subscribe(
      (state) => setSuppliers(state.suppliers)
    );

    return () => {
      unsubscribe();
    };
  }, [fetchSuppliers, showNotification]);

  const [filteredSuppliers, setFilteredSuppliers] = useState<Supplier[]>([]);

  // Update filtered suppliers when suppliers or search query changes
  useEffect(() => {
    if (searchQuery) {
      const searchResults = storeSearchSuppliers(searchQuery).filter(supplier =>
        !supplier.deletedAt && supplier.id && supplier.id.trim() !== '' && supplier.name && supplier.name.trim() !== ''
      );
      setFilteredSuppliers(searchResults);
    } else {
      setFilteredSuppliers(suppliers.filter(supplier =>
        !supplier.deletedAt && supplier.id && supplier.id.trim() !== '' && supplier.name && supplier.name.trim() !== ''
      ));
    }
  }, [suppliers, searchQuery, storeSearchSuppliers]);

  const handleAddSupplier = async () => {
    if (!formData.name.trim()) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Supplier name is required",
        data: null,
      });
      return;
    }

    try {
      await addSupplier({
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        createdBy: 'current-user-id', // Will be replaced with actual user ID
      });

      // Reset form
      setFormData({ name: "", phone: "", address: "" });
      setShowForm(false);
      showNotification({
        type: 'saved_order',
        title: "Success",
        message: "Supplier added successfully",
        data: null,
      });
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Failed to add supplier",
        data: null,
      });
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier || !formData.name.trim()) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: "Supplier name is required",
        data: null,
      });
      return;
    }

    try {
      await updateSupplier(editingSupplier.id, {
        name: formData.name.trim(),
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
      });

      setEditingSupplier(null);
      setFormData({ name: "", phone: "", address: "" });
      showNotification({
        type: 'saved_order',
        title: "Success",
        message: "Supplier updated successfully",
        data: null,
      });
    } catch (error: any) {
      showNotification({
        type: 'low_stock',
        title: "Error",
        message: error.message || "Failed to update supplier",
        data: null,
      });
    }
  };

  const handleDeleteSupplier = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete supplier "${name}"?`)) {
      try {
        await deleteSupplier(id);
        showNotification({
          type: 'saved_order',
          title: "Success",
          message: "Supplier deleted successfully",
          data: null,
        });
      } catch (error: any) {
        showNotification({
          type: 'low_stock',
          title: "Error",
          message: error.message || "Failed to delete supplier",
          data: null,
        });
      }
    }
  };

  const startEditing = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
      phone: supplier.phone || "",
      address: supplier.address || "",
    });
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingSupplier(null);
    setFormData({ name: "", phone: "", address: "" });
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex-1 relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
            className="pl-10 h-9"
          />
        </div>
        <Button onClick={() => setShowForm(true)} className="gap-2 h-9">
          <Plus className="w-4 h-4" />
          Add Supplier
        </Button>
      </div>

      {/* Suppliers Table */}
      <Card className="p-0 border-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50 sticky top-0">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Nama Pemasok</TableHead>
                <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Kontak</TableHead>
                <TableHead className="h-8 px-3 py-1 text-xs font-semibold">Alamat</TableHead>
                <TableHead className="h-8 px-3 py-1 text-xs font-semibold text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Pemasok Tidak ditemukan</TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="hover:bg-muted/30 border-b border-border/50 h-12">
                    <TableCell className="px-3 py-1 font-medium">{supplier.name}</TableCell>
                    <TableCell className="px-3 py-1 text-sm text-muted-foreground">{supplier.phone || '-'}</TableCell>
                    <TableCell className="px-3 py-1 text-sm text-muted-foreground">{supplier.address || '-'}</TableCell>
                    <TableCell className="px-3 py-1 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => startEditing(supplier)}
                          className="h-7 px-2 gap-1 text-xs"
                        >
                          <Edit className="w-3.5 h-3.5" />
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSupplier(supplier.id, supplier.name)}
                          className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add/Edit Supplier Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md p-6">
            <h3 className="font-semibold text-foreground mb-4">{editingSupplier ? "Edit Pemasok" : "Tambah Pemasok"}</h3>
            <div className="space-y-3 mb-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Nama Pemasok *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="e.g., PT. Supplier ABC"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">No Telp</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="e.g., 021-12345678"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Alamat</label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  placeholder="e.g., Jl. Raya Kebayoran No. 123, Jakarta"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={cancelForm}>
                Cancel
              </Button>
              <Button onClick={editingSupplier ? handleUpdateSupplier : handleAddSupplier}>
                {editingSupplier ? "Update" : "Add"} Supplier
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
