import axios from "axios"

const api = axios.create({
  baseURL: "http://localhost:8000"
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 403 && error.response.data.error === "User is disabled") {
      localStorage.removeItem("tmsToken")
      alert("Access Denied: You are not authorised to view this page")
      window.location.href = "/"
    } else {
      return Promise.reject(error)
    }
  }
)

export default api
