import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { GraduationCap, BookOpen, Star, Users, ArrowRight, ArrowLeft } from "lucide-react";

export default function Index() {
  const { user, isAdmin } = useAuth();
  const { t, dir } = useLanguage();

  const ArrowIcon = dir === "rtl" ? ArrowLeft : ArrowRight;

  const features = [
    { icon: BookOpen, title: t.landing.features.premiumCourses, description: t.landing.features.premiumCoursesDesc },
    { icon: Star, title: t.landing.features.earnPoints, description: t.landing.features.earnPointsDesc },
    { icon: Users, title: t.landing.features.joinBatches, description: t.landing.features.joinBatchesDesc },
  ];

  return (
    <div className="min-h-screen bg-background" dir={dir}>
      {/* Hero */}
      <header className="gradient-hero text-primary-foreground">
        <nav className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-8 h-8" />
            <span className="text-xl font-display font-bold">{t.common.brandName}</span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link to={isAdmin ? "/admin" : "/dashboard"}>
                <Button variant="secondary">{t.landing.goToDashboard}</Button>
              </Link>
            ) : (
              <Link to="/auth">
                <Button variant="secondary">{t.common.signIn}</Button>
              </Link>
            )}
          </div>
        </nav>

        <div className="container mx-auto px-6 py-20 text-center">
          <h1 className="text-4xl md:text-6xl font-display font-bold mb-6 animate-fade-in">
            {t.landing.title}<br />{t.landing.subtitle}
          </h1>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            {t.landing.description}
          </p>
          <Link to="/auth">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              {t.landing.getStarted} <ArrowIcon className="w-5 h-5 ms-2" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Features */}
      <section className="container mx-auto px-6 py-20">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <div key={i} className="text-center p-8 rounded-2xl bg-card shadow-lg animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl gradient-primary flex items-center justify-center">
                <feature.icon className="w-8 h-8 text-primary-foreground" />
              </div>
              <h3 className="text-xl font-display font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
