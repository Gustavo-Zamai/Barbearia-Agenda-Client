/**
 * admin-agendamentos.js - Lista paginada de todos os agendamentos (admin)
 */

let paginaAtual = 0;
let totalPaginas = 1;

function formatarMoedaTabela(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataHoraTabela(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

const STATUS_LABEL_ADMIN = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    NAO_COMPARECEU: 'Não compareceu'
};

function criarLinhaTabela(a) {
    const tr = document.createElement('tr');
    const statusClass = 'stamp-' + a.status.toLowerCase();
    tr.innerHTML = `
        <td class="mono">${formatarDataHoraTabela(a.dataHora)}</td>
        <td>${a.clienteNome}</td>
        <td>${a.profissionalNome}</td>
        <td>${a.servicoNome}</td>
        <td class="mono">${formatarMoedaTabela(a.precoTotal)}</td>
        <td><span class="stamp ${statusClass}">${STATUS_LABEL_ADMIN[a.status] || a.status}</span></td>
    `;
    return tr;
}

async function carregarAgendamentos(pagina = 0) {
    const tbody = document.getElementById('tabelaAgendamentos');
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted-custom">Carregando...</td></tr>';

    try {
        const dados = await adminApiListarAgendamentos(pagina);
        paginaAtual = dados.number;
        totalPaginas = dados.totalPages;

        if (!dados.content || dados.content.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-muted-custom">Nenhum agendamento encontrado.</td></tr>';
        } else {
            tbody.innerHTML = '';
            dados.content.forEach(a => tbody.appendChild(criarLinhaTabela(a)));
        }

        document.getElementById('paginaInfo').textContent =
            `Página ${paginaAtual + 1} de ${Math.max(totalPaginas, 1)} · ${dados.totalElements} agendamento(s)`;

        document.getElementById('btnAnterior').disabled = paginaAtual === 0;
        document.getElementById('btnProxima').disabled = paginaAtual + 1 >= totalPaginas;

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="alert-barbearia alert-danger-custom p-3">${err.message}</div></td></tr>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    exigirAdmin();

    document.getElementById('btnAnterior').addEventListener('click', () => {
        if (paginaAtual > 0) carregarAgendamentos(paginaAtual - 1);
    });
    document.getElementById('btnProxima').addEventListener('click', () => {
        if (paginaAtual + 1 < totalPaginas) carregarAgendamentos(paginaAtual + 1);
    });

    carregarAgendamentos(0);
});
