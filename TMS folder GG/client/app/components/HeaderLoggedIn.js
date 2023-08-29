import React, { useState, useEffect } from "react"
import jwtDecode from "jwt-decode"
import { Link } from "react-router-dom"
import { useNavigate } from "react-router-dom"

function HeaderLoggedIn(props) {
  const navigate = useNavigate()
  const [username, setUsername] = useState("User") // default to "User"
  const isAdmin = props.isAdmin
  const isLoggedIn = props.isLoggedIn

  useEffect(() => {
    const token = localStorage.getItem("tmsToken")
    try {
      const decodedToken = jwtDecode(token)
      if (decodedToken && decodedToken.user) {
        setUsername(decodedToken.user)
      }
    } catch (err) {
      console.error("Error decoding the token:", err)
    }
  }, [])

  // useEffect(() => {
  //   console.log(isAdmin) // this will log when isAdmin prop changes
  // }, [isAdmin])

  // useEffect(() => {
  //   console.log(isLoggedIn) // this will log when isAdmin prop changes
  // }, [isLoggedIn])

  async function handleLogout() {
    localStorage.clear() // clear the token from the localStorage
    props.setLoggedIn(false) // change the logged in state to false
    props.setIsAdmin(false) // change the admin state to false if applicable
    navigate("/") // redirect to the home route
  }

  // console.log(props.isAdmin)
  return (
    <div className="flex-row my-3 my-md-0">
      {isAdmin && (
        <>
          <Link to="/UserManagement" className="btn btn-sm btn-success mr-2">
            User Management
          </Link>
          <Link to="/GroupManagement" className="btn btn-sm btn-success mr-2">
            Group Management
          </Link>
        </>
      )}
      <Link to="/profile" className="btn btn-sm btn-success mr-2">
        Update {username}'s Profile
      </Link>
      <Link to="/TaskManagement" className="btn btn-sm btn-success mr-2">
        Task Management
      </Link>
      <button onClick={handleLogout} className="btn btn-sm btn-secondary">
        Logout
      </button>
    </div>
  )
}

export default HeaderLoggedIn
