import { Toaster } from "react-hot-toast";
import AppRoutes from "./routes/AppRoutes.jsx";

export default function App() {
  return (
    <>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <AppRoutes />
    </>
  );
}
