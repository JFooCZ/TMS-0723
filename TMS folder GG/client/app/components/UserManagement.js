import React, { useState, useEffect, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import CreateUser from "./CreateUser"
import UpdateUserDetails from "./UpdateUserDetails"
import Dialog from "@mui/material/Dialog"
import DialogTitle from "@mui/material/DialogTitle"
import DialogContent from "@mui/material/DialogContent"
import Page from "./Page"
import api from "../API"
// console.log(api)

function UserManagement({ isAdmin }) {
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [allUsergroups, setAllUsergroups] = useState([])
  const [error, setError] = useState("")
  const [selectedUser, setSelectedUser] = useState(null)
  const [openModal, setOpenModal] = useState(false)
  const [createUserModal, setCreateUserModal] = useState(false) // New state for CreateUser Modal

  const handleOpenCreateUserModal = () => {
    setCreateUserModal(true)
  }

  const handleCloseCreateUserModal = () => {
    setCreateUserModal(false)
  }
  const handleOpenModal = (user) => {
    setSelectedUser(user)
    setOpenModal(true)
  }

  const handleCloseModal = () => {
    setOpenModal(false)
    setSelectedUser(null)
  }

  const fetchData = useCallback(() => {
    const token = localStorage.getItem("tmsToken")

    api
      .post(
        "/getallusers",
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

    api
      .post(
        "/getallusergroups",
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

  // const handleCreateUserClick = () => {
  //   setShowCreateUser(true)
  //   setShowUpdateUser(false)
  // }

  // const handleUpdateUserClick = (user) => {
  //   if (user) {
  //     setSelectedUser(user)
  //     setShowUpdateUser(true)
  //     setShowCreateUser(false)
  //   } else {
  //     setShowUpdateUser(false)
  //   }
  // }

  return (
    <Page>
      <div>
        <h1>User Management</h1>
        <button onClick={handleOpenCreateUserModal}>Create New User</button> {/* Open Modal on button click */}
        {selectedUser && (
          <Dialog open={openModal} onClose={handleCloseModal}>
            <DialogTitle>Update User Details</DialogTitle>
            <DialogContent>{selectedUser && <UpdateUserDetails userData={selectedUser} allUsergroups={allUsergroups} handleCloseModal={handleCloseModal} fetchData={fetchData} />}</DialogContent>
          </Dialog>
        )}
        {/* New CreateUser Modal */}
        <Dialog open={createUserModal} onClose={handleCloseCreateUserModal}>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent>
            <CreateUser handleCloseModal={handleCloseCreateUserModal} fetchData={fetchData} />
          </DialogContent>
        </Dialog>
        {error && <div className="error">{error}</div>}
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
                <tr key={index} className={index % 2 === 1 ? "odd" : ""}>
                  <td className="break-word">{user.username}</td>
                  <td className="break-word">{user.email}</td>
                  <td>{user.userstatus == "1" ? "Enabled" : "Disabled"}</td>
                  <td className="break-word">{user.usergroups}</td>
                  <td>
                    <button onClick={() => handleOpenModal(user)}>Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {selectedUser && (
          <Dialog open={openModal} onClose={handleCloseModal}>
            <DialogTitle>Update User Details</DialogTitle>
            <DialogContent>{selectedUser && <UpdateUserDetails userData={selectedUser} allUsergroups={allUsergroups} handleCloseModal={handleCloseModal} fetchData={fetchData} />}</DialogContent>
          </Dialog>
        )}
        {error && <div className="error">{error}</div>}
      </div>
    </Page>
  )
}

export default UserManagement
