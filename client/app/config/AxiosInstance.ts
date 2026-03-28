import axios from "axios";

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000";

const AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, 
});


export default AxiosInstance;
