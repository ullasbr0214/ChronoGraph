import { BrowserRouter, Routes, Route } from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Timeline from "./pages/Timeline";

export default function App() {
  return (
    <BrowserRouter>

      <Routes>

        <Route
          path="/"
          element={<Dashboard />}
        />

        <Route
          path="/timeline"
          element={
            <div className="app-shell">
              <Dashboard />
            </div>
          }
        />

      </Routes>

    </BrowserRouter>
  );
}