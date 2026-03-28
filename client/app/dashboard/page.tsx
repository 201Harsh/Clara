"use client";

import { useEffect } from "react";
import AxiosInstance from "../config/AxiosInstance";

const page = () => {
  const GetAllMeetings = async () => {
    try {
      const response = await AxiosInstance.get("/calendar/all/meetings");

      console.log(response.data);
    } catch (error: any) {
      console.log(error);
    }
  };

  const GetUserProfile = async () => {
    try {
      const response = await AxiosInstance.get("/users/profile");

      console.log(response.data);
    } catch (error: any) {
      console.log(error);
    }
  };

  useEffect(() => {
    GetAllMeetings();
    GetUserProfile();
  }, []);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans flex items-center justify-center relative overflow-hidden p-4">
      <h1 className="text-6xl font-bold">Dashboard Page</h1>
    </div>
  );
};

export default page;
