"use client";

import { useState, useEffect } from "react";
import { Cookie } from "lucide-react";

export default function CookieBar() {
  const [show, setShow] = useState(false);
  const [text, setText] = useState("");
  const [buttonText, setButtonText] = useState("Accept");

  useEffect(() => {
    if (localStorage.getItem("cookie_accepted")) return;

    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (data.cookieBarEnabled === false) return;
        setText(data.cookieBarText || "We use cookies to improve your experience.");
        setButtonText(data.cookieBarButtonText || "Accept");
        setShow(true);
      })
      .catch(() => {});
  }, []);

  const accept = () => {
    localStorage.setItem("cookie_accepted", "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl border border-[#e2e8f0] shadow-lg p-4 flex items-center gap-4">
        <Cookie className="h-5 w-5 text-[#7c3aed] shrink-0" />
        <p className="flex-1 text-sm text-[#475569]">{text}</p>
        <button
          onClick={accept}
          className="shrink-0 bg-[#7c3aed] text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-all"
        >
          {buttonText}
        </button>
      </div>
    </div>
  );
}
