const Navbar = () => {
  return (
    <nav className="flex justify-between items-center px-6 py-2 bg-black/30 backdrop-blur-none sticky top-0 z-50">
        <div>
            <a href="/" className="flex items-center transition hover:opacity-80">
                <img src="/assets/logoo.png" alt="logo" className="h-15 w-auto object-contain"/>
                <span className="font-pacifico text-white/70 text-4xl">Nexus</span>
            </a>
        </div>

        <ul className="hidden md:flex gap-8">
          <li>Home</li>
        </ul>
    </nav>
  )
}

export default Navbar
