import { type FC } from 'react';
import { Layout } from '@/widgets/layout';
import { HeroSection } from '@/widgets/onboarding/ui/HeroSection';
import { FeaturesSection } from '@/widgets/onboarding/ui/FeaturesSection';

export const HomePage: FC = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
    </Layout>
  );
};