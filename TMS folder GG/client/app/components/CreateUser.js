import React, { useState, useEffect } from "react"
import Axios from "axios"

function CreateUser() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState("")
  const [usergroups, setUsergroups] = useState([])
  const [selectedUsergroups, setSelectedUsergroups] = useState([])
  const [userstatus, setUserstatus] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
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
        console.log(response.data.response) // <-- Add this line

        if (response.data.error) {
          setError(response.data.error)
        } else {
          setUsergroups(response.data.response.map((group) => group.usergroups))
        }
      })
      .catch((err) => console.log(err))
  }, [])

  const handleUsergroupChange = (event) => {
    setSelectedUsergroups([...selectedUsergroups, event.target.value])
  }

  const [success, setSuccess] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccess("") // Clear the success message on new submission
    setError("") // Also clear any error messages
    try {
      const token = localStorage.getItem("tmsToken")
      const response = await Axios.post(
        "http://localhost:8000/createnewuser",
        { token, newUsername: username, password, email, usergroups: selectedUsergroups, userstatus },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      )

      if (response.data.error) {
        setError(response.data.error)
      } else {
        setSuccess("User has been successfully created") // Set the success message when creation is successful
      }
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h6>* fields are mandatory</h6>
      <div>
        <strong>Username*</strong>
        <input value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div>
        <strong>Password*</strong>
        <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
      </div>
      <div>
        <strong>Email</strong>
        <input value={email} onChange={(e) => setEmail(e.target.value)} />
      </div>
      <strong>Usergroups</strong>
      <div className="usergroup-checkboxes">
        {usergroups.map((group) => (
          <div key={group}>
            <input type="checkbox" id={group} name={group} value={group} onChange={handleUsergroupChange} />
            <label htmlFor={group}>{group}</label>
          </div>
        ))}
      </div>
      <div>
        <strong>Userstatus*</strong>
        <div>
          <input type="radio" id="enabled" name="status" value="1" onChange={(e) => setUserstatus(e.target.value)} required />
          <label htmlFor="enabled">Enabled</label>
        </div>
        <div>
          <input type="radio" id="disabled" name="status" value="0" onChange={(e) => setUserstatus(e.target.value)} required />
          <label htmlFor="disabled">Disabled</label>
        </div>
      </div>
      <button type="submit">Create User</button>
      {success && <div className="success">{success}</div>} {/* Show the success message when it's set */}
      {error && <div className="error">{error}</div>}
    </form>
  )
}

export default CreateUser
