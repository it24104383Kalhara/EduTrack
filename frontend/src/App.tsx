import { useState } from "react";
import Health from "./components/health";
import StudentInfo from "./components/StudentInfo";
import "./App.css";

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <>
      {!isLoggedIn ? (
        <Health onLoginSuccess={() => setIsLoggedIn(true)} />
      ) : (
        <StudentInfo onLogout={() => setIsLoggedIn(false)} />
      )}
    </>
  );
}

export default App;
