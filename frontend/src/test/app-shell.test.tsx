import type { ReactNode } from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppShell } from '../components/app-shell';
import { ThemeProvider } from '../components/theme-provider';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => vi.fn(),
}));

function renderShell(children: ReactNode = 'Content') {
  return render(
    <ThemeProvider>
      <AppShell>{children}</AppShell>
    </ThemeProvider>,
  );
}

describe('AppShell component', () => {
  it('affiche le contenu enfant', () => {
    renderShell(<div data-testid="child-content">My Dashboard</div>);
    expect(screen.getByTestId('child-content')).toHaveTextContent('My Dashboard');
  });

  it('affiche la barre de recherche globale', () => {
    renderShell();
    expect(screen.getByPlaceholderText(/Rechercher des snippets/i)).toBeInTheDocument();
  });

  it('affiche la navigation (dock) vers les sections principales', () => {
    const { container } = renderShell();
    // Le dock rend un lien par section ; on vérifie les destinations, pas les libellés
    // (ceux-ci n'apparaissent que sur l'entrée active/survolée).
    expect(container.querySelector('a[href="/snippets"]')).toBeTruthy();
    expect(container.querySelector('a[href="/collections"]')).toBeTruthy();
  });

  it('bascule le thème au clic', () => {
    renderShell();
    const before = document.documentElement.classList.contains('dark');
    fireEvent.click(screen.getByLabelText('Thème'));
    expect(document.documentElement.classList.contains('dark')).toBe(!before);
  });
});
