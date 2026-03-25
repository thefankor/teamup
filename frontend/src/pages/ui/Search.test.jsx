import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Search from './Search';

vi.mock('../../../components/projectCard/ProjectCard', () => ({
    ProjectCard: ({ project }) => <div>{project.title}</div>,
}));

vi.mock('../../components/seo/SeoMeta', () => ({
    SeoMeta: () => null,
}));

vi.mock('../../services/api', () => ({
    projectsAPI: {
        list: vi.fn(),
    },
}));

const { projectsAPI } = await import('../../services/api');

function renderSearch(route = '/search?q=teamup') {
    return render(
        <MemoryRouter initialEntries={[route]}>
            <Routes>
                <Route path="/search" element={<Search />} />
            </Routes>
        </MemoryRouter>,
    );
}

describe('Search page', () => {
    it('loads projects with query from URL', async () => {
        projectsAPI.list.mockResolvedValue({
            items: [{ id: '1', title: 'TeamUp API' }],
            total: 1,
        });

        renderSearch('/search?q=backend');

        await waitFor(() => {
            expect(projectsAPI.list).toHaveBeenCalledWith(
                expect.objectContaining({
                    q: 'backend',
                    sort_by: 'created_at',
                    order: 'desc',
                    limit: 20,
                    offset: 0,
                }),
            );
        });

        expect(await screen.findByText('TeamUp API')).toBeInTheDocument();
    });

    it('applies position filter and reloads list', async () => {
        projectsAPI.list.mockResolvedValue({
            items: [{ id: '1', title: 'Frontend Project' }],
            total: 1,
        });

        renderSearch();
        await screen.findByText('Frontend Project');

        await userEvent.click(screen.getByRole('button', { name: /Позиция/i }));
        await userEvent.click(screen.getByRole('button', { name: 'Front-end' }));

        await waitFor(() => {
            expect(projectsAPI.list).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    role: 'Front-end',
                }),
            );
        });
    });

    it('changes page size and recalculates request limit', async () => {
        projectsAPI.list.mockResolvedValue({
            items: [{ id: '1', title: 'Project One' }],
            total: 1,
        });

        renderSearch();
        await screen.findByText('Project One');

        await userEvent.selectOptions(screen.getByRole('combobox'), '5');

        await waitFor(() => {
            expect(projectsAPI.list).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    limit: 5,
                    offset: 0,
                }),
            );
        });
    });

    it('shows error state when backend request fails', async () => {
        projectsAPI.list.mockRejectedValue(new Error('Сервер недоступен'));

        renderSearch();

        expect(await screen.findByText('Сервер недоступен')).toBeInTheDocument();
    });

    it('allows pagination to the next page', async () => {
        projectsAPI.list
            .mockResolvedValueOnce({
                items: Array.from({ length: 20 }, (_, index) => ({
                    id: String(index + 1),
                    title: `Project ${index + 1}`,
                })),
                total: 40,
            })
            .mockResolvedValueOnce({
                items: Array.from({ length: 20 }, (_, index) => ({
                    id: String(index + 21),
                    title: `Project ${index + 21}`,
                })),
                total: 40,
            });

        renderSearch();
        await screen.findByText('Project 1');

        await userEvent.click(screen.getByRole('button', { name: 'Вперед' }));

        await waitFor(() => {
            expect(projectsAPI.list).toHaveBeenLastCalledWith(
                expect.objectContaining({
                    offset: 20,
                    limit: 20,
                }),
            );
        });

        expect(await screen.findByText('Project 21')).toBeInTheDocument();
    });
});
