
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Create root element and render the application
const rootElement = document.getElementById("root");

// Make sure the root element exists before rendering
if (rootElement) {
  createRoot(rootElement).render(<App />);
} else {
  console.error("Root element not found! Cannot render the application.");
}
