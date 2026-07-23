import { useLocation, useNavigate } from "react-router-dom";
import LegalCentrePage from "./LegalCentrePage";
import PolicyChangeLogPage from "./PolicyChangeLogPage";
import LegalContactPage from "./LegalContactPage";
import LegalPageLayout from "../../components/legal/LegalPageLayout";
import { getLegalDocument } from "../../legal/registry";

export default function LegalRouter() {
  const location = useLocation();
  const navigate = useNavigate();

  const slug = location.pathname.replace(/^\/legal\/?/, "").replace(/\/$/, "");
  const openDocument = (docSlug: string) => {
    navigate(`/legal/${docSlug}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const openRoute = (path: string) => {
    navigate(path);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const backToCentre = () => {
    navigate("/legal");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!slug) {
    return <LegalCentrePage onOpen={openDocument} onOpenRoute={openRoute} />;
  }

  if (slug === "changes") {
    return <PolicyChangeLogPage onBack={backToCentre} onOpenPolicy={openDocument} />;
  }

  if (slug === "contact") {
    return <LegalContactPage onBack={backToCentre} />;
  }

  const doc = getLegalDocument(slug);
  if (!doc) {
    return <LegalCentrePage onOpen={openDocument} onOpenRoute={openRoute} />;
  }

  return <LegalPageLayout doc={doc} onBack={backToCentre} />;
}
