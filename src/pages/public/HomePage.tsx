import { HeroSection } from '@/features/home/components/sections/HeroSection';
import { StatsSection } from '@/features/home/components/sections/StatsSection';
import { TrendingSection } from '@/features/home/components/sections/TrendingSection';
import { FeaturesGridSection } from '@/features/home/components/sections/FeaturesGridSection';
import { CollectionsSection } from '@/features/home/components/sections/CollectionsSection';
import { HowItWorksSection } from '@/features/home/components/sections/HowItWorksSection';
import { CaseStudySection } from '@/features/home/components/sections/CaseStudySection';
import { ReviewSection } from '@/features/home/components/sections/ReviewSection';
import { NewsletterSection } from '@/features/home/components/sections/NewsletterSection';
import { CTASection } from '@/features/home/components/sections/CTASection';

export default function HomePage() {
  return (
    <div className="bg-[var(--bg-primary)] text-[var(--text-primary)] font-sans min-h-screen selection:bg-[#00A3DB] selection:text-white">
      {/* Global Animation Styles */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 3s linear infinite;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>

      {/* Modular Page Sections */}
      <HeroSection />
      <StatsSection />
      <TrendingSection />
      <FeaturesGridSection />
      <CollectionsSection />
      <HowItWorksSection />
      <CaseStudySection />
      <ReviewSection />
      <NewsletterSection />
      <CTASection />
    </div>
  );
}