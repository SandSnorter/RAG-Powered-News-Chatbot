const Navbar = () => {
  return (
    <nav className="flex justify-between items-center px-6 py-2 bg-black/30 backdrop-blur-none sticky top-0 z-50">
        <div>
            <a href="/" className="flex items-center">
                <img src="/assets/logoo.png" alt="logo" className="h-15 w-auto object-contain"/>
                <span className="font-pacifico text-white/70 text-4xl transition hover:text-white">Nexus</span>
            </a>
        </div>
    </nav>
  )
}

export default Navbar
