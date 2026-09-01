import { BrowserRouter, Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";

import Dashboard from "./pages/Dashboard";
import TimelinePage from "./pages/TimelinePage";
import GraphPage from "./pages/GraphPage";
import Investigation from "./pages/Investigation";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>

          {/* Main dashboard */}
          <Route
            path="/"
            element={<Dashboard />}
          />

          {/* Temporal timeline */}
          <Route
            path="/timeline"
            element={<TimelinePage />}
          />

          {/* Relationship graph */}
          <Route
            path="/graph"
            element={<GraphPage />}
          />

          {/* AI investigation */}
          <Route
            path="/investigation"
            element={<Investigation />}
          />

        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}