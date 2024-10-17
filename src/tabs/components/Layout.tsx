import iconBase64 from "data-base64:~/icon.svg"
import React from "react"
import { Link, Outlet, useLocation } from "react-router-dom"

export default function Layout() {
  const location = useLocation()

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-800 text-white p-4">
        <div className="mb-8 flex items-center">
          <img src={iconBase64} alt="Smart Bookmark" className="w-12 h-12" />
          <h1 className="text-xl font-bold">Smart Bookmark</h1>
        </div>
        <nav>
          <ul className="space-y-2">
            <li>
              <Link
                to="/"
                className={`block py-2 px-4 rounded text-sm ${
                  location.pathname === "/"
                    ? "bg-gray-700"
                    : "hover:bg-gray-700"
                }`}>
                Search
              </Link>
            </li>
            <li>
              <Link
                to="/settings"
                className={`block py-2 px-4 rounded text-sm ${
                  location.pathname === "/settings"
                    ? "bg-gray-700"
                    : "hover:bg-gray-700"
                }`}>
                Settings
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <Outlet />
      </div>
    </div>
  )
}
