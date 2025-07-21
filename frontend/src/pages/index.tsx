import { BentoCard, BentoGrid } from "@/components/ui/bento-grid";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowRight,
  BarChart,
  BrainCircuit,
  Globe as GlobeIcon,
  Newspaper,
  ShieldCheck,
  Zap,
} from "lucide-react";
import dynamic from "next/dynamic";
import { useRouter } from "next/router";
import { useEffect } from "react";

const HeroAnimation = dynamic(
  () => import("../components/ui/HeroAnimation").then((m) => m.default),
  {
    ssr: false,
  }
);

const features = [
  {
    Icon: Newspaper,
    name: "Real-time News Aggregation",
    description:
      "Connect your portfolio and receive a curated feed of financial news from top-tier sources, updated in real-time.",
    href: "/",
    cta: "Learn more",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-transparent dark:from-blue-900/20 dark:to-transparent opacity-30"></div>
    ),
    className: "lg:col-start-1 lg:col-end-2 lg:row-start-1 lg:row-end-3",
  },
  {
    Icon: BrainCircuit,
    name: "AI-Powered Sentiment Analysis",
    description:
      "Our advanced models analyze each news article to provide a clear sentiment score, helping you cut through the noise.",
    href: "/",
    cta: "Learn more",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-green-100 to-transparent dark:from-green-900/20 dark:to-transparent opacity-30"></div>
    ),
    className: "lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: BarChart,
    name: "Actionable Recommendations",
    description:
      "Get data-driven 'buy', 'sell', or 'hold' signals based on aggregated sentiment trends for your specific assets.",
    href: "/",
    cta: "Learn more",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-red-100 to-transparent dark:from-red-900/20 dark:to-transparent opacity-30"></div>
    ),
    className: "lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3",
  },
  {
    Icon: ShieldCheck,
    name: "Secure Portfolio Management",
    description:
      "Upload and manage your holdings with confidence. Your data is encrypted and secure.",
    href: "/",
    cta: "Learn more",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-transparent dark:from-purple-900/20 dark:to-transparent opacity-30"></div>
    ),
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-1 lg:row-end-2",
  },
  {
    Icon: Zap,
    name: "Lightning Fast Insights",
    description:
      "Our optimized backend processes data instantly, so you never miss a market-moving moment.",
    href: "/",
    cta: "Learn more",
    background: (
      <div className="absolute inset-0 bg-gradient-to-br from-yellow-100 to-transparent dark:from-yellow-900/20 dark:to-transparent opacity-30"></div>
    ),
    className: "lg:col-start-3 lg:col-end-4 lg:row-start-2 lg:row-end-3",
  },
];

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden">
      <header className="container mx-auto h-20 flex items-center justify-between px-4 z-30 relative">
        <div className="flex items-center gap-2 text-xl font-bold">
          <GlobeIcon className="h-6 w-6" />
          <h1>SSA</h1>
        </div>
        <nav className="flex items-center gap-2">
          <ModeToggle />
          <Button variant="ghost" onClick={() => router.push("/login")}>
            Login
          </Button>
          <Button onClick={() => router.push("/register")}>
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </nav>
      </header>

      <main className="relative">
        <div className="container mx-auto text-center pt-20 pb-32 md:pt-32 md:pb-48 relative z-20">
          <h2 className="text-4xl md:text-7xl font-extrabold tracking-tight leading-tight mb-6 animate-fade-in-up bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
            The Market Doesn't Wait. <br /> Neither Should You.
          </h2>
          <p className="text-lg md:text-xl max-w-3xl mx-auto text-muted-foreground mb-10 opacity-0 animate-fade-in animation-delay-500">
            Harness AI sentiment analysis to get a real-time edge on your
            investments. Make smarter, faster, data-driven decisions.
          </p>
          <div className="opacity-0 animate-fade-in animation-delay-1000">
            <Button
              size="lg"
              onClick={() => router.push("/register")}
              className="animate-background-shine bg-[length:200%_100%] bg-gradient-to-r from-primary via-primary/80 to-primary text-primary-foreground"
            >
              Analyze My Portfolio Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-[800px] z-10 opacity-50 dark:opacity-60">
          <HeroAnimation />
        </div>
      </main>

      <section className="container mx-auto py-24 px-4">
        <h3 className="text-4xl font-bold text-center mb-12">
          An Unfair Advantage
        </h3>
        <BentoGrid>
          {features.map((feature) => (
            <BentoCard key={feature.name} {...feature} />
          ))}
        </BentoGrid>
      </section>

      <section className="bg-muted/50 dark:bg-background/20 py-24">
        <div className="container mx-auto text-center">
          <h3 className="text-4xl font-bold mb-4">
            Ready to Elevate Your Strategy?
          </h3>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-8">
            Stop guessing. Start analyzing. Create your free account and get
            immediate insights into what the market is *really* thinking about
            your stocks.
          </p>
          <Button size="lg" onClick={() => router.push("/register")}>
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      <footer className="container mx-auto py-8 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} SSA. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
