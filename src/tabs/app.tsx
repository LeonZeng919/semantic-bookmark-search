import { MemoryRouter } from "react-router-dom"

import { Routing } from "./routes"

function AppPage() {
  return (
    <MemoryRouter>
      <Routing />
    </MemoryRouter>
  )
}

export default AppPage
