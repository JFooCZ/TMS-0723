import React, { useState, useEffect } from "react"
import api from "../API"
import { useNavigate } from "react-router-dom"

function TMSApplUpdate({ appData, handleCloseModal, allUsergroups, fetchData }) {
  const navigate = useNavigate()
  const [App_Acronym, setApp_Acronym] = useState(appData.App_Acronym || "")
  const [App_startDate, setApp_startDate] = useState(appData.App_startDate || "")
  const [App_endDate, setApp_endDate] = useState(appData.App_endDate || "")
  const [usergroups, setUsergroups] = useState([])
  const [App_permit_Open, setApp_permit_Open] = useState(appData.App_permit_Open || "")
  const [App_permit_toDoList, setApp_permit_toDoList] = useState(appData.App_permit_toDoList || "")
  const [App_permit_Doing, setApp_permit_Doing] = useState(appData.App_permit_Doing || "")
  const [App_permit_Done, setApp_permit_Done] = useState(appData.App_permit_Done || "")
  const [App_permit_create, setApp_permit_create] = useState(appData.setApp_permit_create || "")
  const [error, setError] = useState("")

  useEffect(() => {
    setApp_Acronym(appData.App_Acronym || "")
    setApp_startDate(appData.App_startDate || "")
    setApp_endDate(appData.App_endDate || "")
    setApp_permit_Open(appData.App_permit_Open || "")
    setApp_permit_toDoList(appData.App_permit_toDoList || "")
    setApp_permit_Doing(appData.App_permit_Doing || "")
    setApp_permit_Done(appData.App_permit_Done || "")
    setApp_permit_create(appData.App_permit_create || "")

    api
      .post("/getallusergroups", { token: localStorage.getItem("tmsToken") })
      .then((response) => {
        if (response.data.error) {
          setError(response.data.error)
        } else {
          setUsergroups(response.data.response.map((group) => group.usergroups))
        }
      })
      .catch((err) => console.log(err))
  }, [appData])

  const handleSubmit = (e) => {
    e.preventDefault()

    const token = localStorage.getItem("tmsToken")
    const updatedAppData = {
      App_Acronym,
      App_startDate,
      App_endDate,
      App_permit_Open,
      App_permit_toDoList,
      App_permit_Doing,
      App_permit_Done,
      App_permit_create,
      token
    }

    api
      .post("/editapp", updatedAppData)
      .then((response) => {
        if (response.data.error) {
          setError(response.data.error)
        } else {
          alert("Application details have been updated successfully.")
          handleCloseModal()
          fetchData()
        }
      })
      .catch((err) => {
        console.log(err)
        setError("An error occurred. Please try again.")
        alert("Unexpected error occurred.")
        navigate("/")
      })
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label>
          App Acronym:
          <input type="text" value={App_Acronym} readOnly />
        </label>
        <label>
          Start Date:
          <input type="date" value={App_startDate} onChange={(e) => setApp_startDate(e.target.value)} />
        </label>
        <label>
          End Date:
          <input type="date" value={App_endDate} onChange={(e) => setApp_endDate(e.target.value)} />
        </label>
        <label>
          Open Perms:
          <select value={App_permit_Open} onChange={(e) => setApp_permit_Open(e.target.value)}>
            <option value="">Please select a group</option>
            {usergroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          toDoList Perms:
          <select value={App_permit_toDoList} onChange={(e) => setApp_permit_toDoList(e.target.value)}>
            <option value="">Please select a group</option>
            {usergroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Doing Perms:
          <select value={App_permit_Doing} onChange={(e) => setApp_permit_Doing(e.target.value)}>
            <option value="">Please select a group</option>
            {usergroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Done Perms:
          <select value={App_permit_Done} onChange={(e) => setApp_permit_Done(e.target.value)}>
            <option value="">Please select a group</option>
            {usergroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Create Perms:
          <select value={App_permit_create} onChange={(e) => setApp_permit_create(e.target.value)}>
            <option value="">Please select a group</option>
            {usergroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>

        <button type="submit">Update Application</button>
      </form>

      {error && <div className="error">{error}</div>}
    </div>
  )
}

export default TMSApplUpdate
