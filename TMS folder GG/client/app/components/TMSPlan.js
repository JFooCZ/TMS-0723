import React, { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TMSPlanCreate from "./TMSPlanCreate"
import TMSPlanUpdate from "./TMSPlanUpdate"
import api from "../API"
import { useParams } from "react-router-dom"

function TMSPlan({ isLoggedIn }) {
  // console.log("isLoggedIn in TMSPlan:", isLoggedIn) //

  const navigate = useNavigate()
  const [isPMUser, setIsPMUser] = useState(false)
  const { appAcronym } = useParams()
  const [plans, setPlans] = useState([])
  const [error, setError] = useState(null)
  const [createPlanModalOpen, setCreatePlanModalOpen] = useState(false)
  const handleOpenCreatePlanModal = () => {
    console.log("Opening modal...")
    setCreatePlanModalOpen(true)
  }
  const handleCloseCreateAppModal = () => {
    setCreatePlanModalOpen(false)
    fetchPlansForApp()
  }
  const [updatePlanModalOpen, setUpdatePlanModalOpen] = useState(false)
  const [currentPlanData, setCurrentPlanData] = useState(null)
  const handleOpenUpdatePlanModal = (plan) => {
    setCurrentPlanData(plan)
    setUpdatePlanModalOpen(true)
  }

  const handleCloseUpdatePlanModal = () => {
    setUpdatePlanModalOpen(false)
    setCurrentPlanData(null)
    fetchPlansForApp() // To fetch the updated plan data after editing
  }
  const fetchPlansForApp = async () => {
    const token = localStorage.getItem("tmsToken")
    try {
      const response = await api.post("/getplans", {
        token: token,
        app_Acronym: appAcronym
      })

      // console.log("Server Response:", response.data)
      // console.log("hi:", appAcronym)
      if (response.data.error) {
        setError(response.data.error)
        return
      }

      setPlans(response.data.response || [])
    } catch (error) {
      const errorMessage = error.response ? error.response.data.error : error.message
      setError(`Error fetching plans: ${errorMessage}`)
      console.error("Error fetching plans:", errorMessage)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) {
      alert("You must be logged in to view this page.")
      navigate("/")
      return
    }

    fetchPlansForApp()

    const token = localStorage.getItem("tmsToken")
    api
      .post("/belonggroup", { token, group: "PM" })
      .then((response) => {
        if (response.data && response.data.isPartOfGroup) {
          setIsPMUser(true)
        }
      })
      .catch((err) => console.log(err))
  }, [appAcronym, isLoggedIn, navigate])

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-start", alignItems: "center" }}>
        <button onClick={() => navigate(`/TaskManagement/${appAcronym}`)} style={{ marginRight: "30px" }}>
          Back to Kanban
        </button>
        <h1>Plans for {appAcronym}</h1>
      </div>
      {isPMUser && <button onClick={handleOpenCreatePlanModal}>Create New Plan</button>}
      {createPlanModalOpen && <TMSPlanCreate appAcronym={appAcronym} onClose={handleCloseCreateAppModal} refetchData={fetchPlansForApp} />}
      {error && <div className="error">{error}</div>}
      <table className="bordered-table">
        <thead>
          <tr>
            <th>Plan MVP Name</th>
            <th>Start Date</th>
            <th>End Date</th>
            <th>Color Representation</th>
          </tr>
        </thead>
        <tbody>
          {plans.map((plan, index) => (
            <tr key={plan.Plan_MVP_Name} className={index % 2 === 1 ? "odd" : ""}>
              <td>{plan.Plan_MVP_Name}</td>
              <td>{plan.Plan_startDate}</td>
              <td>{plan.Plan_endDate}</td>
              <td>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    backgroundColor: plan.Plan_color,
                    border: "1px solid #000"
                  }}
                  title={plan.Plan_color}
                />
              </td>
              {isPMUser && (
                <td>
                  <button onClick={() => handleOpenUpdatePlanModal(plan)}>Edit</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {updatePlanModalOpen && <TMSPlanUpdate planData={currentPlanData} onClose={handleCloseUpdatePlanModal} refetchData={fetchPlansForApp} />}
    </div>
  )
}

export default TMSPlan
