import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { RoleGate } from './role-gate';

const byName = (n: string) => MOCK_USERS.find((u) => u.username === n)!;

describe('RoleGate', () => {
  it('hides admin-only content from users and shows fallback', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    render(
      <RoleGate role="admin" fallback={<span>nope</span>}>
        admin stuff
      </RoleGate>,
    );
    expect(screen.queryByText('admin stuff')).toBeNull();
    expect(screen.getByText('nope')).toBeInTheDocument();
  });

  it('renders nothing by default for users', () => {
    useAuthStore.setState({ user: byName('ppa.user'), status: 'authenticated' });
    const { container } = render(<RoleGate role="admin">admin stuff</RoleGate>);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows admin content to admin, and admin passes user gates', () => {
    useAuthStore.setState({ user: byName('admin'), status: 'authenticated' });
    render(
      <>
        <RoleGate role="admin"><span>a</span></RoleGate>
        <RoleGate role="user"><span>b</span></RoleGate>
      </>,
    );
    expect(screen.getByText('a')).toBeInTheDocument();
    expect(screen.getByText('b')).toBeInTheDocument();
  });
});
