"use client";

import {
  createStaffSession,
  saveSession,
  verifyStaffLogin,
} from "@/lib/auth";
import { useState } from "react";

type StaffLoginProps = {
  role: "dispatcher" | "responder";
  onSuccess: () => void;
};

export function StaffLogin({ role, onSuccess }: StaffLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!verifyStaffLogin(role, username, password)) {
      setError("Invalid credentials. Contact MDRRMO admin.");
      return;
    }

    const label = role === "dispatcher" ? "Command Dispatcher" : "Field Responder";
    saveSession(createStaffSession(role, label));
    onSuccess();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto max-w-md rounded-2xl border border-red-900/40 bg-[#111827] p-6 shadow-xl"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-red-400">
        Secure access
      </p>
      <h2 className="mt-2 text-2xl font-bold text-white">
        {role === "dispatcher" ? "Command Center Login" : "Field Unit Login"}
      </h2>
      <p className="mt-2 text-sm text-slate-400">
        Demo:{" "}
        <code className="text-red-300">
          {role === "dispatcher" ? "mdrrmo / tabang2026" : "responder / field2026"}
        </code>
      </p>

      {error ? (
        <p className="mt-4 rounded-lg bg-red-950/80 px-3 py-2 text-sm text-red-200">
          {error}
        </p>
      ) : null}

      <label className="mt-5 block">
        <span className="text-xs font-medium uppercase text-slate-400">
          Username
        </span>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2.5 text-white outline-none focus:border-red-500"
          required
        />
      </label>

      <label className="mt-4 block">
        <span className="text-xs font-medium uppercase text-slate-400">
          Password
        </span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full rounded-lg border border-[#3d4f6f] bg-[#0a0f1a] px-3 py-2.5 text-white outline-none focus:border-red-500"
          required
        />
      </label>

      <button
        type="submit"
        className="mt-6 w-full rounded-lg bg-red-700 py-3 font-bold text-white transition hover:bg-red-600"
      >
        Enter system
      </button>
    </form>
  );
}
