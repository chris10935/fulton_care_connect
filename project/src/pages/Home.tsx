import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, UtensilsCrossed, Home as HomeIcon, HeartPulse, Brain, Bus, Lightbulb, Briefcase } from 'lucide-react';
import { CATEGORIES } from '../lib/constants';
import { logSearch } from '../lib/analytics';

const iconMap: Record<string, any> = {
  UtensilsCrossed,
  Home: HomeIcon,
  Hotel: HomeIcon,
  HeartPulse,
  Brain,
  Bus,
  Lightbulb,
  Briefcase,
  GraduationCap: Briefcase,
  DollarSign: Briefcase,
  Scale: Briefcase,
};

export function Home() {
  const navigate = useNavigate();
  const [city, setCity] = useState('');
  const [error, setError] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = city.trim();
    if (!trimmed) {
      navigate('/directory');
      return;
    }

    logSearch(trimmed);
    navigate(`/directory?city=${encodeURIComponent(trimmed)}`);
  };

  const handleCategoryClick = (categoryId: string) => {
    logSearch(undefined, categoryId);
    navigate(`/directory?category=${categoryId}`);
  };

  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-b from-[#2563eb] to-[#1d4ed8] text-white py-12 sm:py-20">
        <video autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover z-0">
          <source src="/atl.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="absolute inset-0 bg-black/40 z-10" aria-hidden="true" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-20">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6 animate-pop-up">
            Fulton Care Connect
          </h1>
          <p className="text-base sm:text-xl md:text-2xl mb-6 sm:mb-8 text-blue-100 animate-pop-up animate-delay-150">
            Find free and low-cost help across Fulton County
          </p>

          <form onSubmit={handleSearch} className="max-w-2xl mx-auto animate-pop-up animate-delay-300">
            <div className="bg-white rounded-lg shadow-lg p-2 flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Enter your city (optional)"
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setError('');
                }}
                className="flex-1 px-4 py-3 text-gray-900 rounded focus:outline-none text-sm sm:text-base"
              />
              <button
                type="submit"
                className="bg-[#fb923c] hover:bg-[#ea580c] text-white px-6 sm:px-8 py-3 rounded font-semibold transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              >
                <Search className="w-5 h-5" />
                Search
              </button>
            </div>
            {error && (
              <p className="text-red-200 text-sm mt-2">{error}</p>
            )}
          </form>

          <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row flex-wrap gap-3 justify-center items-center animate-pop-up animate-delay-500">
            <button
              onClick={() => navigate('/directory')}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full transition-colors text-sm w-full sm:w-auto"
            >
              Browse All Resources
            </button>
            <button
              onClick={() => navigate('/ai')}
              className="bg-white/10 hover:bg-white/20 text-white px-6 py-2.5 rounded-full transition-colors text-sm w-full sm:w-auto"
            >
              Ask AI for Help
            </button>

          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Browse by Category
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((category) => {
            const Icon = iconMap[category.icon] || HomeIcon;
            const isUrlIcon = typeof category.icon === 'string' && (category.icon.startsWith('http') || category.icon.startsWith('data:'));
            return (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border border-gray-200 flex flex-col items-center gap-3 group"
              >
                <div className="w-12 h-12 bg-[#2563eb]/10 rounded-full flex items-center justify-center group-hover:bg-[#2563eb]/20 transition-colors">
                  {isUrlIcon ? (
                    // external image icon
                    // eslint-disable-next-line jsx-a11y/img-redundant-alt
                    <img src={category.icon as string} alt={`${category.label} icon`} className="w-6 h-6 object-contain" />
                  ) : (
                    <Icon className="w-6 h-6 text-[#2563eb]" />
                  )}
                </div>
                <span className="font-medium text-gray-900 text-center">
                  {category.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-[#fb923c]/10 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="bg-white rounded-lg shadow-md p-8">
            <img src="/icons8-phonelink-ring.gif" alt="Phone ringing" className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Need Immediate Help?
            </h2>
            <div className="space-y-3 text-left max-w-md mx-auto">
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Mental Health Crisis:</span>
                <a href="tel:988" className="text-[#2563eb] font-bold text-xl hover:underline">
                  988
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Emergency Services:</span>
                <a href="tel:911" className="text-[#2563eb] font-bold text-xl hover:underline">
                  911
                </a>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700">Community Resources:</span>
                <a href="tel:211" className="text-[#2563eb] font-bold text-xl hover:underline">
                  211
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
