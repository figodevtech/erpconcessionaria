"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Download, Edit, FileText, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import {
  deleteVehicleDocumentAction,
  getVehicleDocumentUrlAction,
  listVehicleDocumentsAction,
  updateVehicleDocumentAction,
  uploadVehicleDocumentAction,
} from "@/actions/documents";
import { getTypeCatalogAction } from "@/actions/type-catalog";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { usePermissions } from "@/hooks/use-permissions";
import { formatFileSize, type VehicleDocument } from "@/lib/documents";
import type { DocumentCategory } from "@/lib/type-catalog";
import type { Vehicle } from "./vehicle-list-client";

export function VehicleAttachmentsTab({ vehicle }: { vehicle: Vehicle }) {
  const { hasPermission } = usePermissions();
  const [documents, setDocuments] = useState<VehicleDocument[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editing, setEditing] = useState<VehicleDocument | null>(null);
  const [deleting, setDeleting] = useState<VehicleDocument | null>(null);

  const canCreate = hasPermission("documents:create");
  const canUpdate = hasPermission("documents:update");
  const canDelete = hasPermission("documents:delete");

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [documentsResult, typesResult] = await Promise.all([
      listVehicleDocumentsAction(Number(vehicle.id)),
      getTypeCatalogAction(),
    ]);

    if (documentsResult.success) {
      setDocuments(documentsResult.data ?? []);
    } else {
      toast.error(documentsResult.error ?? "Erro ao carregar anexos");
    }

    if (typesResult.success && typesResult.data) {
      setCategories(typesResult.data.documentCategories.filter((item) => item.ativo));
    }

    setLoading(false);
  }, [vehicle.id]);

  useEffect(() => {
    const timeout = setTimeout(fetchData, 0);
    return () => clearTimeout(timeout);
  }, [fetchData]);

  async function openDocument(documentId: number) {
    const result = await getVehicleDocumentUrlAction(documentId);
    if (result.success && result.data) {
      window.open(result.data, "_blank", "noopener,noreferrer");
    } else {
      toast.error(result.error ?? "Erro ao abrir anexo");
    }
  }

  return (
    <div className="flex flex-col gap-6 p-1">
      <Card>
        <CardHeader className="border-b pb-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2 text-primary">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <CardTitle className="text-base">Anexos do veiculo</CardTitle>
                <button
                  type="button"
                  onClick={fetchData}
                  disabled={loading}
                  className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <span>Recarregar</span>
                  <Loader2 className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {canCreate && (
              <Button type="button" size="sm" className="rounded-xl" onClick={() => setUploadOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Novo anexo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {loading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead>Titulo</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead>Arquivo</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Acoes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum anexo cadastrado para este veiculo.
                      </TableCell>
                    </TableRow>
                  ) : (
                    documents.map((document) => (
                      <TableRow key={document.id}>
                        <TableCell className="font-medium">
                          <div>{document.title}</div>
                          <div className="text-[11px] text-muted-foreground">{document.description || "-"}</div>
                        </TableCell>
                        <TableCell>{document.category?.nome || "-"}</TableCell>
                        <TableCell>
                          <div>{document.file_name}</div>
                          <div className="text-[11px] text-muted-foreground">{formatFileSize(document.file_size)}</div>
                        </TableCell>
                        <TableCell>{document.expires_at ? new Date(document.expires_at).toLocaleDateString("pt-BR") : "-"}</TableCell>
                        <TableCell className="text-center">
                          <Badge variant={document.active ? "secondary" : "outline"} className="font-normal">
                            {document.active ? "Ativo" : "Inativo"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button type="button" variant="ghost" size="icon" onClick={() => openDocument(document.id)}>
                              <Download className="h-4 w-4" />
                            </Button>
                            {canUpdate && (
                              <Button type="button" variant="ghost" size="icon" onClick={() => setEditing(document)}>
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {canDelete && (
                              <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleting(document)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <DocumentUploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        vehicleId={Number(vehicle.id)}
        categories={categories}
        onSuccess={() => {
          setUploadOpen(false);
          fetchData();
        }}
      />
      <DocumentEditDialog
        document={editing}
        categories={categories}
        onOpenChange={(open) => !open && setEditing(null)}
        onSuccess={() => {
          setEditing(null);
          fetchData();
        }}
      />
      <AlertDialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir anexo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao remove o anexo <strong>{deleting?.title}</strong> e apaga o arquivo do bucket.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (!deleting) return;
                const result = await deleteVehicleDocumentAction(deleting.id);
                if (result.success) {
                  toast.success("Anexo excluido");
                  setDeleting(null);
                  fetchData();
                } else {
                  toast.error(result.error ?? "Erro ao excluir anexo");
                }
              }}
            >
              Sim, excluir anexo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DocumentUploadDialog({
  open,
  onOpenChange,
  vehicleId,
  categories,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: number;
  categories: DocumentCategory[];
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [categoryId, setCategoryId] = useState("");

  function submit(formData: FormData) {
    formData.set("vehicle_id", vehicleId.toString());
    formData.set("category_id", categoryId);

    startTransition(async () => {
      const result = await uploadVehicleDocumentAction(formData);
      if (result.success) {
        toast.success("Anexo enviado");
        onSuccess();
      } else {
        toast.error(result.error ?? "Erro ao enviar anexo");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Novo anexo</DialogTitle>
          <DialogDescription>Envie um documento para vincular ao veiculo.</DialogDescription>
        </DialogHeader>
        <form action={submit} className="grid gap-4">
          <Field label="Titulo"><Input name="title" required /></Field>
          <Field label="Categoria">
            <Select value={categoryId} onValueChange={(value) => setCategoryId(value ?? "")}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>{category.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Validade"><Input name="expires_at" type="date" /></Field>
          <Field label="Descricao"><Textarea name="description" className="resize-none" /></Field>
          <Field label="Arquivo"><Input name="file" type="file" required /></Field>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancelar</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              Enviar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DocumentEditDialog({
  document,
  categories,
  onOpenChange,
  onSuccess,
}: {
  document: VehicleDocument | null;
  categories: DocumentCategory[];
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [active, setActive] = useState(true);

  useEffect(() => {
    if (!document) return;
    const timeout = setTimeout(() => {
      setTitle(document.title);
      setDescription(document.description || "");
      setCategoryId(document.category_id?.toString() || "");
      setExpiresAt(document.expires_at ? document.expires_at.slice(0, 10) : "");
      setActive(document.active);
    }, 0);
    return () => clearTimeout(timeout);
  }, [document]);

  function submit() {
    if (!document) return;
    startTransition(async () => {
      const result = await updateVehicleDocumentAction(document.id, {
        title,
        description,
        category_id: categoryId,
        expires_at: expiresAt,
        active,
      });
      if (result.success) {
        toast.success("Anexo atualizado");
        onSuccess();
      } else {
        toast.error(result.error ?? "Erro ao atualizar anexo");
      }
    });
  }

  return (
    <Dialog open={!!document} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[720px]">
        <DialogHeader>
          <DialogTitle>Editar anexo</DialogTitle>
          <DialogDescription>Atualize os dados do documento vinculado ao veiculo.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Field label="Titulo"><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
          <Field label="Categoria">
            <Select value={categoryId || "none"} onValueChange={(value) => setCategoryId(value === "none" || !value ? "" : value)}>
              <SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                <SelectItem value="none">Sem categoria</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id.toString()}>{category.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Validade"><Input value={expiresAt} type="date" onChange={(event) => setExpiresAt(event.target.value)} /></Field>
          <Field label="Descricao"><Textarea value={description} onChange={(event) => setDescription(event.target.value)} className="resize-none" /></Field>
          <div className="flex items-center justify-between rounded-xl border p-3">
            <div>
              <Label>Ativo</Label>
              <p className="text-xs text-muted-foreground">Controla se o anexo fica disponivel nas listagens.</p>
            </div>
            <Switch checked={active} onCheckedChange={setActive} />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>Cancelar</Button>
          <Button type="button" onClick={submit} disabled={isPending}>
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Edit className="mr-2 h-4 w-4" />}
            Atualizar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
