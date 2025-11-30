/**
 * Простой способ использования иконок
 * Просто замените SVG код внутри компонента
 */

export const LogoIcon = ({ width = 29, height = 29, className }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 29 29"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path fillRule="evenodd" clipRule="evenodd" d="M24.9249 8.15024C27.1755 8.15024 29 6.32574 29 4.07512C29 1.82449 27.1755 0 24.9249 0C22.6743 0 20.8498 1.82449 20.8498 4.07512C20.8498 6.32574 22.6743 8.15024 24.9249 8.15024Z" fill="#2B83F6" />
            <path fillRule="evenodd" clipRule="evenodd" d="M24.9247 18.3851C27.1753 18.3851 28.9998 16.5607 28.9998 14.3101C28.9998 12.0596 27.1753 10.2352 24.9247 10.2352C22.6741 10.2352 20.8496 12.0596 20.8496 14.3101C20.8496 16.5607 22.6741 18.3851 24.9247 18.3851Z" fill="#2B83F6" />
            <path fillRule="evenodd" clipRule="evenodd" d="M24.9247 28.9996C27.1753 28.9996 28.9998 27.1751 28.9998 24.9245C28.9998 22.6738 27.1753 20.8494 24.9247 20.8494C22.6741 20.8494 20.8496 22.6738 20.8496 24.9245C20.8496 27.1751 22.6741 28.9996 24.9247 28.9996Z" fill="#2B83F6" />
            <path fillRule="evenodd" clipRule="evenodd" d="M14.3107 18.3851C16.5613 18.3851 18.3857 16.5607 18.3857 14.3101C18.3857 12.0596 16.5613 10.2352 14.3107 10.2352C12.0601 10.2352 10.2357 12.0596 10.2357 14.3101C10.2357 16.5607 12.0601 18.3851 14.3107 18.3851Z" fill="#2B83F6" />
            <path fillRule="evenodd" clipRule="evenodd" d="M14.3105 28.9996C16.5611 28.9996 18.3855 27.1751 18.3855 24.9245C18.3855 22.6738 16.5611 20.8494 14.3105 20.8494C12.06 20.8494 10.2355 22.6738 10.2355 24.9245C10.2355 27.1751 12.06 28.9996 14.3105 28.9996Z" fill="#2B83F6" />
            <path fillRule="evenodd" clipRule="evenodd" d="M4.07512 28.9996C6.32574 28.9996 8.15024 27.1751 8.15024 24.9245C8.15024 22.6738 6.32574 20.8494 4.07512 20.8494C1.82449 20.8494 0 22.6738 0 24.9245C0 27.1751 1.82449 28.9996 4.07512 28.9996Z" fill="#2B83F6" />
        </svg>
    );
};

export const LoginIcon = ({ width = 20, height = 20, className }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <path
                d="M14.1667 7.61627H5.83333C4.68274 7.61627 3.75 8.54901 3.75 9.69961V15.9496C3.75 17.1002 4.68274 18.0329 5.83333 18.0329H14.1667C15.3173 18.0329 16.25 17.1002 16.25 15.9496V9.69961C16.25 8.54901 15.3173 7.61627 14.1667 7.61627Z"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M10 1.36627C8.89497 1.36627 7.83516 1.80526 7.05376 2.58666C6.27236 3.36806 5.83337 4.42787 5.83337 5.53294V7.61627H14.1667V5.53294C14.1667 4.42787 13.7277 3.36806 12.9463 2.58666C12.1649 1.80526 11.1051 1.36627 10 1.36627V1.36627Z"
                stroke="currentColor"
                strokeWidth="1.66667"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

export const SearchIcon = ({ width = 20, height = 20, className }) => {
    return (
        <svg
            width={width}
            height={height}
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            {/* ЗАМЕНИТЕ ЭТОТ КОД НА СВОЮ ИКОНКУ ПОИСКА */}
            <path
                d="M9 17C13.4183 17 17 13.4183 17 9C17 4.58172 13.4183 1 9 1C4.58172 1 1 4.58172 1 9C1 13.4183 4.58172 17 9 17Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M19 19L14.65 14.65"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

