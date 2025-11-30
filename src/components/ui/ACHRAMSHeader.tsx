import React from 'react';
import { X } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import Image from "next/image"

interface ACHRAMSHeaderProps {
  title: string;
  showBackButton?: boolean;
  onBackClick?: () => void;
  showLogo?: boolean; // New prop to control logo visibility
  className?: string;
}

const ACHRAMSHeader: React.FC<ACHRAMSHeaderProps> = ({
  title,
  showBackButton = false,
  onBackClick,
  showLogo = true, // Default to true to maintain existing behavior on other screens
  className = "",
}) => {
  return (
    <div
      className={twMerge(
        " text-achrams-text-light  flex items-center gap-4 ",
        className
      )}
    >
      {/* Conditionally render the Logo Container */}
      {showLogo && (<>
        <div className="max-w-7xl mx-auto">
  <div className="flex items-center h-20 space-x-3">
    {/* Logo Box */}
    <div className="w-12 h-12 bg-achrams-gradient-primary rounded-xl flex items-center justify-center shadow-lg">
      <Image
        src="/images/logo.png"
        alt="ACHRAMS Logo"
        width={25}
        height={25}
        className="object-contain"
      />
    </div>

    {/* Title + Subtitle */}
    <div className="text-left flex flex-col items-start">
      <h1 className="text-2xl font-bold text-white ">
        ACHRAMS
      </h1>
      {/* text-achrams-primary-solid */}
      <p className="text-xs text-gray-300">
        Official Airport Car Hire
      </p>
    </div>
  </div>
</div>


      
      </>
      )}

      {showBackButton && (
        <button
          onClick={onBackClick}
          aria-label="Go back"
          className="p-1" // Add padding for touch target size
        >
          <X className="w-6 h-6" />
        </button>
      )}
      <h2 className="text-lg font-bold flex-1 text-center">
        {title}
      </h2>
    </div>
  );
};

export default ACHRAMSHeader;