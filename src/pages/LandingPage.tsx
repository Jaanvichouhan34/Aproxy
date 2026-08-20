import React from 'react';
import { Navbar } from '../components/Navbar';
import { Hero } from '../components/Hero';
import { StatsBanner } from '../components/StatsBanner';
import { HowItWorks } from '../components/HowItWorks';
import { FeaturesMatrix } from '../components/FeaturesMatrix';
import { ThreatDefense } from '../components/ThreatDefense';
import { Footer } from '../components/Footer';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark flex flex-col transition-colors duration-200">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <StatsBanner />
        <HowItWorks />
        <FeaturesMatrix />
        <ThreatDefense />
      </main>
      <Footer />
    </div>
  );
};
