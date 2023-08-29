import React, { useState, useEffect } from "react"
import api from "../API"
function UpdateUserDetails({ userData, handleCloseModal, allUsergroups, fetchData }) {
  const [username, setUsername] = useState(userData.username || "")
  const [password, setPassword] = useState("")
  const [email, setEmail] = useState(userData.email || "")
  const [userStatus, setUserStatus] = useState(userData.userstatus || "0")
  const [usergroups, setUsergroups] = useState(userData.usergroups ? userData.usergroups.split(",") : [])
  const [error, setError] = useState("")
  // console.log(api)

  useEffect(() => {
    //console.log(userData)
    // console.log(allUsergroups)
    setUsername(userData.username || "")
    setEmail(userData.email || "")
    setUserStatus(userData.userstatus || "0")
    setUsergroups(userData.usergroups ? userData.usergroups.split(",") : [])
  }, [userData])

  const handleSubmit = (event) => {
    event.preventDefault()

    const token = localStorage.getItem("tmsToken")

    // Build your data object
    let data = {
      username: username,
      newEmail: email,
      newStatus: userStatus,
      newUsergroups: usergroups,
      token: token
    }

    // Add password to data only if it's not an empty string
    if (password !== "") {
      data.password = password
    }

    // Send the data to the server
    api
      .post("/changeuserdetails", data, {
        headers: {
          "Content-Type": "application/json"
        }
      })
      .then((response) => {
        if (response.data.error) {
          setError(response.data.error)
        } else {
          alert("User details have been updated successfully.")
          handleCloseModal()
          fetchData()
        }
      })
      .catch((err) => console.log(err))
  }

  const handleUsergroupChange = (event) => {
    if (event.target.checked) {
      setUsergroups([...usergroups, event.target.value])
    } else {
      setUsergroups(usergroups.filter((group) => group !== event.target.value))
    }
  }

  return (
    <div>
      <button onClick={handleCloseModal}>X</button>
      <h2>Update User Details</h2>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input type="text" value={username} readOnly />
        </label>
        <div>
          <label>
            Password:
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Leave blank for old password" />
          </label>
        </div>
        <label>
          Email:
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <div>
          User Status:
          <label>
            <input type="radio" value="1" checked={userStatus == "1"} onChange={() => setUserStatus(1)} /> Enabled
          </label>
          <label>
            <input type="radio" value="0" checked={userStatus == "0"} onChange={() => setUserStatus(0)} /> Disabled
          </label>
        </div>
        <label>
          User Groups:
          <div className="usergroup-checkboxes">
            {Array.isArray(allUsergroups) &&
              allUsergroups.map((group) => (
                <div key={group}>
                  <input type="checkbox" id={group} name={group} value={group} checked={usergroups.includes(group)} onChange={handleUsergroupChange} />
                  <label htmlFor={group}>{group}</label>
                </div>
              ))}
          </div>
        </label>
        <button type="submit">Update</button>
      </form>
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default UpdateUserDetails
