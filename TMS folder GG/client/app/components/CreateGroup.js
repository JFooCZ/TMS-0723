import React, { useState } from "react"
import Axios from "axios"

function CreateGroup({ fetchUserGroups }) {
  const [newUsergroup, setNewUsergroup] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = (event) => {
    event.preventDefault()

    const token = localStorage.getItem("tmsToken")

    Axios.post(
      "http://localhost:8000/createusergroup",
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
          // Clear the newUsergroup state
          setNewUsergroup("")
          fetchUserGroups()
        }
      })
      .catch((err) => console.log(err))
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
