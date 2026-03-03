import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { ProtectedRoute } from '../components/ProtectedRoute'
import { useAuth } from '../contexts/AuthContext'
import { ROUTES } from './routes'

const App = lazy(() => import('../pages/ui/App'))
const Notifications = lazy(() => import('../pages/ui/Notifications'))
const Profile = lazy(() => import('../pages/ui/Profile'))
const UserProfile = lazy(() => import('../pages/ui/UserProfile'))
const Project = lazy(() => import('../pages/ui/Project'))
const Auth = lazy(() => import('../pages/ui/Auth'))
const MyProjects = lazy(() => import('../pages/ui/MyProjects'))
const AddProject = lazy(() => import('../pages/ui/AddProject'))
const Search = lazy(() => import('../pages/ui/Search'))
const Responses = lazy(() => import('../pages/ui/Responses'))

function LegacyProjectRedirect() {
    const { id } = useParams();
    return <Navigate to={`/projects/${id}`} replace />;
}

function LegacyProjectResponsesRedirect() {
    const { id } = useParams();
    return <Navigate to={`/projects/${id}/responses`} replace />;
}

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
        <Suspense fallback={<div style={{ padding: '24px', textAlign: 'center' }}>Загрузка...</div>}>
            <Routes>
                <Route path={ROUTES.login} element={<Auth />} />
                <Route path={ROUTES.home} element={<Layout><App /></Layout>} />
                <Route path={ROUTES.search} element={<Layout><Search /></Layout>} />
                <Route
                    path={ROUTES.notifications}
                    element={
                        <ProtectedRoute>
                            <Layout><Notifications /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={ROUTES.profile}
                    element={
                        <ProtectedRoute>
                            <Layout><Profile /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={ROUTES.userProfile}
                    element={
                        <ProtectedRoute>
                            <Layout><UserProfile /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route path={ROUTES.projectDetails} element={<Layout><Project /></Layout>} />
                <Route
                    path={ROUTES.projectResponses}
                    element={
                        <ProtectedRoute>
                            <Layout><Responses /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={ROUTES.myProjects}
                    element={
                        <ProtectedRoute>
                            <Layout><MyProjects /></Layout>
                        </ProtectedRoute>
                    }
                />
                <Route
                    path={ROUTES.createProject}
                    element={
                        <ProtectedRoute>
                            <Layout><AddProject /></Layout>
                        </ProtectedRoute>
                    }
                />

                <Route path="/project/:id" element={<LegacyProjectRedirect />} />
                <Route path="/project/:id/responses" element={<LegacyProjectResponsesRedirect />} />
                <Route path="/my_projects" element={<Navigate to={ROUTES.myProjects} replace />} />
                <Route path="/create_project" element={<Navigate to={ROUTES.createProject} replace />} />
            </Routes>
        </Suspense>
    );
}

export function Router() {
    return (
        <BrowserRouter>
            <RouterContent />
        </BrowserRouter>
    );
}
