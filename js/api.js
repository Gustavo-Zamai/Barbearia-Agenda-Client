/**
 * api.js - Funções de acesso à API (usam fetchWithAuth, exigem login)
 */

// ---------- Cliente logado ----------
async function apiClienteLogado() {
    const res = await fetchWithAuth(`${API_URL}/clientes/me`);
    if (!res.ok) throw new Error('Não foi possível carregar seus dados');
    return res.json();
}

// ---------- Serviços ----------
async function apiListarServicosAtivos() {
    const res = await fetchWithAuth(`${API_URL}/servicos/ativos`);
    if (!res.ok) throw new Error('Não foi possível carregar os serviços');
    return res.json();
}

// ---------- Profissionais ----------
async function apiListarProfissionaisAtivos() {
    const res = await fetchWithAuth(`${API_URL}/profissionais/ativos`);
    if (!res.ok) throw new Error('Não foi possível carregar os profissionais');
    return res.json();
}

// ---------- Disponibilidade ----------
async function apiBuscarHorariosDisponiveis(profissionalId, data, duracao) {
    const params = new URLSearchParams({ profissionalId, data, duracao });
    const res = await fetchWithAuth(`${API_URL}/agendamentos/disponibilidade?${params}`);
    if (!res.ok) throw new Error('Não foi possível carregar os horários disponíveis');
    return res.json();
}

// ---------- Agendamentos ----------
async function apiCriarAgendamento(payload) {
    const res = await fetchWithAuth(`${API_URL}/agendamentos`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const erro = await parseJsonSafe(res);
        throw new Error(erro?.message || 'Não foi possível criar o agendamento');
    }
    return res.json();
}

async function apiListarAgendamentosFuturos() {
    const res = await fetchWithAuth(`${API_URL}/agendamentos/cliente/futuros`);
    if (!res.ok) throw new Error('Não foi possível carregar seus agendamentos');
    return res.json();
}

async function apiListarAgendamentosPassados() {
    const res = await fetchWithAuth(`${API_URL}/agendamentos/cliente/passados`);
    if (!res.ok) throw new Error('Não foi possível carregar seu histórico');
    return res.json();
}

async function apiCancelarAgendamento(id, motivo) {
    const params = new URLSearchParams({ motivo, canceladoPor: 'CLIENTE' });
    const res = await fetchWithAuth(`${API_URL}/agendamentos/${id}/cancelar?${params}`, {
        method: 'PATCH'
    });
    if (!res.ok) {
        const erro = await parseJsonSafe(res);
        throw new Error(erro?.message || 'Não foi possível cancelar o agendamento');
    }
    return parseJsonSafe(res);
}

// ---------- Pagamentos ----------
async function apiBuscarPagamentoPorAgendamento(agendamentoId) {
    const res = await fetchWithAuth(`${API_URL}/pagamentos/agendamento/${agendamentoId}`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Não foi possível carregar o pagamento');
    return res.json();
}

async function apiRegistrarPagamento(payload) {
    const res = await fetchWithAuth(`${API_URL}/pagamentos`, {
        method: 'POST',
        body: JSON.stringify(payload)
    });
    if (!res.ok) {
        const erro = await parseJsonSafe(res);
        throw new Error(erro?.message || 'Não foi possível registrar o pagamento');
    }
    return res.json();
}

window.apiClienteLogado = apiClienteLogado;
window.apiListarServicosAtivos = apiListarServicosAtivos;
window.apiListarProfissionaisAtivos = apiListarProfissionaisAtivos;
window.apiBuscarHorariosDisponiveis = apiBuscarHorariosDisponiveis;
window.apiCriarAgendamento = apiCriarAgendamento;
window.apiListarAgendamentosFuturos = apiListarAgendamentosFuturos;
window.apiListarAgendamentosPassados = apiListarAgendamentosPassados;
window.apiCancelarAgendamento = apiCancelarAgendamento;
window.apiBuscarPagamentoPorAgendamento = apiBuscarPagamentoPorAgendamento;
window.apiRegistrarPagamento = apiRegistrarPagamento;
