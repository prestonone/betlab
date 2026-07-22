import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import AnimatedFavicon from "../components/AnimatedFavicon";
import AnimatedLogoMark from "../components/AnimatedLogoMark";
import Footer from "../components/layout/Footer";
import Navbar from "../components/layout/Navbar";
import { useAuth } from "../contexts/AuthContext";
import AboutPage from "../pages/AboutPage";
import AuthPage from "../pages/AuthPage";
import ContactPage from "../pages/ContactPage";
import DashboardPage from "../pages/DashboardPage";
import HomePage from "../pages/HomePage";
import PredictionsPage from "../pages/PredictionsPage";
import PredictionsMarketingPage from "../pages/PredictionsMarketingPage";
import PricingPage from "../pages/PricingPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import ResultsPage from "../pages/ResultsPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import { cn, type Page } from "./shared";


const PATH_FOR: Record<Page, string> = {
  "home": "/",
  "pricing": "/pricing",
  "login": "/login",
  "register": "/register",
  "dashboard": "/dashboard",
  "predictions": "/predictions",
  "results": "/results",
  "about": "/about",
  "contact": "/contact",
  "reset-password": "/reset-password",
  "verify-email": "/verify-email",
};

const PAGE_FOR_PATH: Record<string, Page> = Object.fromEntries(
  Object.entries(PATH_FOR).map(([page, path]) => [path, page as Page]),
);

function pageForPathname(pathname: string): Page {
  return PAGE_FOR_PATH[pathname] ?? "home";
}

const TITLE_FOR: Record<Page, string> = {
  "home": "Bet Lab | Football Predictions & Betting Intelligence",
  "pricing": "Pricing | Bet Lab",
  "login": "Sign In | Bet Lab",
  "register": "Get Lab Access | Bet Lab",
  "dashboard": "Dashboard | Bet Lab",
  "predictions": "Today's Predictions | Bet Lab",
  "results": "Results | Bet Lab",
  "about": "About | Bet Lab",
  "contact": "Contact | Bet Lab",
  "reset-password": "Reset Password | Bet Lab",
  "verify-email": "Verify Email | Bet Lab",
};


export default function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const page = pageForPathname(location.pathname);
  const { isAuthenticated: authed, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && page === "dashboard" && !authed) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, authed, page, navigate]);

  useEffect(() => {
    document.title = TITLE_FOR[page];
  }, [page]);

  const setAuthed = (value: boolean) => {
    if (!value) logout();
  };

  const nav = (nextPage: Page) => {
    navigate(PATH_FOR[nextPage]);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isDash = page === "dashboard";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <AnimatedLogoMark size={40} radius={8} className="mx-auto mb-3" />
          <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35">
            Restoring secure session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AnimatedFavicon />
      <Navbar page={page} nav={nav} authed={authed} setAuthed={setAuthed} />

      <div className={cn("animate-fade-in")}>
        {page === "home" && <HomePage nav={nav} />}
        {page === "pricing" && <PricingPage nav={nav} authed={authed} />}
        {page === "login" && <AuthPage mode="login" nav={nav} />}
        {page === "register" && <AuthPage mode="register" nav={nav} />}
        {page === "dashboard" && <DashboardPage nav={nav} />}
        {page === "predictions" && (authed
          ? <PredictionsPage nav={nav} authed={authed} />
          : <PredictionsMarketingPage nav={nav} />)}
        {page === "results" && <ResultsPage />}
        {page === "about" && <AboutPage nav={nav} />}
        {page === "contact" && <ContactPage />}
        {page === "reset-password" && <ResetPasswordPage nav={nav} />}
        {page === "verify-email" && <VerifyEmailPage nav={nav} />}
      </div>

      {!isDash && <Footer nav={nav} />}
    </div>
  );
}
