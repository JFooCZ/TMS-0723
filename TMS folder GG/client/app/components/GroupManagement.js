import React, { useState, useEffect } from "react"
import api from "../API"
import CreateGroup from "./CreateGroup"
import { useNavigate } from "react-router-dom"
import Page from "./Page"
// console.log(api)

function GroupManagement({ isAdmin }) {
  const navigate = useNavigate()
  const [usergroups, setUsergroups] = useState([])
  const [error, setError] = useState("")

  useEffect(() => {
    if (!isAdmin) {
      navigate("/")
      return
    }
  }, [isAdmin, navigate])

  if (!isAdmin) {
    alert("Access Denied: You do not have permission to view this page.")
    return null
  }

  const fetchUserGroups = () => {
    const token = localStorage.getItem("tmsToken") // Get the admin token

    // Call to get usergroups from server here and set it to usergroups state
    api
      .post(
        "/getallusergroups",
        { token }, // Add token to request body
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
      .then((response) => {
        if (response.data.error) {
          setError(response.data.error)
        } else {
          setUsergroups(response.data.response.map((group) => group.usergroups))
        }
      })
      .catch((err) => console.log(err))
  }

  useEffect(() => {
    fetchUserGroups()
  }, [])

  return (
    <Page>
      <div>
        <h1>Group Management</h1>
        <CreateGroup fetchUserGroups={fetchUserGroups} />
        <div>
          {usergroups.map((group, index) => (
            <div key={index}>{group}</div>
          ))}
        </div>
        {error && <div className="error">{error}</div>}
      </div>
    </Page>
  )
}

export default GroupManagement
