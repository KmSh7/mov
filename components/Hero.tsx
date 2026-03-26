'use client';

export default function Hero() {
  return (
    <section className="w-full min-h-[60vh] bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
      {/* Full Width Image Container */}
      <div className="w-full h-full flex items-center justify-center p-4">
        <div className="relative w-full max-w-6xl">
          {/* Glow effect */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-orange-500/20 blur-[80px] rounded-full"></div>
          <img 
            src="/bandname.png" 
            alt="Zivic Theatre" 
            className="relative w-full h-auto object-contain z-10"
          />
        </div>
      </div>
    </section>
  );
}