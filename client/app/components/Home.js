import React, { useEffect } from "react"
import Page from "./Page"

function Home() {
  return (
    <Page title="Your Feed">
      <h2 className="text-center">
        Hello <strong></strong>, Login liao boss .
      </h2>
      <p className="lead text-muted text-center">This is your feed</p>
    </Page>
  )
}

export default Home
