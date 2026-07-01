import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Route } from '../routes/_app.snippets.index';

// Mock TanStack Router
const { mockSnippets } = vi.hoisted(() => {
  return {
    mockSnippets: [
      {
        id: "1",
        title: "Connexion MySQL Python",
        language: "Python",
        description: "Connexion à une base de données MySQL avec Python.",
        code: "import mysql.connector\n...",
        tags: ["python", "mysql", "database", "connexion"],
        date: "15/05/2024",
        favorite: true,
        collection: "Backend",
        dateObj: new Date("2026-06-08T00:00:00Z"),
      },
      {
        id: "2",
        title: "API REST avec FastAPI",
        language: "Python",
        description: "Mise en place rapide d'une API REST avec FastAPI.",
        code: "from fastapi import FastAPI\n...",
        tags: ["python", "api", "fastapi"],
        date: "14/05/2024",
        favorite: true,
        collection: "Backend",
        dateObj: new Date("2026-06-08T00:00:00Z"),
      },
      {
        id: "3",
        title: "Composant React Modal",
        language: "JavaScript",
        description: "Modal réutilisable en React avec portal.",
        code: "export function Modal() {}",
        tags: ["javascript", "react", "component"],
        date: "14/05/2024",
        favorite: true,
        collection: "Frontend",
        dateObj: new Date("2026-06-08T00:00:00Z"),
      }
    ]
  };
});

vi.mock('@tanstack/react-router', () => ({
  createFileRoute: () => (options: any) => ({
    ...options,
    useSearch: () => ({ collection: undefined }),
    useLoaderData: () => ({
      initialSnippets: mockSnippets,
      collectionName: null,
      needsClientFetch: false
    })
  }),
  Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
  useNavigate: () => vi.fn(),
  useRouter: () => ({
    invalidate: vi.fn(),
  }),
}));

// We need to test the component inside the route
const SnippetsPage = (Route as any).component;

describe('SnippetsPage filtering', () => {
  it('should render all snippets by default', () => {
    render(<SnippetsPage />);
    // Check if some snippets from mock data are present
    expect(screen.getByText(mockSnippets[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockSnippets[1].title)).toBeInTheDocument();
  });

  it('should filter snippets by search query', () => {
    render(<SnippetsPage />);
    // La recherche est masquée derrière le bouton « Filtrer ».
    fireEvent.click(screen.getByText('Filtrer'));
    const searchInput = screen.getByRole('textbox');

    fireEvent.change(searchInput, { target: { value: 'Python' } });

    // "Connexion MySQL Python" reste, "Composant React Modal" (JS) disparaît.
    expect(screen.getByText('Connexion MySQL Python')).toBeInTheDocument();
    expect(screen.queryByText('Composant React Modal')).not.toBeInTheDocument();
  });

  it('should filter snippets by language', () => {
    render(<SnippetsPage />);

    // Onglet de langue dérivé des snippets réels (plus de liste figée mock-data).
    fireEvent.click(screen.getByRole('button', { name: 'JavaScript' }));

    expect(screen.getByText('Composant React Modal')).toBeInTheDocument();
    expect(screen.queryByText('Connexion MySQL Python')).not.toBeInTheDocument();
  });
});
