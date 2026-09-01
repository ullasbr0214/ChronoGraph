import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import TimelinePage from "./pages/TimelinePage";

export default function App() {
  return (
    <BrowserRouter>

      <AppLayout>

        <Routes>

          <Route
            path="/"
            element={<Dashboard />}
          />

          <Route path="/timeline" element={<TimelinePage />} />

        </Routes>

      </AppLayout>

    </BrowserRouter>
  );
}