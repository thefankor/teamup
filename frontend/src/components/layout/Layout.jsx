import { Header } from '../../../components/header/Header';
import { Footer } from '../../../components/footer/Footer';

export function Layout({ children }) {
    return (
        <>
            <Header />
            <main style={{ minHeight: 'calc(100vh - 200px)' }}>
                {children}
            </main>
            <Footer />
        </>
    );
}

