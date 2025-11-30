import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
                <Route path="/" element={<App />} />
                <Route path="/search" element={<Search />} />
                <Route path="/notifications" element={<Notifications />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/project/:id" element={<Project />} />
                <Route path="/project/:id/responses" element={<Responses />} />
                <Route path="/login" element={<Auth />} />
                <Route path="/my_projects" element={<MyProjects />} />
                <Route path="/create_project" element={<AddProject />} />
                <Route path="/notifications" element={<Notifications />} />
            </Routes>
        </BrowserRouter>
    )

}