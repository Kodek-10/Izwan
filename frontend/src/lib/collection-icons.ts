import {
  Folder,
  Briefcase,
  Lightbulb,
  Braces,
  FlaskConical,
  Palette,
  BookOpen,
  GraduationCap,
  Terminal,
  Bug,
  Database,
  Cloud,
  Star,
  Heart,
  Zap,
  Globe,
  Lock,
  Key,
  Shield,
  Wifi,
  Layers,
  Puzzle,
  Settings,
  User,
  Users,
  Rocket,
  type LucideIcon,
} from "lucide-react";

export interface CollectionIconDef {
  name: string;
  label: string;
  Icon: LucideIcon;
}

export const collectionIcons: CollectionIconDef[] = [
  { name: "folder", label: "Dossier", Icon: Folder },
  { name: "work", label: "Travail", Icon: Briefcase },
  { name: "lightbulb", label: "Idée", Icon: Lightbulb },
  { name: "data_object", label: "Données", Icon: Braces },
  { name: "science", label: "Science", Icon: FlaskConical },
  { name: "palette", label: "Design", Icon: Palette },
  { name: "library_books", label: "Bibliothèque", Icon: BookOpen },
  { name: "school", label: "Éducation", Icon: GraduationCap },
  { name: "terminal", label: "Terminal", Icon: Terminal },
  { name: "bug_report", label: "Bug", Icon: Bug },
  { name: "database", label: "Base de données", Icon: Database },
  { name: "cloud", label: "Cloud", Icon: Cloud },
  { name: "star", label: "Étoile", Icon: Star },
  { name: "heart", label: "Favori", Icon: Heart },
  { name: "zap", label: "Énergie", Icon: Zap },
  { name: "globe", label: "Globe", Icon: Globe },
  { name: "lock", label: "Sécurité", Icon: Lock },
  { name: "key", label: "Clé", Icon: Key },
  { name: "shield", label: "Protection", Icon: Shield },
  { name: "wifi", label: "Réseau", Icon: Wifi },
  { name: "layers", label: "Couches", Icon: Layers },
  { name: "puzzle", label: "Puzzle", Icon: Puzzle },
  { name: "settings", label: "Paramètres", Icon: Settings },
  { name: "user", label: "Utilisateur", Icon: User },
  { name: "users", label: "Équipe", Icon: Users },
  { name: "rocket", label: "Rocket", Icon: Rocket },
];

export function getCollectionIcon(name?: string): LucideIcon {
  return collectionIcons.find((i) => i.name === name)?.Icon || Folder;
}
