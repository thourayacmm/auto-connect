import AppShell from "./AppShell";

function AdminLayout({ user }) {
  return <AppShell role="ADMIN" user={user} />;
}

export default AdminLayout;
