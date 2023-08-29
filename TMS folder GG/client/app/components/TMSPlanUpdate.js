import React, { useState } from "react"
import api from "../API"
import { useNavigate } from "react-router-dom"

function TMSPlanCreate({ onClose, refetchData, appAcronym }) {
  const [Plan_MVP_Name, setPlan_MVP_Name] = useState("")
  const [Plan_startDate, setPlan_startDate] = useState("")
  const [Plan_endDate, setPlan_endDate] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState("")
  const [Plan_color, setPlan_color] = useState("#ffffff") // Default color set to white
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSuccessMessage("")
    setError("")

    // console.log("Received: ", appAcronym)
    try {
      const token = localStorage.getItem("tmsToken")
      const response = await api.post(
        "/createplan",
        {
          Plan_MVP_Name,
          Plan_startDate,
          Plan_endDate,
          Plan_color,
          App_Acronym: appAcronym,
          token
        },
        {
          headers: {
            "Content-Type": "application/json"
          }
        }
      )

      // console.log({
      //   Plan_MVP_Name,
      //   Plan_startDate,
      //   Plan_endDate,
      //   App_Acronym: appAcronym,
      //   token
      // })

      if (response.data.error) {
        setError(response.data.error)
      } else {
        setSuccessMessage("Plan successfully created!")
        refetchData()

        setPlan_MVP_Name("")
        setPlan_startDate("")
        setPlan_endDate("")
        setPlan_color("#ffffff")
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
            <strong>Plan MVP Name*</strong>
            <input value={Plan_MVP_Name} onChange={(e) => setPlan_MVP_Name(e.target.value)} required />
          </div>
          <div>
            <strong>Start Date</strong>
            <input type="date" value={Plan_startDate} onChange={(e) => setPlan_startDate(e.target.value)} />
          </div>
          <div>
            <strong>End Date</strong>
            <input type="date" value={Plan_endDate} onChange={(e) => setPlan_endDate(e.target.value)} />
          </div>
          <div>
            <strong>Plan Color:</strong>
            <input type="color" value={Plan_color} onChange={(e) => setPlan_color(e.target.value)} />
          </div>
          <button type="submit">Create Plan</button>
          {successMessage && <div className="success">{successMessage}</div>}
          {error && <div className="error">{error}</div>}
          <button onClick={onClose}>Close</button>
        </form>
      </div>
    </div>
  )
}

export default TMSPlanCreate
