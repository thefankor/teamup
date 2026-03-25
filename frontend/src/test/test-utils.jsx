import { AuthProvider } from '../contexts/AuthContext';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';

export function renderWithProviders(
    ui,
    {
        route = '/',
        withAuthProvider = false,
    } = {},
) {
    const wrapped = withAuthProvider ? (
        <AuthProvider>{ui}</AuthProvider>
    ) : (
        ui
    );

    return render(
        <MemoryRouter initialEntries={[route]}>
            {wrapped}
        </MemoryRouter>,
    );
}
