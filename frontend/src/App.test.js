import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the home page with the coffee gallery', () => {
  render(<App />);

  expect(screen.getByText(/sabores cálidos y aromas únicos/i)).toBeInTheDocument();
  expect(screen.getByText(/momentos de café/i)).toBeInTheDocument();
});
