import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import App from '../pages/ui/App'
import Notifications from '../pages/ui/Notifications'
import Profile from '../pages/ui/Profile'
import Project from '../pages/ui/Project'
import Auth from '../pages/ui/Auth'
import MyProjects from '../pages/ui/MyProjects'
import AddProject from '../pages/ui/AddProject'
import Search from '../pages/ui/Search'
import Responses from '../pages/ui/Responses'

export function Router() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Auth />} />
                <Route path="/" element={<Layout><App /></Layout>} />
                <Route path="/search" element={<Layout><Search /></Layout>} />
                <Route path="/notifications" element={<Layout><Notifications /></Layout>} />
                <Route path="/profile" element={<Layout><Profile /></Layout>} />
                <Route path="/project/:id" element={<Layout><Project /></Layout>} />
                <Route path="/project/:id/responses" element={<Layout><Responses /></Layout>} />
                <Route path="/my_projects" element={<Layout><MyProjects /></Layout>} />
                <Route path="/create_project" element={<Layout><AddProject /></Layout>} />
            </Routes>
        </BrowserRouter>
    )

}