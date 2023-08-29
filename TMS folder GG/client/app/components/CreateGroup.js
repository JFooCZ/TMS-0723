import React, { useState } from "react"
import api from "../API"
// console.log(api)

function CreateGroup({ fetchUserGroups }) {
  const [newUsergroup, setNewUsergroup] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()

    const token = localStorage.getItem("tmsToken")

    api
      .post(
        "/createusergroup",
        { usergroups: newUsergroup, token },
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
          setNewUsergroup("") // Clear the newUsergroup state
          fetchUserGroups()
        }
      })
      .catch((err) => {
        if (err && err.response.status === 403 && err.response.data.error === "User is disabled") {
        }
        console.log(err)
      })
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input value={newUsergroup} onChange={(e) => setNewUsergroup(e.target.value)} placeholder="Enter group name" required />
        <button type="submit">Create New Group</button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default CreateGroup
