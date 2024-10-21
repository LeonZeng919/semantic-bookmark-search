import React from "react"
import { MemoryRouter } from "react-router-dom"

import { GlobalStateProvider } from "./content/GlobalStateContext"
import { Routing } from "./routes"

function AppPage() {
  return (
    <GlobalStateProvider>
      <MemoryRouter>
        <Routing />
      </MemoryRouter>
    </GlobalStateProvider>
  )
}

export default AppPage
