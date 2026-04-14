"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function ResetPassword() {
  const [password, setPassword] = useState("");

  const updatePassword = async () => {
    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      alert(error.message);
    } else {
      alert("Password updated!");
      window.location.href = "/";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50">
      <div className="border p-6 rounded-lg bg-white w-full max-w-sm">
        <h2 className="text-lg font-bold mb-3">Set New Password</h2>

        <input
          type="password"
          placeholder="New password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border px-3 py-2 w-full mb-3"
        />

        <button
          onClick={updatePassword}
          className="bg-black text-white px-4 py-2 rounded w-full"
        >
          Update Password
        </button>
      </div>
    </div>
  );
}