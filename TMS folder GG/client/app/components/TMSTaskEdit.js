import React, { useState, useEffect } from "react"
import api from "../API"
import { useNavigate } from "react-router-dom"

function TMSTaskEdit({ task, onClose, appAcronym, refreshData }) {
  const [newNote, setNewNote] = useState("")
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(task.Task_plan || "")
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handlePlanChange = (event) => {
    setSelectedPlan(event.target.value)
  }
  const handleNoteChange = (event) => {
    setNewNote(event.target.value)
  }

  const handleSubmit = async () => {
    const token = localStorage.getItem("tmsToken")
    const updatedTask = {
      token,
      Task_name: task.Task_name,
      Task_notes: newNote,
      Task_plan: selectedPlan
    }

    try {
      const response = await api.post("/edittask", updatedTask)
      if (response.data.error) {
        setError(response.data.error)
        return
      }
      onClose(true)
      refreshData()
    } catch (err) {
      setError("Failed to update the task.")
      alert("Unexpected error occurred.")
      navigate("/")
    }
  }

  useEffect(() => {
    const fetchTaskPlans = async () => {
      const token = localStorage.getItem("tmsToken")
      try {
        const response = await api.post("/getplans", {
          token: token,
          app_Acronym: appAcronym
        })
        if (response.data && response.data.response) {
          setPlans(response.data.response)
        } else if (response.data.error) {
          setError(response.data.error)
        }
      } catch (e) {
        setError(`Error fetching task plans: ${e.response ? e.response.data.error : e.message}`)
      }
    }

    fetchTaskPlans()
  }, [appAcronym])

  return (
    <div className="modal">
      <div className="modal-content">
        <h2>Edit Task</h2>
        <p>
          <strong>Task:</strong> {task.Task_name}
        </p>
        <div>
          <textarea className="readonly-textarea" value={newNote} onChange={handleNoteChange} placeholder="Add new note" />
        </div>
        {task.Task_state === "Open" && (
          <label>
            Plan:
            <select value={selectedPlan} onChange={handlePlanChange}>
              <option value="">Select a task plan</option>
              {plans.map((plan) => (
                <option key={plan.Plan_MVP_Name} value={plan.Plan_MVP_Name}>
                  {plan.Plan_MVP_Name}
                </option>
              ))}
            </select>
          </label>
        )}
        {error && <div className="error">{error}</div>}
        <div>
          <button onClick={handleSubmit}>Save</button>
          <button onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  )
}

export default TMSTaskEdit
