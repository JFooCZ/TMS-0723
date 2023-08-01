import React, { useEffect } from "react"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"

function HeaderLoggedIn(props) {
  const navigate = useNavigate()

  async function handleLogout() {
    localStorage.clear() // clear the token from the localStorage
    props.setLoggedIn(false) // change the logged in state to false
    props.setIsAdmin(false) // change the admin state to false if applicable
    navigate("/") // redirect to the home route
  }

  return (
    <div className="flex-row my-3 my-md-0">
      <Link to="/UserManagement" className="btn btn-sm btn-success mr-2">
        User Management
      </Link>
      <Link to="/GroupManagement" className="btn btn-sm btn-success mr-2">
        Group Management
      </Link>
      <button onClick={handleLogout} className="btn btn-sm btn-secondary">
        Logout
      </button>
    </div>
  )
}

export default HeaderLoggedIn
