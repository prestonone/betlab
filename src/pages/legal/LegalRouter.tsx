import { useLocation, useNavigate } from "react-router-dom";
import LegalCentrePage from "./LegalCentrePage";
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
  const backToCentre = () => {
    navigate("/legal");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (!slug) {
    return <LegalCentrePage onOpen={openDocument} />;
  }

  const doc = getLegalDocument(slug);
  if (!doc) {
    return <LegalCentrePage onOpen={openDocument} />;
  }

  return <LegalPageLayout doc={doc} onBack={backToCentre} />;
}
