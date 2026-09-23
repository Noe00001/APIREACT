import { render, screen, waitFor } from '@testing-library/react';
import App from './App.jsx';

test('renders the home page with the coffee gallery', async () => {
  render(<App />);

  expect(screen.getByText(/sabores cálidos/i)).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByText(/momentos de café/i)).toBeInTheDocument();
  });
});
