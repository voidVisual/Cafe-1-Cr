import React from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectFade } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/effect-fade';

const bestSellers = [
  {
    id: 1,
    name: "Signature Espresso",
    image: "/images/signature_espresso.png",
    desc: "A rich, full-bodied espresso with notes of dark chocolate and caramel."
  },
  {
    id: 2,
    name: "Avocado Toast",
    image: "/images/avocado_toast.png",
    desc: "Sourdough toast topped with smashed avocado, poached egg, and chili flakes."
  },
  {
    id: 3,
    name: "Iced Cold Brew",
    image: "/images/iced_cold_brew.png",
    desc: "Slow-steeped for 18 hours for a super smooth, highly caffeinated experience."
  }
];

export default function BestSellers() {
  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="font-serif text-4xl font-bold text-coffee-900 mb-6">Our Best Sellers</h2>
          <p className="text-coffee-600 text-lg">
            The items our customers keep coming back for.
          </p>
        </div>

        <div className="w-full max-w-5xl mx-auto rounded-3xl overflow-hidden shadow-2xl relative">
          <Swiper
            modules={[Autoplay, EffectFade]}
            effect="fade"
            autoplay={{ delay: 5000, disableOnInteraction: false }}
            loop={true}
            className="w-full h-[500px]"
          >
            {bestSellers.map((item) => (
              <SwiperSlide key={item.id} className="relative w-full h-full">
                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-8 md:p-16">
                  <h3 className="text-3xl md:text-5xl font-serif font-bold text-white mb-4">{item.name}</h3>
                  <p className="text-white/80 text-lg md:text-xl max-w-xl">{item.desc}</p>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>
    </section>
  );
}
