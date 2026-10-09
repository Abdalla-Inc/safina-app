import { GraduationCap, Library } from "lucide-react";
import "./LearningTabs.css";
export function LearningTabs({ active }) {
  return (
    <nav className="learning-tabs" aria-label="الدورات والمكتبة">
      <a
        href="#/classroom"
        aria-current={active === "courses" ? "page" : undefined}
      >
        <GraduationCap size={18} />
        الدورات
      </a>
      <a
        href="#/library"
        aria-current={active === "library" ? "page" : undefined}
      >
        <Library size={18} />
        المكتبة
      </a>
    </nav>
  );
}
