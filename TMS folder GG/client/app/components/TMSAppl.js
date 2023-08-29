import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import api from "../API"
import Page from "./Page"

const Profile = ({ isLoggedIn }) => {
  const [newPassword, setNewPassword] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [message, setMessage] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const navigate = useNavigate()

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/")
    }
    const token = localStorage.getItem("tmsToken")

    api.post("/verify", { token }).then((response) => {
      setIsLoading(false)
      if (response.data.error) {
        navigate("/")
      }
    })
  }, [isLoggedIn, navigate])

  const handleSubmit = (event) => {
    event.preventDefault()
    const token = localStorage.getItem("tmsToken")

    if (!isLoggedIn) {
      alert("Access Denied: You do not have permission to view this page.")
      navigate("/")
      return null
    }

    api
      .post(
        "/profile",
        { newPassword, newEmail, token },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      )
      .then((response) => {
        if (response.data.error) {
          // console.log(response.data.error)
          setMessage({ type: "error", text: response.data.error }) // set error message
        } else {
          setNewPassword("")
          setNewEmail("")
          setMessage({ type: "success", text: "Profile updated successfully" })
        }
      })
      .catch((err) => {
        console.log(err)
        setMessage({ type: "error", text: "An error occurred" }) // set error message}
      })
  }

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <Page>
      <form onSubmit={handleSubmit}>
        <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Enter new password" />
        <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="Enter new email" />
        <button type="submit">Update Profile</button>
      </form>
      <h6>*To retain old password, leave the password field empty</h6>

      {message && <p className={message.type === "error" ? "error-message" : "success-message"}>{message.text}</p>}
    </Page>
  )
}

export default Profile
