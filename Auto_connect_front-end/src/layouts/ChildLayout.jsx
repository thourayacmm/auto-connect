import AppShell from "./AppShell";

function ChildLayout({ user }) {
  return <AppShell role="CHILD" user={user} />;
}

export default ChildLayout;
