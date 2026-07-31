import { Toaster } from "react-hot-toast";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <AppRoutes />
    </ErrorBoundary>
  );
}
