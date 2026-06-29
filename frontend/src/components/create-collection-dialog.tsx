import { useState } from "react";
import { X, Plus, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { collectionIcons } from "@/lib/collection-icons";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function CreateCollectionDialog({
  open,
  onOpenChange,
  onSuccess,
}: CreateCollectionDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("folder");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    setIsLoading(true);
    try {
      await api.post("/collections/", {
        name: name.trim(),
        description: description.trim(),
        icon: selectedIcon,
      });
      toast.success("Collection créée avec succès");
      onOpenChange(false);
      onSuccess?.();
      setName("");
      setDescription("");
      setSelectedIcon("folder");
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border flex justify-between items-center flex-row">
          <DialogTitle className="text-lg font-semibold">
            Créer une collection
          </DialogTitle>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none rounded-full p-1 hover:bg-muted/50"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>

        <div className="px-6 py-5 flex flex-col gap-5 overflow-y-auto max-h-[60vh]">
          {/* Nom */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="collection-name"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Nom de la collection
            </Label>
            <Input
              id="collection-name"
              placeholder="Ex: Projets Q3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <Label
              htmlFor="collection-desc"
              className="text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Description
            </Label>
            <Textarea
              id="collection-desc"
              placeholder="Brève description du contenu..."
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Icon Selection */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Choisir une icône
              </Label>
              <span className="text-xs text-muted-foreground/60 lowercase">
                Optionnel
              </span>
            </div>
            <div className="grid grid-cols-7 gap-2 p-2 bg-muted/30 border border-border/50 rounded-lg max-h-32 overflow-y-auto scrollbar-thin">
              {collectionIcons.map(({ name: iconName, Icon }) => (
                <button
                  key={iconName}
                  onClick={() => setSelectedIcon(iconName)}
                  type="button"
                  className={`aspect-square flex items-center justify-center rounded-md transition-colors ${
                    selectedIcon === iconName
                      ? "bg-primary text-primary-foreground border border-primary"
                      : "bg-background text-muted-foreground border border-border hover:border-primary/50 hover:text-primary"
                  }`}
                  title={iconName}
                >
                  <Icon className="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-border flex justify-end gap-3 bg-muted/20">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
            type="button"
          >
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !name.trim()}
            className="flex items-center gap-1"
            type="button"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Créer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
