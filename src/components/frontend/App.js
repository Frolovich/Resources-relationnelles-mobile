import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Home";
import Login from "./Login";
import Signup from "./Signup";
import Forgot from "./Password";
import Account from "./Account";
import ResourcePage from "./ResourcePage";
import CreateResource from "./CreateResource";
import MyResources from "./MyResources";
import ModeratorDashboard from "./ModeratorDashboard";
import AdminDashboard from "./AdminDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Signup />} />
        <Route path="/forgot" element={<Forgot />} />
        <Route path="/reset-password" element={<Forgot />} />
        <Route path="/account" element={<Account />} />
        <Route path="/resource/:id" element={<ResourcePage />} />
        <Route path="/resource/create" element={<CreateResource />} />
        <Route path="/my-resources" element={<MyResources />} />
        <Route path="/moderator" element={<ModeratorDashboard />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/super-admin" element={<SuperAdminDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;