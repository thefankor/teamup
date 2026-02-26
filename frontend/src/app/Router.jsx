import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import App from '../pages/ui/App'
import Notifications from '../pages/ui/Notifications'
import Profile from '../pages/ui/Profile'
import UserProfile from '../pages/ui/UserProfile'
import Project from '../pages/ui/Project'
import Auth from '../pages/ui/Auth'
import MyProjects from '../pages/ui/MyProjects'
import AddProject from '../pages/ui/AddProject'
import Search from '../pages/ui/Search'
import Responses from '../pages/ui/Responses'

function RouterContent() {
    const { loading } = useAuth();

    if (loading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '100vh',
                fontSize: '18px',
                color: '#666'
            }}>
                Загрузка...
            </div>
        );
    }

    return (
        <Routes>
            <Route path="/login" element={<Auth />} />
            <Route path="/" element={<Layout><App /></Layout>} />
            <Route path="/search" element={<Layout><Search /></Layout>} />
            <Route
                path="/notifications"
                element={
                    <ProtectedRoute>
                        <Layout><Notifications /></Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/profile"
                element={
                    <ProtectedRoute>
                        <Layout><Profile /></Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/user/:userId"
                element={
                    <ProtectedRoute>
                        <Layout><UserProfile /></Layout>
                    </ProtectedRoute>
                }
            />
            <Route path="/project/:id" element={<Layout><Project /></Layout>} />
            <Route
                path="/project/:id/responses"
                element={
                    <ProtectedRoute>
                        <Layout><Responses /></Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/my_projects"
                element={
                    <ProtectedRoute>
                        <Layout><MyProjects /></Layout>
                    </ProtectedRoute>
                }
            />
            <Route
                path="/create_project"
                element={
                    <ProtectedRoute>
                        <Layout><AddProject /></Layout>
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export function Router() {
    return (
        <BrowserRouter>
            <RouterContent />
        </BrowserRouter>
    );
}