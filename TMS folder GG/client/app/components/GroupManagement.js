import React, { useState, useEffect } from "react"
import Axios from "axios"
import CreateGroup from "./CreateGroup"

function GroupManagement() {
  const [usergroups, setUsergroups] = useState([])
  const [error, setError] = useState("")

  const fetchUserGroups = () => {
    const token = localStorage.getItem("tmsToken") // Get the admin token

    // Call to get usergroups from server here and set it to usergroups state
    Axios.post(
      "http://localhost:8000/getallusergroups",
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
  )
}

export default GroupManagement
