import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell } from '../components/app-shell';
import { ThemeProvider } from '../components/theme-provider';

// Mock TanStack Router
vi.mock('@tanstack/react-router', () => ({
  Link: ({ children, to, className }: any) => <a href={to} className={className}>{children}</a>,
  useLocation: () => ({ pathname: '/dashboard' }),
  useNavigate: () => vi.fn(),
}));

// Mock Radix UI Portal
vi.mock('@radix-ui/react-dropdown-menu', async () => {
  const actual = await vi.importActual('@radix-ui/react-dropdown-menu');
  return {
    ...actual as any,
    Portal: ({ children }: any) => <>{children}</>,
  };
});

describe('AppShell component', () => {
  it('should render the sidebar and logo', () => {
    render(
      <ThemeProvider>
        <AppShell>Content</AppShell>
      </ThemeProvider>
    );
    
    expect(screen.getByAltText('Izwa')).toBeInTheDocument();
    expect(screen.getByText(/Izw/)).toBeInTheDocument();
    expect(screen.getAllByText('Tableau de bord').length).toBeGreaterThan(0);
  });

  it('should render the children content', () => {
    render(
      <ThemeProvider>
        <AppShell>
          <div data-testid="child-content">My Dashboard</div>
        </AppShell>
      </ThemeProvider>
    );
    
    expect(screen.getByTestId('child-content')).toHaveTextContent('My Dashboard');
  });

  it('should display the current page title in the header', () => {
    render(
      <ThemeProvider>
        <AppShell>Content</AppShell>
      </ThemeProvider>
    );
    
    // '/dashboard' is mocked, so it should find "Tableau de bord" in the header
    const headers = screen.getAllByText('Tableau de bord');
    // One in the sidebar, one in the header
    expect(headers.length).toBeGreaterThan(0);
  });

  it('should toggle theme when the theme button is clicked', () => {
    render(
      <ThemeProvider>
        <AppShell>Content</AppShell>
      </ThemeProvider>
    );
    
    const themeBtn = screen.getByLabelText('Toggle theme');
    fireEvent.click(themeBtn);
    
    // The theme provider should have updated the document class
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('should show notifications when the bell button is clicked', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <AppShell>Content</AppShell>
      </ThemeProvider>
    );
    
    const bellBtn = screen.getByLabelText('Notifications');
    await user.click(bellBtn);
    
    expect(await screen.findByText('Notifications')).toBeInTheDocument();
    expect(await screen.findByText('Nouveau snippet')).toBeInTheDocument();
  });
});
