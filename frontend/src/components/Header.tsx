import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "./Logo";

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const threshold = 800;
      setIsScrolled(window.scrollY >= threshold);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`${isScrolled ? "text-white" : "text-black"} w-full h-auto mt-5 flex justify-between items-center text-[1.5rem] fixed top-0 left-1/2 -translate-x-1/2 z-50 text-lg lg:text-[1.5rem] px-4 md:px-8 transition-colors`}
      >
        <nav className="md:hidden bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg flex flex-col w-full px-4 rounded-[1.25rem]">
          <div className="flex justify-between items-center h-16 w-full shrink-0">
            <Logo className="h-10 w-auto" />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-3xl relative w-10 h-10 flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
                className={`w-6 h-6 absolute transition-all duration-500 transform ${isOpen ? "opacity-100" : "opacity-0"}`}
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>

              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                fill="currentColor"
                className={`w-6 h-6 absolute transition-all duration-500 transform ${isOpen ? "opacity-0" : "opacity-100"}`}
              >
                <path d="M120-240v-80h720v80H120Zm0-200v-80h720v80H120Zm0-200v-80h720v80H120Z" />
              </svg>
            </button>
          </div>

          <div
            className={`grid transition-all duration-500 ease-in-out ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
          >
            <div className="overflow-hidden">
              <ul className="flex flex-col gap-8 px-4 pb-8 items-end text-right text-base pt-2">
                <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500">
                  <Link to="/">HOME</Link>
                </li>
                <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500">
                  <Link to="/about">ABOUT</Link>
                </li>
                <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500">
                  <Link to="/map" onClick={() => setIsOpen(false)}>
                    MAP
                  </Link>
                </li>
                <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500">
                  <Link to="/login" onClick={() => setIsOpen(false)}>
                    LOGIN
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Desktop */}
        <div className="hidden md:flex w-full justify-between items-center">
          <div className="flex flex-1 justify-start">
            <Logo className="h-12 w-auto" />
          </div>
          <nav className="bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg h-16 flex items-center px-4 rounded-[1.25rem]">
            <ul className="flex gap-12 md:gap-24 px-4 md:px-10">
              <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500">
                <Link to="/">HOME</Link>
              </li>
              <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500">
                <Link to="/about">ABOUT</Link>
              </li>
              <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500">
                <Link to="/map">MAP</Link>
              </li>
            </ul>
          </nav>
          <div className="flex-1 flex justify-end">
            <Link
              to="/login"
              className="transition transform duration-300 hover:scale-150 hover:text-blue-500"
            >
              LOGIN
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
