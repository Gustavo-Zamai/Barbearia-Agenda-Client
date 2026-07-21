/**
 * admin-api.js - Funções de acesso à API para o painel administrativo
 * Todas exigem usuário com role ADMIN (profissional logado).
 */

async function adminApiMetricas() {
    const res = await fetchWithAuth(`${API_URL}/dashboard/metricas`);
    if (!res.ok) throw new Error('Não foi possível carregar as métricas');
    return res.json();
}

async function adminApiFaturamento(inicio, fim) {
    const params = new URLSearchParams({ inicio, fim });
    const res = await fetchWithAuth(`${API_URL}/dashboard/faturamento?${params}`);
    if (!res.ok) throw new Error('Não foi possível carregar o faturamento');
    return res.json();
}

async function adminApiAgendamentosHoje() {
    const res = await fetchWithAuth(`${API_URL}/dashboard/agendamentos-hoje`);
    if (!res.ok) throw new Error('Não foi possível carregar os agendamentos de hoje');
    return res.json();
}

async function adminApiListarAgendamentos(page = 0, size = 15) {
    const params = new URLSearchParams({ page, size, sort: 'dataHora,desc' });
    const res = await fetchWithAuth(`${API_URL}/agendamentos?${params}`);
    if (!res.ok) throw new Error('Não foi possível carregar os agendamentos');
    return res.json();
}

async function adminApiListarProfissionais(page = 0, size = 15) {
    const params = new URLSearchParams({ page, size, sort: 'nome,asc' });
    const res = await fetchWithAuth(`${API_URL}/profissionais?${params}`);
    if (!res.ok) throw new Error('Não foi possível carregar os profissionais');
    return res.json();
}

async function adminApiCadastrarProfissional(payload) {
    const res = await fetchWithAuth(`${API_URL}/profissionais`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const erro = await parseJsonSafe(res);
        throw new Error(erro?.message || 'Não foi possível cadastrar o profissional');
    }
    return res.json();
}

async function adminApiAlterarStatusProfissional(id, ativo) {
    const params = new URLSearchParams({ ativo });
    const res = await fetchWithAuth(`${API_URL}/profissionais/${id}/status?${params}`, {
        method: 'PATCH'
    });
    if (!res.ok) {
        const erro = await parseJsonSafe(res);
        throw new Error(erro?.message || 'Não foi possível alterar o status');
    }
    return parseJsonSafe(res);
}

/**
 * Garante que só um usuário ADMIN acesse a página. Chame no topo de
 * cada página do painel admin, depois que o DOM carregar.
 */
function exigirAdmin() {
    const usuario = getCurrentUser();
    if (!usuario || usuario.role !== 'ADMIN') {
        window.location.href = '../login.html';
    }
}

window.adminApiMetricas = adminApiMetricas;
window.adminApiFaturamento = adminApiFaturamento;
window.adminApiAgendamentosHoje = adminApiAgendamentosHoje;
window.adminApiListarAgendamentos = adminApiListarAgendamentos;
window.adminApiListarProfissionais = adminApiListarProfissionais;
window.adminApiCadastrarProfissional = adminApiCadastrarProfissional;
window.adminApiAlterarStatusProfissional = adminApiAlterarStatusProfissional;
window.exigirAdmin = exigirAdmin;
