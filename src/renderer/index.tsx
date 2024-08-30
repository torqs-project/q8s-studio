import { createRoot } from 'react-dom/client';
import App from './App';
import { ConsoleProvider, NavigationProvider } from './contexts/ConsoleContext';

const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);
root.render(
  <ConsoleProvider>
    <NavigationProvider>
      <App />
    </NavigationProvider>
  </ConsoleProvider>,
);
