import React from "react"
import Page from "./Page"

function HomeLoggedOut() {
  return (
    <Page title="Welcome">
      <h2 className="text-center">Welcome to the Task Management System</h2>
      <p className="lead text-muted text-center">Please login. The login bar is on top</p>
    </Page>
  )
}

export default HomeLoggedOut
