import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NewIssueForm from './NewIssueForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// We mock the useRouter since the form likely uses next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    refresh: jest.fn(),
  })),
}));

describe('NewIssueForm', () => {
  it('renders the title field', () => {
    const fakeUsers = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' },
    ];
    const fakeDivisions = [
      { id: 'div_network', name: 'Network' },
      { id: 'div_it', name: 'IT' },
    ];
    
    const queryClient = new QueryClient();
    
    render(
      <QueryClientProvider client={queryClient}>
        <NewIssueForm users={fakeUsers} divisions={fakeDivisions} />
      </QueryClientProvider>
    );
    
    // Check that there is an input for the title
    const titleInput = screen.getByPlaceholderText(/title/i);
    expect(titleInput).toBeInTheDocument();
  });
});
