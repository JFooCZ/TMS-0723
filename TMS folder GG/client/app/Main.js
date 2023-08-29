import React, { useState, useEffect } from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Header from "./components/Header"
import Footer from "./components/Footer"
import Home from "./components/Home"
import HomeLoggedOut from "./components/HomeLoggedOut"
import UserManagement from "./components/UserManagement"
import GroupManagement from "./components/GroupManagement"
import TMSAppl from "./components/TMSAppl"
import TMSPlan from "./components/TMSPlan"
import Kanban from "./components/Kanban"
import Profile from "./components/Profile"
import api from "./API"
import "./main.css"

// console.log(api)

function Main() {
  const [loggedIn, setLoggedIn] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  async function sessionCheck() {
    let token = localStorage.getItem("tmsToken")
    if (!token) {
      // console.log("No token found, set loggedIn and isAdmin to false")
      setLoggedIn(false)
      setIsAdmin(false)
      setLoading(false)
      return
    }

    try {
      let responses = await Promise.all([api.post("/verify", { token }), api.post("/checkgroup", { token })])

      let verificationResponse = responses[0]
      let adminCheckResponse = responses[1]
      //console.log(responses)

      if (verificationResponse && !verificationResponse.data.error) {
        // console.log("Setting loggedIn to true")
        setLoggedIn(true)
      } else {
        // console.log("Setting loggedIn to false")
        setLoggedIn(false)
      }

      if (adminCheckResponse && !adminCheckResponse.data.error) {
        // console.log("Admin check successful, set isAdmin to true")
        setIsAdmin(true)
      } else {
        // console.log("Admin check not successful, set isAdmin to false")
        setIsAdmin(false)
      }
    } catch (error) {
      console.error("Error in sessionCheck:", error)
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
        <Route path="/" element={loggedIn ? <Home /> : <HomeLoggedOut />}></Route>
        <Route path="/UserManagement" element={<UserManagement isAdmin={isAdmin} />} />
        <Route path="/GroupManagement" element={<GroupManagement isAdmin={isAdmin} />} />
        <Route path="/Profile" element={<Profile isLoggedIn={loggedIn} />} />
        <Route path="/TaskManagement" element={<TMSAppl isLoggedIn={loggedIn} />} />
        <Route path="/TaskManagement/:appAcronym" element={<Kanban isLoggedIn={loggedIn} />} />
        <Route path="/TaskManagement/:appAcronym/Plan" element={<TMSPlan isLoggedIn={loggedIn} />} />
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
