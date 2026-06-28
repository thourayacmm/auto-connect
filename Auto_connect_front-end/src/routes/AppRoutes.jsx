import { Navigate, Route, Routes } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import AdminLayout from "../layouts/AdminLayout";
import TherapistLayout from "../layouts/TherapistLayout";
import ParentLayout from "../layouts/ParentLayout";
import ChildLayout from "../layouts/ChildLayout";
import AdminDashboard from "../pages/admin/AdminDashboard";
import AccessRequests from "../pages/admin/AccessRequests";
import PictogramDatabase from "../pages/admin/PictogramDatabase";
import RolePermissions from "../pages/admin/RolePermissions";
import UserManagement from "../pages/admin/UserManagement";
import LandingPage from "../pages/LandingPage";
import UnauthorizedPage from "../pages/UnauthorizedPage";
import ChildHome from "../pages/child/ChildHome";
import CommunicationBoard from "../pages/child/CommunicationBoard";
import ListenPhrases from "../pages/child/ListenPhrases";
import SearchPictograms from "../pages/child/SearchPictograms";
import TrainingScenarios from "../pages/child/TrainingScenarios";
import ParentDashboard from "../pages/parent/ParentDashboard";
import AIChat from "../pages/parent/AIChat";
import ChildActivityHistory from "../pages/parent/ChildActivityHistory";
import ChildProgress from "../pages/parent/ChildProgress";
import ChildSession from "../pages/parent/ChildSession";
import TrackingSettings from "../pages/parent/TrackingSettings";
import TherapistDashboard from "../pages/therapist/TherapistDashboard";
import FollowedChildren from "../pages/therapist/FollowedChildren";
import PatientAccounts from "../pages/therapist/PatientAccounts";
import PatientDetails from "../pages/therapist/PatientDetails";
import PictogramManagement from "../pages/therapist/PictogramManagement";
import Reports from "../pages/therapist/Reports";
import ScenarioManagement from "../pages/therapist/ScenarioManagement";
import TherapistAccessRequests from "../pages/therapist/TherapistAccessRequests";
import TrainingLevels from "../pages/therapist/TrainingLevels";
import ProtectedRoute from "./ProtectedRoute";
import { getStoredUser } from "../utils/helpers";

function AppRoutes() {
  const user = getStoredUser();

  return (
    <Routes>
      <Route path="/" element={<AuthLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="login" element={<LandingPage />} />
      </Route>
      <Route path="/unauthorized" element={<UnauthorizedPage />} />

      <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
        <Route path="/admin" element={<AdminLayout user={user} />}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="permissions" element={<RolePermissions />} />
          <Route path="pictograms" element={<PictogramDatabase />} />
          <Route path="access-requests" element={<AccessRequests />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["THERAPIST"]} />}>
        <Route path="/therapist" element={<TherapistLayout user={user} />}>
          <Route index element={<TherapistDashboard />} />
          <Route path="patients" element={<PatientAccounts />} />
          <Route path="followed-children" element={<FollowedChildren />} />
          <Route path="patients/:id" element={<PatientDetails />} />
          <Route path="scenarios" element={<ScenarioManagement />} />
          <Route path="levels" element={<TrainingLevels />} />
          <Route path="pictograms" element={<PictogramManagement />} />
          <Route path="reports" element={<Reports />} />
          <Route path="access-requests" element={<TherapistAccessRequests />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["PARENT"]} />}>
        <Route path="/parent" element={<ParentLayout user={user} />}>
          <Route index element={<ParentDashboard />} />
          <Route path="child-session" element={<ChildSession />} />
          <Route path="progress" element={<ChildProgress />} />
          <Route path="history" element={<ChildActivityHistory />} />
          <Route path="settings" element={<TrackingSettings />} />
          <Route path="ai-chat" element={<AIChat />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={["CHILD"]} />}>
        <Route path="/child" element={<ChildLayout user={user} />}>
          <Route index element={<ChildHome />} />
          <Route path="board" element={<CommunicationBoard />} />
          <Route path="search" element={<SearchPictograms />} />
          <Route path="listen" element={<ListenPhrases />} />
          <Route path="scenarios" element={<TrainingScenarios />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
