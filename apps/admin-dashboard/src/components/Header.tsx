"use client";

import { Bell, Search, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("cafe_admin_auth");
    router.replace("/login");
  };

  return (
    <header className="flex h-16 w-full items-center justify-between border-b border-gray-200 bg-white px-6">
      <div className="flex flex-1 items-center gap-4">
        <div className="relative w-full max-w-md">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-orange-600 sm:text-sm sm:leading-6"
            placeholder="Search..."
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 text-gray-400 hover:text-gray-500">
          <span className="absolute right-1.5 top-1.5 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
          <Bell className="h-6 w-6" />
        </button>
        <div className="h-8 w-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center overflow-hidden">
          <img src="https://ui-avatars.com/api/?name=Admin+User&background=random" alt="Admin" className="h-full w-full object-cover" />
        </div>
        <button
          onClick={handleLogout}
          title="Logout"
          className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors border border-gray-200"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </header>
  );
}
