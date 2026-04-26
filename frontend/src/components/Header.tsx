export default function Header() {
  return (
    <>
      <header className="w-[90rem] h-[4rem] mx-auto my-[2rem]  flex justify-between items-center text-[1.5rem] text-white">
        <div>
          <img src="/src/assets/logo.svg" alt="Logo" className="h-full w-auto" />
        </div>
        <nav className="bg-white/20 backdrop-blur-lg border border-white/20 shadow-lg h-16 flex items-center px-4 rounded-[1.25rem]">
          <ul className="flex gap-24 px-10">
            <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500"><a href="/" >HOME</a></li>
            <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500"><a href="/about">ABOUT</a></li>
            <li className="transition transform duration-300 hover:scale-150 hover:text-blue-500"><a href="/map">MAP</a></li>
          </ul>
        </nav>
        <a href="/login" className="transition transform duration-300 hover:scale-150 hover:text-blue-500">LOGIN</a>
      </header>
    </>
  )
}
