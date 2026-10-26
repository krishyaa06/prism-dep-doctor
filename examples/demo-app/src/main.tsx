import React from "react";
import { createRoot } from "react-dom/client";
import { z } from "zod";
import App from "./App";
import "./styles.css";
createRoot(document.getElementById("root")!).render(<App />);
