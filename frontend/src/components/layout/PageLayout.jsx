import Sidebar from "./Sidebar.jsx";

export default function PageLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="lg:flex">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 xl:p-10">{children}</main>
      </div>
    </div>
  );
}
