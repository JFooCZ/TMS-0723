import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import Axios from "axios"
import CreateUser from "./CreateUser"
import UpdateUserDetails from "./UpdateUserDetails"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"

function UserManagement({ isAdmin }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [allUsergroups, setAllUsergroups] = useState([])
  const [error, setError] = useState("")
  const [showCreateUser, setShowCreateUser] = useState(false)
  const [showUpdateUser, setShowUpdateUser] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const handleOpenModal = (user) => {
    setSelectedUser(user)
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
  }

  const fetchData = useCallback(() => {
    const token = localStorage.getItem("tmsToken")

    Axios.post(
      "http://localhost:8000/getallusers",
      { token },
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
          setUsers(response.data.response)
        }
      })
      .catch((err) => console.log(err))

    Axios.post(
      "http://localhost:8000/getallusergroups",
      { token },
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
          setAllUsergroups(response.data.response.map((usergroup) => usergroup.usergroups))
        }
      })
      .catch((err) => console.log(err))
  }, [])

  useEffect(() => {
    if (!isAdmin) {
      navigate("/")
      return
    }
    fetchData()
  }, [isAdmin, navigate, fetchData])

  if (!isAdmin) {
    alert("Access Denied: You do not have permission to view this page.")
    return null
  }

  const handleCreateUserClick = () => {
    setShowCreateUser(true)
    setShowUpdateUser(false)
  }

  const handleUpdateUserClick = (user) => {
    if (user) {
      setSelectedUser(user)
      setShowUpdateUser(true)
      setShowCreateUser(false)
    } else {
      setShowUpdateUser(false)
    }
  }

  return (
    <div>
      <h1>User Management</h1>
      <button onClick={handleCreateUserClick}>Create New User</button>
      <button onClick={handleUpdateUserClick}>Update User's Details</button> {showCreateUser && <CreateUser />}
      {/* {showUpdateUser && selectedUser && <UpdateUserDetails userData={selectedUser} />} */}
      {showUpdateUser && (
        <div>
          <table>
            <thead>
              <tr>
                <th>Username</th>
                <th>Email</th>
                <th>User Status</th>
                <th>User Groups</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, index) => (
                <tr key={index}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.userstatus == "1" ? "Enabled" : "Disabled"}</td>
                  <td>{user.usergroups}</td>
                  <td>
                    <button onClick={() => handleOpenModal(user)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
            <Dialog open={openModal} onClose={handleCloseModal}>
              <DialogTitle>Update User Details</DialogTitle>
              <DialogContent>{selectedUser && <UpdateUserDetails userData={selectedUser} allUsergroups={allUsergroups} handleCloseModal={handleCloseModal} fetchData={fetchData} />}</DialogContent>
            </Dialog>
          </table>
        </div>
      )}
      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default UserManagement
