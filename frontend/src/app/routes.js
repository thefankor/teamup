export const ROUTES = {
    home: '/',
    login: '/login',
    search: '/search',
    notifications: '/notifications',
    profile: '/profile',
    userProfile: '/user/:userId',
    myProjects: '/my-projects',
    createProject: '/projects/new',
    projectDetails: '/projects/:id',
    projectResponses: '/projects/:id/responses',
};

export const routePaths = {
    projectDetails: (id) => `/projects/${id}`,
    projectResponses: (id) => `/projects/${id}/responses`,
    userProfile: (userId) => `/user/${userId}`,
};
