import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppShell } from './components/layout/AppShell';
import { RoleGuard } from './components/layout/RoleGuard';
import { Button } from './components/ui/Button';

// Pages
import { Login } from './pages/auth/Login';
import { Forbidden } from './pages/shared/Forbidden';
import DevTokens from './pages/shared/dev-tokens';
import { Dashboard } from './pages/mentor/Dashboard';
import { MarkAttendance } from './pages/mentor/MarkAttendance';
import { History } from './pages/mentor/History';
import { Materials } from './pages/mentor/Materials';
import { Upload } from './pages/mentor/Upload';
import { AIUpload } from './pages/mentor/AIUpload';
import { StudentAttendance } from './pages/student/StudentAttendance';
import { Upcoming } from './pages/student/Upcoming';
import { StudentMaterials } from './pages/student/StudentMaterials';

const Placeholder = ({ title }) => (
  <div className="p-8">
    <h1 className="text-display-md">{title}</h1>
    <p className="text-secondary mt-4">Under construction.</p>
  </div>
);

function AppRoutes() {
  const { role, session, loading, signOut } = useAuth();

  if (loading) {
    return <div className="h-screen bg-void flex items-center justify-center">Loading...</div>;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={!session ? <Login /> : <Navigate to="/" replace />} />
      <Route path="/403" element={<Forbidden />} />
      <Route path="/dev-tokens" element={<DevTokens />} />

      {/* Redirect Root based on Role */}
      <Route path="/" element={
        session ? (
          loading ? <div className="h-screen bg-void flex items-center justify-center">Loading Profile...</div> :
          role === 'mentor' ? <Navigate to="/dashboard" replace /> : 
          role === 'student' ? <Navigate to="/me/attendance" replace /> : 
          <div className="h-screen bg-void flex flex-col items-center justify-center space-y-4">
            <p className="text-secondary">User profile not found. Please contact support.</p>
            <Button onClick={() => signOut()}>Sign Out</Button>
          </div>
        ) : <Navigate to="/login" replace />
      } />

      {/* Protected Routes (Shell) */}
      <Route element={<AppShell />}>
        {/* Mentor Routes */}
        <Route path="/dashboard" element={
          <RoleGuard allowedRoles={['mentor']}>
            <Dashboard />
          </RoleGuard>
        } />
        <Route path="/attendance" element={
          <RoleGuard allowedRoles={['mentor']}>
            <MarkAttendance />
          </RoleGuard>
        } />
        <Route path="/history" element={
          <RoleGuard allowedRoles={['mentor']}>
            <History />
          </RoleGuard>
        } />
        <Route path="/materials" element={
          <RoleGuard allowedRoles={['mentor']}>
            <Materials />
          </RoleGuard>
        } />
        <Route path="/upload" element={
          <RoleGuard allowedRoles={['mentor']}>
            <Upload />
          </RoleGuard>
        } />
        <Route path="/ai-upload" element={
          <RoleGuard allowedRoles={['mentor']}>
            <AIUpload />
          </RoleGuard>
        } />

        {/* Student Routes */}
        <Route path="/me/attendance" element={
          <RoleGuard allowedRoles={['student']}>
            <StudentAttendance />
          </RoleGuard>
        } />
        <Route path="/me/upcoming" element={
          <RoleGuard allowedRoles={['student']}>
            <Upcoming />
          </RoleGuard>
        } />
        <Route path="/me/materials" element={
          <RoleGuard allowedRoles={['student']}>
            <StudentMaterials />
          </RoleGuard>
        } />
      </Route>
      
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
