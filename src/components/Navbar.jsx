function Navbar({ initials }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
      <div className="text-lg font-semibold text-slate-900">TaskFlow</div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
        {initials || "?"}
      </div>
    </header>
  );
}

export default Navbar;
