import { Link } from "react-router-dom";
import Button from "../components/common/Button";

function UnauthorizedPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-2xl items-center justify-center px-4">
      <div className="section-shell w-full p-10 text-center">
        <h1 className="font-display text-4xl font-extrabold text-ink">Accès refusé</h1>
        <p className="mt-3 text-slate-500">Ce rôle n'a pas accès à cette page dans la démo.</p>
        <Link to="/" className="mt-6 inline-block">
          <Button>Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  );
}

export default UnauthorizedPage;
