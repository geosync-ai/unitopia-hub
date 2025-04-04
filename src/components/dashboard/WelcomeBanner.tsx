
import React from 'react';

interface WelcomeBannerProps {
  imageUrl?: string;
}

const WelcomeBanner: React.FC<WelcomeBannerProps> = ({ 
  imageUrl = "https://picsum.photos/id/1033/1200/300" // Default banner image
}) => {
  return (
    <div className="relative w-full h-36 sm:h-48 lg:h-60 rounded-xl overflow-hidden mb-6 animate-fade-in">
      <img
        src={imageUrl}
        alt="SCPNG Welcome Banner"
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-intranet-primary/80 to-transparent flex flex-col justify-center px-6 md:px-10">
        <div className="max-w-xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2">Welcome to SCPNG Intranet</h2>
          <p className="text-sm sm:text-base text-white/80 max-w-md">
            Your central hub for resources, information, and collaboration tools
          </p>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner;
