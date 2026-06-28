import LoginPanel from "../components/auth/LoginPanel";

function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
      <div className="grid w-full items-center gap-8 lg:grid-cols-[1fr_460px]">
        <div className="hidden lg:block">
          <h1 className="font-display text-5xl font-extrabold leading-tight text-ink">
            Chaque acteur se connecte depuis le meme login.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-600">
            L'admin cree les therapeutes, le therapeute cree les parents, puis le parent ajoute les enfants.
          </p>
        </div>
        <LoginPanel />
      </div>
    </div>
  );
}

export default LoginPage;
