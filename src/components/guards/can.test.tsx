import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useAuthStore } from '@/features/auth';
import { MOCK_USERS } from '@/features/auth/mocks/auth.mock';
import { Can } from './can';

const byName = (n: string) => MOCK_USERS.find((u) => u.username === n)!;

describe('Can', () => {
  it('hides children without permission', () => {
    useAuthStore.setState({ user: byName('gc.viewer'), status: 'authenticated' });
    render(
      <Can module="gc" permission="edit">
        <button>e</button>
      </Can>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders fallback without permission', () => {
    useAuthStore.setState({ user: byName('gc.viewer'), status: 'authenticated' });
    render(
      <Can module="gc" permission="edit" fallback={<span>no</span>}>
        <button>e</button>
      </Can>,
    );
    expect(screen.getByText('no')).toBeInTheDocument();
  });

  it('shows children with permission', () => {
    useAuthStore.setState({ user: byName('gc.editor'), status: 'authenticated' });
    render(
      <Can module="gc" permission="edit">
        <button>e</button>
      </Can>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('hides download from editor, shows to main', () => {
    useAuthStore.setState({ user: byName('gc.editor'), status: 'authenticated' });
    const { unmount } = render(
      <Can module="gc" permission="download">
        <button>d</button>
      </Can>,
    );
    expect(screen.queryByRole('button')).toBeNull();
    unmount();
    useAuthStore.setState({ user: byName('gc.user'), status: 'authenticated' });
    render(
      <Can module="gc" permission="download">
        <button>d</button>
      </Can>,
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('hides when logged out', () => {
    useAuthStore.setState({ user: null, status: 'unauthenticated' });
    render(
      <Can module="gc" permission="view">
        <button>v</button>
      </Can>,
    );
    expect(screen.queryByRole('button')).toBeNull();
  });
});
