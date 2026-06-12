export type Snippet = {
  id: string;
  title: string;
  language: string;
  description: string;
  code: string;
  tags: string[];
  date: string;
  favorite: boolean;
  collection?: string;
};

export const snippets: Snippet[] = [
  {
    id: "1",
    title: "Connexion MySQL Python",
    language: "Python",
    description: "Connexion à une base de données MySQL avec Python.",
    code: `import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="password",
        database="ma_base"
    )`,
    tags: ["python", "mysql", "database", "connexion"],
    date: "15/05/2024",
    favorite: true,
    collection: "Backend",
  },
  {
    id: "2",
    title: "API REST avec FastAPI",
    language: "Python",
    description: "Mise en place rapide d'une API REST avec FastAPI.",
    code: `from fastapi import FastAPI

app = FastAPI()

@app.get("/items/{item_id}")
def read_item(item_id: int):
    return {"item_id": item_id}`,
    tags: ["python", "api", "fastapi"],
    date: "14/05/2024",
    favorite: true,
    collection: "Backend",
  },
  {
    id: "3",
    title: "Composant React Modal",
    language: "JavaScript",
    description: "Modal réutilisable en React avec portal.",
    code: `export function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}`,
    tags: ["javascript", "react", "component"],
    date: "14/05/2024",
    favorite: true,
    collection: "Frontend",
  },
  {
    id: "4",
    title: "Fonction pour trier un tableau JS",
    language: "JavaScript",
    description: "Tri d'un tableau d'objets par propriété.",
    code: `arr.sort((a, b) => a.name.localeCompare(b.name));`,
    tags: ["javascript", "array", "sort"],
    date: "12/05/2024",
    favorite: true,
    collection: "Frontend",
  },
  {
    id: "5",
    title: "Lire un fichier CSV avec Pandas",
    language: "Python",
    description: "Chargement de données depuis un CSV.",
    code: `import pandas as pd
df = pd.read_csv("fichier.csv")
print(df.head())`,
    tags: ["python", "pandas", "csv"],
    date: "10/05/2024",
    favorite: false,
    collection: "Backend",
  },
  {
    id: "6",
    title: "Script d'automatisation Bash",
    language: "Bash",
    description: "Script de sauvegarde automatique.",
    code: `#!/bin/bash
tar -czf backup-$(date +%F).tar.gz /home/user/data`,
    tags: ["bash", "script", "automation"],
    date: "13/05/2024",
    favorite: false,
    collection: "Utils & Scripts",
  },
  {
    id: "7",
    title: "Requête SQL complexe",
    language: "SQL",
    description: "Jointure avec sous-requête.",
    code: `SELECT u.name, COUNT(o.id) AS orders
FROM users u
LEFT JOIN orders o ON o.user_id = u.id
GROUP BY u.id;`,
    tags: ["sql", "join", "subquery"],
    date: "08/05/2024",
    favorite: false,
    collection: "SQL",
  },
];

export const collections = [
  { name: "Backend", count: 24, icon: "server" },
  { name: "Frontend", count: 18, icon: "layout" },
  { name: "SQL", count: 15, icon: "database" },
  { name: "Cybersécurité", count: 10, icon: "shield" },
  { name: "Utils & Scripts", count: 22, icon: "wrench" },
];

export const languages = ["Python", "JavaScript", "TypeScript", "SQL", "Bash", "Go", "Rust"];
