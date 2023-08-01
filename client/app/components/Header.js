import React, { useState, useEffect } from "react"
import { Link } from "react-router-dom"
import HeaderLoggedOut from "./HeaderLoggedOut"
import HeaderLoggedIn from "./HeaderLoggedIn"

function Header(props) {
  useEffect(() => {
    document.title = "Login | TMS"
    window.scrollTo(0, 0)
  }, [])

  function handleSubmit() {}

  return (
    <header className="header-bar bg-primary mb-3">
      <div className="container d-flex flex-column flex-md-row align-items-center p-3">
        <h4 className="my-0 mr-md-auto font-weight-normal">
          <Link to="/" className="text-white">
            TMS
          </Link>
        </h4>
        {props.loggedIn ? <HeaderLoggedIn loggedIn={props.loggedIn} setLoggedIn={props.setLoggedIn} setIsAdmin={props.setIsAdmin} /> : <HeaderLoggedOut setLoggedIn={props.setLoggedIn} setIsAdmin={props.setIsAdmin} />}{" "}
      </div>
    </header>
  )
}

export default Header
