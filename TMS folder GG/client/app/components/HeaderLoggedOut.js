import React, { useState } from "react"
import Axios from "axios"

function HeaderLoggedOut(props) {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")

  async function handleSubmit(e) {
    e.preventDefault()
    try {
      let config = {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "Access-Control-Allow-Origin": "*"
        }
      }
      const response = await Axios.post("http://localhost:8000/login", { username, password }, config)
      console.log("Login response data:", response.data) // Add this line

      if (response.data.error) {
        setError(response.data.error) // Set the error message
      } else {
        localStorage.setItem("tmsToken", response.data.token)
        props.setLoggedIn(true)

        const checkgroupRes = await Axios.post(
          "http://localhost:8000/checkgroup",
          { token: response.data.token },
          {
            headers: {
              "Content-Type": "application/json"
            }
          }
        )

        const checkgroupData = await checkgroupRes.data // get data from response

        // Set isAdmin based on response from /checkgroup
        props.setIsAdmin(checkgroupData.response === "User is part of the admin group")
        setError("") // Clear the error message when the login is successful
      }

      console.log(response.data)
    } catch (e) {
      console.log(e)
    }
  }
  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-0 pt-2 pt-md-0">
        <div className="row align-items-center">
          <div className="col-md mr-0 pr-md-0 mb-3 mb-md-0">
            <input value={username} onChange={(e) => setUsername(e.target.value)} name="username" className="form-control form-control-sm input-dark" type="text" placeholder="Username" autoComplete="off" />
          </div>
          <div className="col-md mr-0 pr-md-0 mb-3 mb-md-0">
            <input value={password} onChange={(e) => setPassword(e.target.value)} name="password" className="form-control form-control-sm input-dark" type="password" placeholder="Password" />
          </div>
          <div className="col-md-auto">
            <button className="btn btn-success btn-sm">Login</button>
          </div>
        </div>
      </form>
      <>
        {" "}
        {error && <div className="error">{error}</div>}
        {/* got time then do css for error  */}
      </>
    </div>
  )
}

export default HeaderLoggedOut
