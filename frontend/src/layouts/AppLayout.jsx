import Sidebar from "../components/Sidebar";
import TopBar from "../components/TopBar";

export default function AppLayout({ children }) {
  return (
    <div className="app-shell">

      <Sidebar />

      <main className="main-content">

        <TopBar />

        {children}

      </main>

    </div>
  );
}