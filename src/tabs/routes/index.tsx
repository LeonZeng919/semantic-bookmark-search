import { Route, Routes } from "react-router-dom"

import Layout from "~tabs/components/Layout"

import Search from "./Search"
import Settings from "./Settings"

export const Routing = () => (
  <Routes>
    <Route path="/" element={<Layout />}>
      <Route index element={<Search />} />
      <Route path="settings" element={<Settings />} />
    </Route>
  </Routes>
)
