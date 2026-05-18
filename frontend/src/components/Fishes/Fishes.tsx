import { useEffect, useRef, useState } from 'react';
import './fishes.css'

const FISHES = [
  {
    name: 'Bluefin Tuna',
    sci_name: '(Thunnus thynnus)',
    img: 'fishes/bluefin-tuna.png',
    description: 'As a top-tier apex predator, the Bluefin Tuna maintains the health of the Mediterranean food web by regulating mid-sized fish populations. Its status as the "gold of the sea" in the global sushi market drives intense industrial purse-seine fishing, often targeting them before they reach breeding age.',
  },
  {
    name: 'Atlantic Cod',
    sci_name: '(Gadus morhua)',
    img: 'fishes/atlantic-cod.png',
    description: 'A keystone species of the North Sea, Cod have historically balanced the seafloor ecosystem. Decades of bottom trawling and climate-driven temperature shifts have pushed stocks to the brink; without strict monitoring, the loss of this predator triggers a "trophic cascade" where prey species overpopulate and deplete local resources.',
  },
  {
    name: 'Swordfish',
    sci_name: '(Xiphias gladius)',
    img: 'fishes/swordfish.png',
    description: 'Swordfish are vital indicators of ocean health, migrating vast distances and connecting different marine zones. They are heavily targeted by longline fisheries; because they are slow to mature and often caught as "bycatch" before they can spawn, their populations are struggling to stay ahead of industrial demand.',
  },
  {
    name: 'Sardine',
    sci_name: '(Sardina pilchardus)',
    img: 'fishes/sardine.png',
    description: 'The foundation of the East Atlantic food chain, Sardines convert plankton into energy for whales, seabirds, and larger fish. They are frequently overfished for "fishmeal" and oil; since their schools are highly predictable based on water temperature, they are extremely vulnerable to efficient, high-volume industrial fleets.',
  }

]

export default function Fishes() {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <section ref={sectionRef} className="max-w-[75%] flex flex-col gap-0 md:gap-12 justify-center mx-auto mb-20">
        <div className={`title flex gap-4 text-center justify-center items-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <svg viewBox="0 0 45 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 md:h-14 w-auto">
            <path d="M22.0967 0C27.9428 8.02602e-05 33.0871 2.04885 37.5293 6.14648C41.9716 10.2443 44.1924 15.7469 44.1924 22.6533C44.1924 27.2576 42.3628 32.2648 38.7031 37.6748C35.0435 43.0848 29.5081 48.9441 22.0967 55.252C14.6852 48.944 9.14896 43.0849 5.48926 37.6748C1.82968 32.2648 0 27.2576 0 22.6533C2.26071e-05 15.7469 2.22082 10.2443 6.66309 6.14648C11.1054 2.04868 16.2504 0 22.0967 0ZM15.0889 15.9189C14.8359 15.8269 14.4679 15.7286 14.1113 15.8574C13.9022 15.933 13.7254 16.078 13.6133 16.2764C13.5105 16.4587 13.4862 16.6424 13.4854 16.7754C13.484 17.0279 13.5648 17.2655 13.6299 17.4238C13.7016 17.5982 13.7922 17.7649 13.876 17.8994C13.9042 17.9446 13.9375 17.9872 13.9746 18.0254C14.477 18.5432 15.7045 19.7494 17.0225 20.8896C16.9053 21.1424 16.8439 21.4072 16.8154 21.6455C16.7547 22.154 16.8166 22.6867 16.9004 23.1104C16.9845 23.5354 17.1031 23.9116 17.1943 24.1279C17.215 24.1768 17.2493 24.2522 17.2939 24.3232C17.302 24.336 17.3715 24.4553 17.5039 24.5508C17.5659 24.5955 17.7801 24.7363 18.0801 24.6826C18.4226 24.621 18.5816 24.3668 18.6348 24.249C18.6868 24.1337 18.697 24.0323 18.7002 23.9941C18.7042 23.9453 18.7035 23.9039 18.7021 23.8779C18.6993 23.8257 18.6921 23.7783 18.6865 23.7461C18.6748 23.6787 18.6564 23.6034 18.6357 23.5254C18.628 23.4963 18.6271 23.4617 18.6348 23.4189C18.6708 23.5192 18.7346 23.6609 18.8525 23.7832C18.9463 23.8804 19.1047 23.9971 19.3291 24.0293C19.5089 24.055 19.6657 24.016 19.7861 23.9609C22.3821 27.1869 23.1482 30.7675 23.2354 32.5469C22.782 32.7874 22.3047 33.1258 21.873 33.459C21.2529 33.9377 20.6424 34.4729 20.1943 34.873C20.0408 35.0102 19.8567 35.2044 19.7637 35.4561C19.7125 35.5947 19.6812 35.7729 19.7207 35.9688C19.7612 36.1693 19.8648 36.3278 19.9824 36.4414C20.1901 36.642 20.4495 36.7099 20.5996 36.7393C20.7745 36.7734 20.9619 36.7836 21.1377 36.7822C21.6276 36.7785 22.2485 36.6815 22.7725 36.5381L24.1104 38.2266C24.2791 38.4392 24.5494 38.5443 24.8174 38.501C25.0856 38.4576 25.3094 38.272 25.4023 38.0166C25.7333 37.1065 26.0709 34.973 24.9658 33.1162C25.8421 32.0921 26.889 30.0057 27.0225 26.792L27.0234 26.7217L26.9756 26.0908C26.7281 23.5515 25.8158 21.6808 24.6973 20.3047L25.9922 19.7871C26.2577 19.681 26.44 19.4325 26.4619 19.1475C26.4835 18.8629 26.3422 18.5907 26.0967 18.4453C25.4131 18.0415 24.3224 17.4981 23.2598 17.1855C22.7308 17.03 22.1653 16.9186 21.6406 16.9316C21.2978 16.9402 20.926 17.0059 20.5908 17.1816C20.4107 17.0945 20.2496 17.0184 20.1143 16.9551C19.9955 16.8995 19.9024 16.8563 19.8291 16.8193C19.7563 16.7826 19.7282 16.765 19.7246 16.7627C19.1968 16.3922 18.547 16.3926 18.0918 16.4512C17.7534 16.4947 17.4301 16.5832 17.1689 16.6758L15.0889 15.9189Z" fill="white" />
          </svg>
          <h2 className="text-3xl md:text-5xl lg:text-7xl font-righteous text-white uppercase tracking-tighter"> Tracked Fishes </h2>
        </div>

        <div className="@container fishes-container grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-12 lg:gap-18 font-cal mt-12">
          {FISHES.map((fish, index) => (
            <div key={index} className="group relative">
              <div className="hover-trigger peer absolute lg:block inset-8 z-50" />
              <div className={`hidden lg:flex absolute bottom-6 right-6 z-20 items-center gap-2 px-3 py-1.5 rounded-full border border-white/20 bg-white/5 backdrop-blur-md transition-all duration-700 pointer-events-none peer-hover:opacity-0 peer-hover:scale-95 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70">
                  See Info
                </span>
              </div>

              <div className={`glass-card rounded-4xl p-6 border-4xl text-white flex flex-col items-center ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>

                <div className="relative z-10">
                  <img
                    src={fish.img}
                    alt={fish.name}
                    className={`fish-img w-full h-56 object-contain -mt-20 transition-all duration-700 pointer-events-none ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`} />
                </div>

                <div className="fish-header absolute left-0 right-0 z-0 transition-all duration-500 flex flex-col gap-1">
                  <h3 className="fish-title font-righteous text-[6.5cqw] text-center uppercase tracking-tighter">
                    {fish.name}
                  </h3>
                  <p className="fish-sci text-lg text-center">
                    {fish.sci_name}
                  </p>
                </div>

                <p className="fish-desc relative md:absolute px-10 text-xs md:text-sm leading-relaxed">
                  {fish.description}
                </p>
              </div>

            </div>
          ))}
        </div>
      </section>
    </>
  )
}
