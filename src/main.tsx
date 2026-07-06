import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import App from './App.tsx';
import LandingAnimation from './components/LandingAnimation.tsx';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const root = createRoot(document.getElementById('root')!);

// Standalone looping brand intro for the portfolio showcase / screen recording:
// visit `/?intro` (or `#intro`). Rendered bare (no app providers, no StrictMode)
// so the loop timers stay clean for capture.
const isIntro =
  new URLSearchParams(window.location.search).has('intro') ||
  window.location.hash === '#intro';

if (isIntro) {
  root.render(<LandingAnimation loop />);
} else {
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  );
}
