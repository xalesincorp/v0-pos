"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "../ui/checkbox";
import { Search, X, UserPlus } from "lucide-react";
import { db, Supplier } from "@/lib/db";

interface SupplierSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSupplierSelected: (supplier: Supplier) => void;
  excludedSupplierId?: string;
}

export default function SupplierSelectionModal({
  isOpen,
  onClose,
  onSupplierSelected,
  excludedSupplierId
}: SupplierSelectionModalProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch suppliers
  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const allSuppliers = await db.suppliers.filter(supplier => !supplier.deletedAt).toArray();
      setSuppliers(allSuppliers);
    } catch (error) {
      console.error("Error fetching suppliers:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
    }
  }, [isOpen]);

  // Filter suppliers based on search query
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = !searchQuery || 
      supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (supplier.address && supplier.address.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const notExcluded = !excludedSupplierId || supplier.id !== excludedSupplierId;
    
    return matchesSearch && notExcluded;
  });

  // Handle supplier selection
  const handleSupplierSelect = (supplier: Supplier) => {
    onSupplierSelected(supplier);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <CardHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Pilih Supplier</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="p-4 flex-1 overflow-auto">
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari supplier berdasarkan nama, telepon, atau alamat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Suppliers table */}
          <div className="border rounded-lg overflow-auto max-h-[400px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0">
                <TableRow>
                  <TableHead>Nama Supplier</TableHead>
                  <TableHead>Telepon</TableHead>
                  <TableHead>Alamat</TableHead>
                  <TableHead className="w-20">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : filteredSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                      {suppliers.length === 0 ? "Belum ada supplier" : "Tidak ada supplier yang ditemukan"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSuppliers.map((supplier) => (
                    <TableRow 
                      key={supplier.id}
                      className="hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{supplier.name}</TableCell>
                      <TableCell>{supplier.phone || "-"}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {supplier.address || "-"}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleSupplierSelect(supplier)}
                          className="h-8 px-3"
                        >
                          Pilih
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={onClose}>
              Tutup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}