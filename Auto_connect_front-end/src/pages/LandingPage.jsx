import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Bot,
  ChartSpline,
  Globe,
  Grid3X3,
  Mail,
  MapPin,
  MessageSquareText,
  Mic,
  Phone,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { useAppPreferences } from "../context/AppPreferences";
import LoginPanel from "../components/auth/LoginPanel";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Modal from "../components/common/Modal";
import RoleOverview from "../components/common/RoleOverview";
import heroChildAac from "../assets/images/hero-child-aac.png";
import heroKidsAcc from "../assets/images/hero-kids-acc.png";

function LandingPage() {
  const { language, setLanguage, gridSize, setGridSize, t } = useAppPreferences();
  const location = useLocation();
  const navigate = useNavigate();
  const [openLogin, setOpenLogin] = useState(location.pathname === "/login");
  const [openLanguage, setOpenLanguage] = useState(false);
  const [openGrid, setOpenGrid] = useState(false);
  const [pendingGrid, setPendingGrid] = useState(gridSize);

  useEffect(() => {
    setOpenLogin(location.pathname === "/login");
  }, [location.pathname]);

  const openLoginModal = () => {
    navigate("/login");
  };

  const closeLoginModal = () => {
    setOpenLogin(false);
    if (location.pathname === "/login") {
      navigate("/");
    }
  };

  const handleLoginSuccess = () => {
    setOpenLogin(false);
  };

  const features = useMemo(
    () => [
      {
        title: language === "fr" ? "Communication par pictogrammes" : "Pictogram communication",
        icon: MessageSquareText,
        text:
          language === "fr"
            ? "Une grille visuelle simple pour construire des phrases a partir d'icones adaptees aux enfants."
            : "A simple visual grid to build sentences with child-friendly icons.",
      },
      {
        title: language === "fr" ? "Synthese vocale" : "Speech synthesis",
        icon: Mic,
        text:
          language === "fr"
            ? "Les phrases sont lues cote navigateur pour renforcer l'expression et l'autonomie."
            : "Sentences are spoken in the browser to support expression and autonomy.",
      },
      {
        title: language === "fr" ? "Suivi de progression" : "Progress tracking",
        icon: ChartSpline,
        text:
          language === "fr"
            ? "Parents et therapeutes visualisent les mots appris, les scores et les scenarios termines."
            : "Parents and therapists can view learned words, scores and completed scenarios.",
      },
      {
        title: language === "fr" ? "Recommandations IA" : "AI recommendations",
        icon: Bot,
        text:
          language === "fr"
            ? "Des cartes IA backend suggerent des actions personnalisees pour la suite du parcours."
            : "Backend AI cards suggest personalized next steps for the journey.",
      },
      {
        title: language === "fr" ? "Scenarios d'apprentissage" : "Learning scenarios",
        icon: Sparkles,
        text:
          language === "fr"
            ? "Des activites guidees aident l'enfant a pratiquer la demande, les emotions et les routines."
            : "Guided activities help children practice requests, emotions and routines.",
      },
    ],
    [language],
  );

  const services = useMemo(
    () =>
      language === "fr"
        ? [
            "Bibliotheque de pictogrammes",
            "Seances par enfant",
            "Analyse de progression",
            "Tableaux de bord multi-roles",
            "Recommandations IA backend",
            "Synthese vocale integree",
          ]
        : [
            "Pictogram library",
            "Sessions by child",
            "Progress analysis",
            "Multi-role dashboards",
            "Backend AI recommendations",
            "Built-in speech synthesis",
          ],
    [language],
  );

  const roles = useMemo(
    () => [
      {
        title: language === "fr" ? "Enfant" : "Child",
        text:
          language === "fr"
            ? "Une interface ludique, claire et rassurante avec de gros boutons et des actions simples."
            : "A playful, clear and reassuring interface with large buttons and simple actions.",
        icon: Users,
      },
      {
        title: language === "fr" ? "Parent" : "Parent",
        text:
          language === "fr"
            ? "Un tableau de bord pour suivre l'evolution et dialoguer avec l'assistant IA."
            : "A dashboard to track progress and talk with the AI assistant.",
        icon: ShieldCheck,
      },
      {
        title: language === "fr" ? "Therapeute" : "Therapist",
        text:
          language === "fr"
            ? "Des outils de gestion de patients, pictogrammes, niveaux et scenarios."
            : "Management tools for patients, pictograms, levels and scenarios.",
        icon: Bot,
      },
      {
        title: language === "fr" ? "Administrateur" : "Administrator",
        text:
          language === "fr"
            ? "Une supervision globale des roles, permissions, acces et bases visuelles."
            : "Global supervision of roles, permissions, access and visual libraries.",
        icon: Sparkles,
      },
    ],
    [language],
  );

  const heroTitleLines = useMemo(
    () =>
      language === "fr"
        ? [
            "Auto Connect aide les enfants",
            "a communiquer avec des pictogrammes",
            "et l'intelligence artificielle",
          ]
        : [
            "Auto Connect helps children",
            "communicate with pictograms",
            "and artificial intelligence",
          ],
    [language],
  );

  const roleFlows = useMemo(
    () =>
      language === "fr"
        ? [
            { title: "Enfant", text: "Exprimer ses besoins, ses emotions et ses choix avec des pictogrammes simples et une voix rassurante." },
            { title: "Parent", text: "Suivre les phrases utilisees a la maison, encourager l'autonomie et garder un lien clair avec le therapeute." },
            { title: "Therapeute", text: "Construire des themes de communication, adapter les pictogrammes et observer les progres de chaque enfant." },
            { title: "Administrateur", text: "Organiser les comptes, les acces et la bibliotheque visuelle pour garder une plateforme claire et fiable." },
            { title: "Agent IA", text: "Proposer des pictogrammes, analyser les habitudes de communication et recommander des exercices adaptes." },
          ]
        : [
            { title: "Child", text: "Express needs, emotions and choices with simple pictograms and a reassuring spoken voice." },
            { title: "Parent", text: "Follow phrases used at home, encourage autonomy and keep a clear link with the therapist." },
            { title: "Therapist", text: "Build communication themes, adapt pictograms and observe each child's progress over time." },
            { title: "Administrator", text: "Organize accounts, access and the visual library so the platform stays clear and reliable." },
            { title: "AI Agent", text: "Suggest pictograms, analyze communication habits and recommend adapted practice activities." },
          ],
    [language],
  );

  const gridChoices = [
    { id: "small", title: t("gridSmall"), subtitle: "4x4", text: t("gridSmallDesc"), columns: 4, recommended: false },
    { id: "medium", title: t("gridMedium"), subtitle: "7x5", text: t("gridMediumDesc"), columns: 5, recommended: true },
    { id: "large", title: t("gridLarge"), subtitle: "10x6", text: t("gridLargeDesc"), columns: 6, recommended: false },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="glass-panel flex items-center justify-between rounded-[30px] px-5 py-4 shadow-card">
        <div>
          <p className="font-display text-2xl font-extrabold text-slateBlue">Auto Connect</p>
          <p className="text-sm text-slate-500">{t("brandTagline")}</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setOpenGrid(true)}>
            <Grid3X3 className="h-4 w-4" />
            {t("navGrid")}
          </Button>
          <Button variant="secondary" onClick={() => setOpenLanguage(true)}>
            <Globe className="h-4 w-4" />
            {t("navLanguage")}
          </Button>
          <Button onClick={openLoginModal}>{t("navLogin")}</Button>
        </div>
      </nav>

      <section className="mt-10 grid items-center gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[36px] bg-white/85 p-8 shadow-soft md:p-12">
          <span className="inline-flex rounded-full bg-softBlue/12 px-4 py-2 text-sm font-semibold text-slateBlue">
            {t("landingBadge")}
          </span>
          <h1 className="mt-6 max-w-2xl font-display text-4xl font-extrabold leading-[1.12] text-ink md:text-5xl xl:text-[3.35rem]">
            {heroTitleLines.map((line) => (
              <span key={line} className="block">
                {line}
              </span>
            ))}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">{t("landingLead")}</p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Button className="min-w-44" onClick={openLoginModal}>
              {t("landingDemo")}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a href="#services">
              <Button variant="secondary" className="min-w-44">
                {t("landingServicesButton")}
              </Button>
            </a>
          </div>
        </div>

        <div className="space-y-6">
          <div className="overflow-hidden rounded-[36px] bg-white/90 p-4 shadow-soft">
            <img
              src={heroChildAac}
              alt="Enfant utilisant une tablette de pictogrammes"
              className="h-full w-full rounded-[28px] object-cover"
            />
          </div>
          <div className="section-shell grid gap-4 p-6 sm:grid-cols-2">
            {(language === "fr"
              ? [
                  "Grille pictogrammes expressive",
                  "Synthese vocale dans le navigateur",
                  "Parcours enfant simplifie",
                  "Dashboards parents et therapeutes",
                ]
              : [
                  "Expressive pictogram grid",
                  "Speech synthesis in the browser",
                  "Simplified child journey",
                  "Parent and therapist dashboards",
                ]).map((item) => (
              <div key={item} className="rounded-[28px] bg-softBlue/10 p-5 text-sm font-semibold text-ink">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="mt-16 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="overflow-hidden rounded-[36px] bg-white/90 p-3 shadow-card">
          <img
            src={heroKidsAcc}
            alt="Child using Auto Connect pictograms on a tablet"
            className="h-full min-h-[340px] w-full rounded-[28px] object-cover object-center"
          />
        </div>
        <Card title={t("landingAboutTitle")} className="p-7">
          <p className="text-sm leading-7 text-slate-600">{t("landingAbout1")}</p>
          <p className="mt-4 text-sm leading-7 text-slate-600">{t("landingAbout2")}</p>
        </Card>
      </section>

      <section id="services" className="mt-16">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-extrabold text-ink">{t("landingServicesTitle")}</h2>
          <p className="mt-2 text-slate-500">{t("landingServicesLead")}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => (
            <div key={service} className="section-shell rounded-[30px] p-6">
              <p className="font-semibold text-ink">{service}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-extrabold text-ink">{t("landingFeaturesTitle")}</h2>
        </div>
        <div className="grid gap-5 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} title={feature.title} icon={feature.icon} className="h-full">
              <p className="text-sm leading-7 text-slate-600">{feature.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section id="roles" className="mt-16">
        <div className="mb-6">
          <h2 className="font-display text-3xl font-extrabold text-ink">{t("landingRolesTitle")}</h2>
          <p className="mt-2 text-slate-500">{t("landingRolesLead")}</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => (
            <Card key={role.title} title={role.title} icon={role.icon} className="h-full">
              <p className="text-sm leading-7 text-slate-600">{role.text}</p>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <RoleOverview
          title={language === "fr" ? "Organisation des interfaces selon les roles" : "Interface organization by role"}
          description={
            language === "fr"
              ? "Chaque espace est pense autour du meme theme: aider l'enfant a communiquer avec des pictogrammes, une voix synthetisee, un suivi familial et des recommandations IA adaptees."
              : "Each workspace is built around the same theme: helping children communicate with pictograms, synthesized speech, family follow-up and adapted AI recommendations."
          }
          items={roleFlows}
          accent="bg-lilac/20"
        />
      </section>

      <section id="contact" className="mt-16">
        <Card title={t("landingContactTitle")} className="p-7">
          <div className="grid gap-5 md:grid-cols-3">
            <div className="rounded-[28px] bg-softBlue/10 p-5">
              <Mail className="h-5 w-5 text-slateBlue" />
              <p className="mt-3 font-semibold text-ink">Email</p>
              <p className="mt-2 text-sm text-slate-600">contact@autoconnect.app</p>
            </div>
            <div className="rounded-[28px] bg-lilac/20 p-5">
              <Phone className="h-5 w-5 text-slateBlue" />
              <p className="mt-3 font-semibold text-ink">{language === "fr" ? "Telephone" : "Phone"}</p>
              <p className="mt-2 text-sm text-slate-600">+216 70 000 000</p>
            </div>
            <div className="rounded-[28px] bg-peach/35 p-5">
              <MapPin className="h-5 w-5 text-slateBlue" />
              <p className="mt-3 font-semibold text-ink">{language === "fr" ? "Adresse" : "Address"}</p>
              <p className="mt-2 text-sm text-slate-600">Tunis, Tunisie</p>
            </div>
          </div>
        </Card>
      </section>

      <footer className="mt-16 rounded-[28px] bg-white/80 px-6 py-6 shadow-card">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-xl font-extrabold text-slateBlue">Auto Connect</p>
            <p className="mt-1 text-sm text-slate-500">{t("brandTagline")}</p>
            <p className="mt-3 text-xs text-slate-400">Copyright 2026 Auto Connect. All rights reserved.</p>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <a href="#about">{t("footerAbout")}</a>
            <a href="#services">{t("footerServices")}</a>
            <a href="#contact">{t("footerContact")}</a>
          </div>
        </div>
      </footer>

      <Modal
        open={openLogin}
        onClose={closeLoginModal}
        panelClassName="max-w-3xl md:p-8"
        contentClassName="max-h-none overflow-visible"
      >
        <LoginPanel compact onSuccess={handleLoginSuccess} />
      </Modal>

      <Modal open={openLanguage} title={t("modalLanguageTitle")} onClose={() => setOpenLanguage(false)} panelClassName="max-w-5xl">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(255,220,190,0.28),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(180,255,205,0.20),transparent_26%),#fffaf5] rounded-[30px] p-4 md:p-8">
          <div className="text-center">
            <p className="font-display text-4xl font-extrabold text-[#21160f] md:text-6xl">{t("modalLanguageTitle")}</p>
            <p className="mt-4 text-2xl text-[#1673a6] md:text-4xl">{t("modalLanguageSubtitle")}</p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setLanguage("fr")}
              className={`focus-ring rounded-[40px] bg-[#fff6ef] p-8 text-center shadow-card transition hover:-translate-y-1 ${language === "fr" ? "ring-4 ring-softBlue/30" : ""}`}
            >
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#2147a8] text-6xl shadow-soft">
                <span>🇫🇷</span>
              </div>
              <h3 className="mt-8 font-display text-4xl font-extrabold text-[#1d140e]">Francais</h3>
              <p className="mt-3 text-2xl text-[#1d140e]">French</p>
            </button>

            <button
              type="button"
              onClick={() => setLanguage("en")}
              className={`focus-ring rounded-[40px] bg-[#fff6ef] p-8 text-center shadow-card transition hover:-translate-y-1 ${language === "en" ? "ring-4 ring-softBlue/30" : ""}`}
            >
              <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-[#0c203d] text-6xl shadow-soft">
                <span>🇬🇧</span>
              </div>
              <h3 className="mt-8 font-display text-4xl font-extrabold text-[#1d140e]">English</h3>
              <p className="mt-3 text-2xl text-[#1d140e]">Anglais</p>
            </button>
          </div>
        </div>
      </Modal>

      <Modal open={openGrid} title={t("modalGridTitle")} onClose={() => setOpenGrid(false)} panelClassName="max-w-6xl">
        <div className="bg-[radial-gradient(circle_at_top_left,rgba(255,220,190,0.24),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(180,255,205,0.18),transparent_26%),#fffaf5] rounded-[30px] p-4 md:p-8">
          <div className="text-center">
            <p className="font-display text-4xl font-extrabold text-[#21160f] md:text-6xl">{t("modalGridTitle")}</p>
            <p className="mt-4 text-xl text-slate-600 md:text-3xl">{t("modalGridSubtitle")}</p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {gridChoices.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => setPendingGrid(choice.id)}
                className={`rounded-[36px] bg-[#fff6ef] p-8 text-left shadow-card transition hover:-translate-y-1 ${pendingGrid === choice.id ? "ring-4 ring-slateBlue/25" : ""}`}
              >
                {choice.recommended ? (
                  <span className="mb-5 inline-flex rounded-full bg-slateBlue px-4 py-2 text-xs font-bold uppercase tracking-wide text-white">
                    {t("recommended")}
                  </span>
                ) : null}
                <div className="rounded-[28px] bg-white p-6">
                  <div className={`grid gap-2 ${choice.columns === 4 ? "grid-cols-4" : choice.columns === 5 ? "grid-cols-5" : "grid-cols-6"}`}>
                    {Array.from({ length: choice.columns * 4 }).map((_, index) => (
                      <span key={index} className="h-8 rounded-xl bg-softBlue/20" />
                    ))}
                  </div>
                </div>
                <h3 className="mt-6 font-display text-3xl font-extrabold text-[#1d140e]">{choice.title}</h3>
                <p className="mt-2 text-lg font-semibold uppercase tracking-wide text-slateBlue">{choice.subtitle}</p>
                <p className="mt-4 text-base leading-7 text-slate-600">{choice.text}</p>
              </button>
            ))}
          </div>

          <div className="mt-10 text-center">
            <Button
              className="min-w-[280px] rounded-full px-8 py-4 text-base"
              onClick={() => {
                setGridSize(pendingGrid);
                setOpenGrid(false);
              }}
            >
              {t("gridApply")}
              <ArrowRight className="h-5 w-5" />
            </Button>
            <p className="mt-4 text-sm text-slate-500">{t("gridHelp")}</p>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default LandingPage;
