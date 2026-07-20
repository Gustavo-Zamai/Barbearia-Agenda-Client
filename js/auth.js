/**
 * auth.js - Gerencia autenticação e sessão do usuário
 */

function login(email, senha) {
    return fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
    });
}

function register(usuario) {
    return fetch(`${API_URL}/clientes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(usuario)
    });
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    window.location.href = 'index.html';
}

function isAuthenticated() {
    const token = localStorage.getItem('token');
    if (!token) return false;

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const exp = payload.exp * 1000;
        return Date.now() < exp;
    } catch {
        return false;
    }
}

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('usuario'));
    } catch {
        return null;
    }
}

function getAuthToken() {
    return localStorage.getItem('token');
}

/**
 * Lê o corpo de uma Response com segurança, mesmo quando vazio.
 * Evita "Unexpected end of JSON input" em respostas sem corpo.
 */
async function parseJsonSafe(response) {
    const text = await response.text();
    if (!text) return null;
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}

// Interceptor para requisições autenticadas
async function fetchWithAuth(url, options = {}) {
    const token = getAuthToken();

    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
        ...options,
        headers
    });

    if (response.status === 401 || (response.status === 403 && !isAuthenticated())) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = 'login.html';
        throw new Error('Sessão expirada. Faça login novamente.');
    }

    return response;
}

document.addEventListener('DOMContentLoaded', function () {
    const protectedPages = ['dashboard.html', 'agendamento.html'];
    const currentPage = window.location.pathname.split('/').pop();

    if (protectedPages.includes(currentPage)) {
        if (!isAuthenticated()) {
            window.location.href = 'login.html';
        }
    }
});

window.isAuthenticated = isAuthenticated;
window.getCurrentUser = getCurrentUser;
window.getAuthToken = getAuthToken;
window.logout = logout;
window.login = login;
window.register = register;
window.fetchWithAuth = fetchWithAuth;
window.parseJsonSafe = parseJsonSafe;
