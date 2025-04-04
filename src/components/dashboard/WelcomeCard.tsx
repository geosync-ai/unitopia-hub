
import React from 'react';

interface WelcomeCardProps {
  name: string;
  date: string;
  greeting?: string;
  location?: string;
}

const WelcomeCard: React.FC<WelcomeCardProps> = ({ 
  name, 
  date, 
  greeting = "Have a productive day!",
  location
}) => {
  return (
    <div className="bg-intranet-primary text-white p-4 rounded-xl relative overflow-hidden shadow-md animate-fade-in">
      <div className="absolute right-0 top-0 h-full w-1/3 flex items-center justify-center opacity-90">
        <img 
          src="/lovable-uploads/b166a9bc-0aab-4f5a-be16-646f0fb087cc.png" 
          alt="Dashboard illustration" 
          className="h-full object-contain"
        />
      </div>
      
      <div className="z-10 relative w-2/3">
        <div className="text-xs font-light mb-1">{date}</div>
        <h1 className="text-xl font-bold mb-1">Good Day, {name}!</h1>
        <p className="opacity-90 text-sm">{greeting}</p>
        {location && <p className="opacity-80 mt-1 text-xs">{location}</p>}
      </div>
    </div>
  );
};

export default WelcomeCard;
