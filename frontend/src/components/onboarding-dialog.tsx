import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, FolderKanban, Bot, Share2, Check } from "lucide-react";

const SLIDES = [
  {
    icon: Sparkles,
    title: "Bienvenue sur Izwan",
    text: "Votre bibliothèque de code augmentée par l'IA. Capturez, organisez et retrouvez vos snippets en un clin d'œil.",
  },
  {
    icon: FolderKanban,
    title: "Capturez & organisez",
    text: "Enregistrez vos morceaux de code, classez-les en collections et marquez vos favoris. Capture directe depuis l'extension VS Code.",
  },
  {
    icon: Bot,
    title: "Recherche sémantique & assistant",
    text: "Trouvez vos snippets par intention, pas seulement par mots-clés, et discutez avec l'assistant IA qui s'appuie sur votre bibliothèque.",
  },
  {
    icon: Share2,
    title: "Constellation & mode hors-ligne",
    text: "Visualisez les liens entre vos snippets, repérez les doublons, et travaillez partout grâce à l'application desktop.",
  },
];

export function OnboardingDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const Icon = slide.icon;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="w-[95vw] max-w-md rounded-2xl">
        <DialogTitle className="sr-only">Découverte d'Izwan</DialogTitle>
        <div className="flex flex-col items-center px-2 py-4 text-center">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl gradient-brand text-white shadow-lg">
            <Icon className="h-8 w-8" />
          </div>
          <h2 className="font-display text-xl font-semibold">{slide.title}</h2>
          <p className="mt-2 text-sm text-muted-foreground">{slide.text}</p>

          <div className="mt-6 flex items-center gap-2">
            {SLIDES.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30"
                }`}
              />
            ))}
          </div>

          <div className="mt-6 flex w-full items-center justify-between gap-3">
            {step === 0 ? (
              <Button variant="ghost" className="text-muted-foreground" onClick={onClose}>
                Passer
              </Button>
            ) : (
              <Button variant="ghost" onClick={() => setStep((s) => s - 1)}>
                Précédent
              </Button>
            )}
            {isLast ? (
              <Button className="gradient-brand border-0 text-white" onClick={onClose}>
                <Check className="mr-1.5 h-4 w-4" /> Commencer
              </Button>
            ) : (
              <Button className="gradient-brand border-0 text-white" onClick={() => setStep((s) => s + 1)}>
                Suivant
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
