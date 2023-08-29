import React, { useState, useEffect } from "react"
import api from "../API"
import { useNavigate } from "react-router-dom"

function TMSTaskCreate({ onClose, refetchData, appAcronym }) {
  const [Task_name, setTask_name] = useState("")
  const [Task_description, setTask_description] = useState("")
  const [Task_plan, setTask_plan] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState("")
  const [taskPlans, setTaskPlans] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    const fetchTaskPlans = async () => {
      const token = localStorage.getItem("tmsToken")
      try {
        const response = await api.post("/getplans", {
          token: token,
          app_Acronym: appAcronym
        })

        // console.log("Received data from /getplans:", response.data)

        if (response.data && response.data.response) {
          setTaskPlans(response.data.response)
        } else if (response.data.error) {
          setError(response.data.error)
        }
      } catch (e) {
        setError("Error fetching task plans.")
      }
    }

    fetchTaskPlans()
  }, [appAcronym])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    try {
      const token = localStorage.getItem("tmsToken")
      const response = await api.post(
        "/createtask",
        {
          Task_name,
          Task_description,
          Task_plan,
          App_Acronym: appAcronym,
          token
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      )

      if (response.data.error) {
        setError(response.data.error)
      } else {
        setSuccessMessage("Task successfully created!")
        refetchData(true)

        setTask_name("")
        setTask_description("")
        setTask_plan("")
      }
    } catch (e) {
      if (e.response && e.response.data && e.response.data.error) {
        setError(e.response.data.error)
      } else {
        console.log(e)
        setError("An unexpected error occurred. Please try again.")
        alert("Unexpected error occurred.")
        navigate("/")
      }
    }
  }

  return (
    <div className="modal">
      <div className="modal-content">
        <form onSubmit={handleSubmit}>
          <div>
            <strong>Task Name*</strong>
            <input value={Task_name} onChange={(e) => setTask_name(e.target.value)} required />
          </div>
          <div>
            <strong>Task Description</strong>
            <textarea value={Task_description} onChange={(e) => setTask_description(e.target.value)} />
          </div>
          <div>
            <strong>Task Plan</strong>
            <select value={Task_plan} onChange={(e) => setTask_plan(e.target.value)}>
              <option value="">Select a task plan</option>
              {taskPlans.map((plan) => (
                <option key={plan.Plan_MVP_Name} value={plan.Plan_MVP_Name}>
                  {plan.Plan_MVP_Name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit">Create Task</button>
          {error && <div className="error">{error}</div>}
          {successMessage && <div className="success">{successMessage}</div>}

          <button onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  )
}

export default TMSTaskCreate
