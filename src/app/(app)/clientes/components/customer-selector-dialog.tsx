"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { toast } from "sonner";
import { listCustomersAction } from "@/actions/customers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  customerPersonTypeLabel,
  formatCpfCnpj,
  formatPhone,
  type Customer,
} from "@/lib/customers";

type CustomerSelectorDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (customer: Customer) => void;
};

export function CustomerSelectorDialog({
  open,
  onOpenChange,
  onSelect,
}: CustomerSelectorDialogProps) {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedForOpen, setHasLoadedForOpen] = useState(false);
  const pageSize = 20;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  const showLoading = open && (!hasLoadedForOpen || isLoading);

  useEffect(() => {
    if (!open) return;

    let ignoreResult = false;
    const timeout = setTimeout(async () => {
      setIsLoading(true);

      const result = await listCustomersAction({
        page,
        pageSize,
        search,
        status: "ATIVO",
      });

      if (ignoreResult) return;

      if (result.success) {
        setCustomers(result.data ?? []);
        setCount(result.count ?? 0);
      } else {
        setCustomers([]);
        setCount(0);
        toast.error(result.error ?? "Erro ao carregar clientes");
      }

      setHasLoadedForOpen(true);
      setIsLoading(false);
    }, 250);

    return () => {
      ignoreResult = true;
      clearTimeout(timeout);
    };
  }, [open, page, pageSize, search]);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setHasLoadedForOpen(false);
      setIsLoading(false);
    }

    onOpenChange(nextOpen);
  }

  function handleSelect(customer: Customer) {
    onSelect(customer);
    handleOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="flex min-h-120 flex-col overflow-hidden">
        <DialogHeader className="border-b">
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xs">Selecione um cliente</DialogTitle>
              <DialogDescription className={"text-xs"}>
                Pesquise e clique em um cliente para selecionar.
              </DialogDescription>
            </div>
            
          </div>
        </DialogHeader>

        <div className="flex items-center gap-2 border-b">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Buscar por nome, CPF/CNPJ, email, telefone ou cidade..."
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          <div >
            <Table className="text-[10px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Documento</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {showLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Carregando clientes...
                    </TableCell>
                  </TableRow>
                ) : customers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                      Nenhum cliente encontrado.
                    </TableCell>
                  </TableRow>
                ) : (
                  customers.map((customer) => (
                    <TableRow
                      key={customer.id}
                      className="cursor-pointer"
                      onClick={() => handleSelect(customer)}
                    >
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {customer.id}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{customer.name}</div>
                        <div className="text-muted-foreground">{customer.city}/{customer.state}</div>
                      </TableCell>
                      <TableCell>{formatCpfCnpj(customer.cpf_cnpj)}</TableCell>
                      <TableCell>{customerPersonTypeLabel(customer.person_type)}</TableCell>
                      <TableCell>
                        <div >{customer.email}</div>
                        <div className="text-muted-foreground">{formatPhone(customer.phone)}</div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between border-t px-6 py-4">
          <span className="text-sm text-muted-foreground">
            {count === 0 ? "0 clientes" : `${(page - 1) * pageSize + 1}-${Math.min(page * pageSize, count)} de ${count}`}
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              disabled={page <= 1 || showLoading}
              aria-label="Pagina anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="min-w-24 text-center text-sm font-medium">
              Pg. {page} de {totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              disabled={page >= totalPages || showLoading}
              aria-label="Proxima pagina"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
