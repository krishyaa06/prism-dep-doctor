import { useState } from "react";
import axios from "axios";
import { format } from "date-fns";
import type { User } from "./types";
// import _ from "lodash"  (removed)
export default function App() { const [u] = useState<User | null>(null); return <p>{format(new Date(), "PP")}</p>; }
