import { LogoIcon } from '../../src/components/icons/SimpleIcon';
import style from './style.module.scss';

export const Footer = () => {
    return (
        <footer className={style.footer}>
            <div className={style.container}>
                <div className={style.logo}>
                    <LogoIcon width={32} height={32} />
                    <span className={style.logoText}>TeamUp</span>
                </div>
                <div className={style.copyright}>
                    Copyright © 2025 TeamUp
                </div>
            </div>
        </footer>
    );
}

