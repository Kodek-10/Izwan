import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useTheme } from "@/components/theme-provider";
import { api } from "@/lib/api-client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function AdminSettingsDialog({
  open,
  onOpenChange,
  username,
  onUsernameChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  username: string;
  onUsernameChange: (name: string) => void;
}) {
  const { i18n } = useTranslation();
  const { theme, toggle } = useTheme();
  const [name, setName] = useState(username);
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [savingPw, setSavingPw] = useState(false);

  const saveProfile = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === username) return;
    setSavingProfile(true);
    try {
      await api.put("/auth/me", { username: trimmed });
      onUsernameChange(trimmed);
      toast.success("Profil mis à jour");
    } catch (e: any) {
      toast.error(e.message || "Échec de la mise à jour");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async () => {
    if (!currentPw || !newPw) {
      toast.error("Remplissez les champs");
      return;
    }
    if (newPw !== confirmPw) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }
    setSavingPw(true);
    try {
      await api.post("/auth/change-password", { current_password: currentPw, new_password: newPw });
      toast.success("Mot de passe mis à jour");
      setCurrentPw("");
      setNewPw("");
      setConfirmPw("");
    } catch (e: any) {
      toast.error(e.message || "Échec de la mise à jour");
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Paramètres administrateur</DialogTitle>
          <DialogDescription>Profil, sécurité et apparence de la console.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Profil */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Profil</h3>
            <div className="space-y-2">
              <Label htmlFor="admin-username">Nom d'utilisateur</Label>
              <Input id="admin-username" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <Button
              size="sm"
              onClick={saveProfile}
              disabled={savingProfile || !name.trim() || name.trim() === username}
            >
              {savingProfile && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer
            </Button>
          </section>

          {/* Sécurité */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sécurité</h3>
            <div className="space-y-2">
              <Label htmlFor="admin-cpw">Mot de passe actuel</Label>
              <Input id="admin-cpw" type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-npw">Nouveau mot de passe</Label>
              <Input id="admin-npw" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-conf">Confirmer</Label>
              <Input id="admin-conf" type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} />
            </div>
            <Button size="sm" variant="secondary" onClick={changePassword} disabled={savingPw}>
              {savingPw && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Changer le mot de passe
            </Button>
          </section>

          {/* Apparence */}
          <section className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Apparence</h3>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Thème</Label>
              <Select value={theme} onValueChange={() => toggle()}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dark">Sombre</SelectItem>
                  <SelectItem value="light">Clair</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label>Langue</Label>
              <Select value={i18n.language} onValueChange={(v) => i18n.changeLanguage(v)}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
