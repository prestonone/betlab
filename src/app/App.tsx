import { useEffect, useState } from "react";
import { BarChart2 } from "lucide-react";

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


function initialPage(): Page {
  const params = new URLSearchParams(window.location.search);
  if (params.get("payment") === "callback") {
    return "dashboard";
  }
  if (params.get("reset") === "1") {
    return "reset-password";
  }
  if (params.get("verify") === "1") {
    return "verify-email";
  }

  const storedPage = window.location.hash.replace(/^#\/?/, "") as Page;
  const pages: Page[] = [
    "home", "pricing", "login", "register", "dashboard",
    "predictions", "results", "about", "contact",
  ];
  return pages.includes(storedPage) ? storedPage : "home";
}


export default function App() {
  const [page, setPage] = useState<Page>(initialPage);
  const { isAuthenticated: authed, isLoading: authLoading, logout } = useAuth();

  useEffect(() => {
    if (!authLoading && page === "dashboard" && !authed) {
      setPage("login");
    }
  }, [authLoading, authed, page]);

  const setAuthed = (value: boolean) => {
    if (!value) logout();
  };

  const nav = (nextPage: Page) => {
    setPage(nextPage);
    window.history.replaceState(null, "", `${window.location.pathname}#/${nextPage}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isDash = page === "dashboard";

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-[#D4AF37] flex items-center justify-center mx-auto mb-3">
            <BarChart2 size={18} className="text-[#070E1A]" />
          </div>
          <p className="font-[JetBrains_Mono,monospace] text-[9px] uppercase tracking-widest text-white/35">
            Restoring secure session
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
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
