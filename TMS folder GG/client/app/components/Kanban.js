import React, { useState, useEffect, useCallback } from "react"
import TMSTaskCreate from "./TMSTaskCreate"
import TMSTaskEdit from "./TMSTaskEdit"
import TMSStateChange from "./TMSStateChange"

import api from "../API"
import { useParams, useNavigate } from "react-router-dom"

function Kanban() {
  const { appAcronym } = useParams()
  const navigate = useNavigate()
  const [refresh, setRefresh] = useState(true)
  const [tasks, setTasks] = useState({
    Open: [],
    toDoList: [],
    Doing: [],
    Done: [],
    Closed: []
  })
  const [permissions, setPermissions] = useState({
    Open: false,
    toDoList: false,
    Doing: false,
    Done: false,
    Closed: false
  })
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false)
  const [error, setError] = useState(null)
  const [appDetails, setAppDetails] = useState({})
  const [hasCreatePermission, setHasCreatePermission] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  function TaskItem({ task }) {
    const handleTaskClick = () => {
      if (!isEditModalOpen && !isViewModalOpen) {
        setIsViewModalOpen(true)
        setSelectedTask(task)
      }
    }
    const handleButtonClick = (e, action) => {
      e.stopPropagation()
      if (action === "edit") {
        setIsViewModalOpen(false)
        setIsEditModalOpen(true)
        setSelectedTask(task)
      }
    }

    const taskStyle = {
      borderColor: task.Plan_color,
      borderWidth: "5px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }

    const renderEditButton = () => {
      const editButton = (
        <button title="Edit" onClick={(e) => handleButtonClick(e, "edit")}>
          &#9998;
        </button>
      )
      if (permissions[task.Task_state]) {
        return editButton
      }
    }

    const renderButtonsForState = () => {
      if (permissions[task.Task_state]) {
        return <TMSStateChange task={task} permissions={permissions} appAcronym={appAcronym} onStateChange={() => fetchTasksForApp()} />
      }
      return null
    }

    return (
      <div className="task-container" style={taskStyle}>
        <div className="task-details" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
          <span onClick={handleTaskClick}>{task.Task_name}</span>
          {renderEditButton()}
        </div>
        <div>
          <small> Plan: {task.Task_plan || "None"} </small>
        </div>
        <div className="task-actions" style={{ display: "flex", justifyContent: "space-around", alignItems: "center", width: "100%" }}>
          {renderButtonsForState()}
        </div>
      </div>
    )
  }

  function TaskDetailsModal({ task, onClose }) {
    if (!task) return null

    const parsedNotes = task.Task_notes ? JSON.parse(task.Task_notes) : []
    const displayNotes = formatNotesForDisplay(parsedNotes)

    function formatNotesForDisplay(notes) {
      return notes
        .map((note) => {
          let details = []
          if (note.user || note.username) {
            details.push(`User: ${note.user || note.username}`)
          }
          if (note.date || note.timestamp) {
            details.push(`Date: ${note.date || note.timestamp}`)
          }
          if (note.note) {
            details.push(`Note: ${note.note}`)
          }
          return details.join(" | ") // Joining all details with a separator
        })
        .join("\n\n")
    }

    // This is only for the viewing of details modal
    return (
      <div className="modal" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <h2>Task Details</h2>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "left" }}>
            <div>
              <strong>Task ID:</strong> {task.Task_id}
            </div>
            <div>
              <strong>Name:</strong> {task.Task_name}
            </div>
            <div>
              <strong>App:</strong> {task.Task_app_Acronym}
            </div>
            <div>
              <strong>Plan:</strong> {task.Task_plan}
            </div>
          </div>
          <div>
            <strong>Description:</strong>
          </div>
          <div>
            <textarea className="readonly-textarea" readOnly value={task.Task_description || ""} />
          </div>
          <div>
            <strong>Audit Trail:</strong>
          </div>
          <div>
            <textarea className="readonly-textarea" readOnly value={displayNotes} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "left" }}>
            <div>
              <strong>State:</strong> {task.Task_state}
            </div>
            <div>
              <strong>Task Creator:</strong> {task.Task_creator}
            </div>
            <div>
              <strong>Task Owner:</strong> {task.Task_owner}
            </div>
            <div>
              <strong>Date Created:</strong> {task.Task_createDate}
            </div>
          </div>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    )
  }

  const fetchAppDetails = async () => {
    const token = localStorage.getItem("tmsToken")
    try {
      const response = await api.post("/getappdetails", {
        token: token,
        app_Acronym: appAcronym
      })
      if (response.data.error) {
        setError(response.data.error)
        return
      }
      setAppDetails(response.data.response)
    } catch (error) {
      const errorMessage = error.response ? error.response.data.error : error.message
      setError(`Error fetching app details: ${errorMessage}`)
      console.error("Error fetching app details:", errorMessage)
    }
  }

  const fetchTasksForApp = async () => {
    const token = localStorage.getItem("tmsToken")
    try {
      const response = await api.post("/gettasks", {
        token: token,
        app_Acronym: appAcronym
      })

      // console.log("Server Response:", response.data)

      if (response.data.error) {
        setError(response.data.error)
        return
      }

      const fetchedTasks = response.data.response || [] // Assign the result to fetchedTasks

      const organizedTasks = {
        Open: [],
        toDoList: [],
        Doing: [],
        Done: [],
        Closed: []
      }

      fetchedTasks.forEach((task) => {
        if (organizedTasks[task.Task_state]) {
          organizedTasks[task.Task_state].push(task)
        }
      })

      setTasks(organizedTasks)
    } catch (error) {
      const errorMessage = error.response ? error.response.data.error : error.message
      setError(`Error fetching tasks: ${errorMessage}`)
      console.error("Error fetching tasks:", errorMessage)
    }
  }

  useEffect(() => {
    const token = localStorage.getItem("tmsToken")
    fetchAppDetails().then(() => {
      fetchTasksForApp() // Fetch tasks independently after app details
    })
  }, [refresh])

  useEffect(() => {
    const token = localStorage.getItem("tmsToken")
    async function checkPermission(permitField, state) {
      const group = appDetails[permitField]
      if (group) {
        try {
          const response = await api.post("/belonggroup", { token, group })
          if (response.data && response.data.isPartOfGroup) {
            setPermissions((prev) => ({ ...prev, [state]: true }))
          }
        } catch (error) {
          console.error(`Error verifying user group for ${state}:`, error.message || error)
        }
      }
    }

    if (appDetails) {
      checkPermission("App_permit_Open", "Open")
      checkPermission("App_permit_toDoList", "toDoList")
      checkPermission("App_permit_Doing", "Doing")
      checkPermission("App_permit_Done", "Done")
    }
  }, [appDetails])

  // New useEffect to check for permission after appDetails is fetched and updated
  useEffect(() => {
    const token = localStorage.getItem("tmsToken")
    const requiredGroup = appDetails.App_permit_create

    if (requiredGroup) {
      // Only run if requiredGroup exists
      api
        .post("/belonggroup", { token, group: requiredGroup })
        .then((response) => {
          if (response.data && response.data.isPartOfGroup) {
            setHasCreatePermission(true)
          }
        })
        .catch((error) => {
          console.error("Error verifying user group:", error.message || error)
        })
    }
  }, [appDetails])

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <button onClick={() => navigate("/TaskManagement")} style={{ margin: "10px" }}>
          Back to Apps
        </button>
        <h1 style={{ textAlign: "center" }}>{appAcronym}</h1>
        <div>
          <button onClick={() => navigate(`/TaskManagement/${appAcronym}/Plan`)} style={{ margin: "10px" }}>
            Manage Plan
          </button>
          {hasCreatePermission && (
            <button onClick={() => setIsTaskModalOpen(true)} style={{ margin: "10px" }}>
              Create Task
            </button>
          )}
          {isTaskModalOpen && (
            <TMSTaskCreate
              appAcronym={appAcronym}
              onClose={() => {
                setIsTaskModalOpen(false)
                fetchTasksForApp()
              }}
              refetchData={setRefresh}
            />
          )}
        </div>
      </div>
      <div className="kanban-board" style={{ display: "flex", alignItems: "flex-start" }}>
        {Object.entries(tasks).map(([state, tasksForStatus]) => (
          <div key={state} className="kanban-column">
            <h2>{state.charAt(0).toUpperCase() + state.slice(1)}</h2>
            {tasksForStatus.map((task) => (
              <TaskItem key={task.Task_id} task={task} />
            ))}
          </div>
        ))}
        {isViewModalOpen && <TaskDetailsModal task={selectedTask} onClose={() => setIsViewModalOpen(false)} />}
        {isEditModalOpen && <TMSTaskEdit task={selectedTask} onClose={() => setIsEditModalOpen(false)} appAcronym={appAcronym} refreshData={() => setRefresh((prev) => !prev)} />}
        {error && <div className="error">{error}</div>}
      </div>
    </>
  )
}

export default Kanban
