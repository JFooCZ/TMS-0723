import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./components/Home"
import Home2 from "./components/Home2"
import UserManagement from "./components/UserManagement"
import GroupManagement from "./components/GroupManagement"
import axios from "axios"

function Main() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function sessionCheck() {
    let token = localStorage.getItem("tmsToken")
    if (!token) {
      setLoggedIn(false)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    try {
      let res = await axios.post("http://localhost:8000/verify", { token })

      if (res && !res.data.error) {
        setLoggedIn(true)

        try {
          let admincheck = await axios.post("http://localhost:8000/checkgroup", { token })
          if (admincheck && !admincheck.data.error) {
            setIsAdmin(true)
          } else {
            setIsAdmin(false)
          }
        } catch (error) {
          setIsAdmin(false)
        }
      } else {
        setLoggedIn(false)
        setIsAdmin(false)
      }
    } catch (error) {
      setLoggedIn(false)
      setIsAdmin(false)
    }
    setLoading(false)
  }

  useEffect(() => {
    sessionCheck()
  }, [])

  if (loading) {
    return <div>Loading...</div> // Show a loading spinner or some placeholder
  }

  // Define your AdminRoute component directly inside your Main component
  // const AdminRoute = ({ children, ...rest }) => {
  //   if (!isAdmin) {
  //     alert("Access Denied: You do not have permission to view this page.")
  //     return <Navigate to="/" />
  //   }
  //   return children
  // }

  return (
    <BrowserRouter>
      <Header loggedIn={loggedIn} setLoggedIn={setLoggedIn} isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
      <Routes>
        <Route path="/" element={loggedIn ? <Home /> : <Home2 />}></Route>
        <Route path="/UserManagement" element={<UserManagement isAdmin={isAdmin} />} />
        <Route path="/GroupManagement" element={<GroupManagement isAdmin={isAdmin} />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  )
}

const root = ReactDOM.createRoot(document.querySelector("#app"))
root.render(<Main />)

if (module.hot.accept) {
  module.hot.accept()
}
