export const MOCK_TOKENS = {
  access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwYWIiLCJzaWQiOiJhYWFhYWFhYS1iYmJiLWNjY2MtZGRkZC1lZWVlZWVlZWVlZWUiLCJ2ZXIiOjEsImV4cCI6OTk5OTk5OTk5OX0.mock',
  refresh_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3OC0xMjM0LTEyMzQtMTIzNC0xMjM0NTY3ODkwYWIiLCJzaWQiOiJhYWFhYWFhYS1iYmJiLWNjY2MtZGRkZC1lZWVlZWVlZWVlZWUiLCJ2ZXIiOjEsImV4cCI6OTk5OTk5OTk5OX0.mock-refresh',
};

export const MOCK_USER = {
  id: '12345678-1234-1234-1234-1234567890ab',
  user_type: 'USER' as const,
  first_name: 'Иван',
  last_name: 'Тестов',
  middle_name: null,
  avatar_url: null,
  position: 'Frontend Developer',
  about: 'Тестовый пользователь',
  looking_for_projects: true,
  tags: ['React', 'TypeScript'],
  skills: ['JavaScript', 'React', 'Node.js'],
  contact_info: {
    phone: '+79001234567',
    email: 'test@example.com',
    github_username: 'testuser',
    vk_username: null,
    tg_username: 'testuser_tg',
    whatsapp_username: null,
  },
  education: [],
  projects: [],
};

export const MOCK_ADMIN = {
  ...MOCK_USER,
  id: 'admin-1234-1234-1234-1234567890ab',
  user_type: 'ADMIN' as const,
  first_name: 'Админ',
  last_name: 'Тестов',
  contact_info: {
    ...MOCK_USER.contact_info,
    email: 'admin@example.com',
  },
};

export const MOCK_PROJECT = {
  id: 'proj-1234-1234-1234-1234567890ab',
  title: 'Тестовый проект',
  description: 'Описание тестового проекта для E2E тестирования',
  tags: ['Front-end', 'Back-end'],
  is_open: true,
  created_at: '2025-01-15T12:00:00Z',
  updated_at: '2025-01-15T12:00:00Z',
  owner_id: MOCK_USER.id,
  owner: MOCK_USER,
  positions: [
    { id: 'pos-1', project_id: 'proj-1234-1234-1234-1234567890ab', name: 'Frontend Developer', role: 'Front-end', level: 'junior' },
    { id: 'pos-2', project_id: 'proj-1234-1234-1234-1234567890ab', name: 'Backend Developer', role: 'Back-end', level: 'middle' },
  ],
  participants: [],
  applications: [],
};

export function generateProjects(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: `proj-${String(i + 1).padStart(4, '0')}`,
    title: `Проект ${i + 1}`,
    description: `Описание проекта ${i + 1}`,
    tags: i % 2 === 0 ? ['Front-end'] : ['Back-end'],
    is_open: true,
    created_at: new Date(2025, 0, count - i).toISOString(),
    updated_at: new Date(2025, 0, count - i).toISOString(),
    owner: MOCK_USER,
    positions: [
      {
        id: `pos-${i + 1}`,
        project_id: `proj-${String(i + 1).padStart(4, '0')}`,
        name: i % 2 === 0 ? 'Frontend Dev' : 'Backend Dev',
        role: i % 2 === 0 ? 'Front-end' : 'Back-end',
        level: ['junior', 'middle', 'senior'][i % 3],
      },
    ],
    participants: [],
  }));
}

export const MOCK_GITHUB_USER = {
  login: 'testuser',
  avatar_url: 'https://avatars.githubusercontent.com/u/12345',
  profile_url: 'https://github.com/testuser',
  public_repos: 42,
  followers: 100,
  following: 50,
  created_at: '2020-01-01T00:00:00Z',
  api_url: 'https://api.github.com/users/testuser',
};

export const MOCK_GITHUB_REPOS = {
  user_login: 'testuser',
  items: [
    {
      name: 'awesome-project',
      html_url: 'https://github.com/testuser/awesome-project',
      description: 'An awesome project',
      stargazers_count: 150,
      watchers_count: 150,
      forks_count: 30,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    },
    {
      name: 'cool-lib',
      html_url: 'https://github.com/testuser/cool-lib',
      description: 'A cool library',
      stargazers_count: 50,
      watchers_count: 50,
      forks_count: 10,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2025-06-01T00:00:00Z',
    },
  ],
};
