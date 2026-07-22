/**
 * dashboard.js - Lógica da tela "Meus horários"
 */

const MESES = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];

const STATUS_LABEL = {
    PENDENTE: 'Pendente',
    CONFIRMADO: 'Confirmado',
    EM_ANDAMENTO: 'Em andamento',
    CONCLUIDO: 'Concluído',
    CANCELADO: 'Cancelado',
    NAO_COMPARECEU: 'Não compareceu'
};

let agendamentoParaCancelar = null;
let modalCancelar = null;

function formatarMoeda(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarHora(dataHoraIso) {
    const d = new Date(dataHoraIso);
    return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function criarTicket(agendamento, permiteCancelar) {
    const d = new Date(agendamento.dataHora);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = MESES[d.getMonth()];
    const statusClass = 'stamp-' + agendamento.status.toLowerCase();
    const statusLabel = STATUS_LABEL[agendamento.status] || agendamento.status;

    const podeCancel = permiteCancelar && ['PENDENTE', 'CONFIRMADO'].includes(agendamento.status);

    const wrapper = document.createElement('div');
    wrapper.className = 'ticket';
    wrapper.innerHTML = `
        <div class="ticket-stub">
            <span class="ticket-day">${dia}</span>
            <span class="ticket-month">${mes}</span>
        </div>
        <div class="ticket-body">
            <div class="ticket-info">
                <div class="ticket-servico">${agendamento.servicoNome}</div>
                <div class="ticket-meta">${formatarHora(agendamento.dataHora)} · ${agendamento.profissionalNome} · ${formatarMoeda(agendamento.precoTotal)}</div>
            </div>
            <div class="ticket-actions">
                ${podeCancel ? `<button class="btn btn-danger-custom btn-cancelar" data-id="${agendamento.id}">Cancelar</button>` : ''}
                <span class="pagamento-area" data-agendamento-id="${agendamento.id}" data-preco="${agendamento.precoTotal}"></span>
                <span class="stamp ${statusClass}">${statusLabel}</span>
            </div>
        </div>
    `;
    return wrapper;
}

function renderLista(container, agendamentos, permiteCancelar, mensagemVazio) {
    container.innerHTML = '';

    if (!agendamentos || agendamentos.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">✂</div>
                <p class="mb-0">${mensagemVazio}</p>
            </div>
        `;
        return;
    }

    agendamentos
        .sort((a, b) => new Date(a.dataHora) - new Date(b.dataHora))
        .forEach(ag => container.appendChild(criarTicket(ag, permiteCancelar)));

    container.querySelectorAll('.btn-cancelar').forEach(btn => {
        btn.addEventListener('click', () => abrirModalCancelar(btn.dataset.id));
    });

    carregarStatusPagamentos(container);
}

const PAGAMENTO_STATUS_LABEL = {
    PENDENTE: 'Pagamento pendente',
    PAGO: 'Pago',
    CANCELADO: 'Pagamento cancelado',
    REEMBOLSADO: 'Reembolsado'
};

async function carregarStatusPagamentos(container) {
    const areas = container.querySelectorAll('.pagamento-area');
    for (const area of areas) {
        const agendamentoId = area.dataset.agendamentoId;
        try {
            const pagamento = await apiBuscarPagamentoPorAgendamento(agendamentoId);
            if (!pagamento) {
                area.innerHTML = `<button class="btn btn-outline-brass btn-sm btn-pagar" data-id="${agendamentoId}" data-preco="${area.dataset.preco}">Pagar</button>`;
                area.querySelector('.btn-pagar').addEventListener('click', () => abrirModalPagamento(agendamentoId, area.dataset.preco));
            } else {
                const classe = 'stamp-' + (pagamento.status === 'PAGO' ? 'confirmado' : pagamento.status === 'PENDENTE' ? 'pendente' : 'cancelado');
                area.innerHTML = `<span class="stamp ${classe}">${PAGAMENTO_STATUS_LABEL[pagamento.status] || pagamento.status}</span>`;
            }
        } catch (err) {
            area.innerHTML = '';
        }
    }
}

let agendamentoParaPagar = null;
let modalPagamento = null;

function abrirModalPagamento(agendamentoId, preco) {
    agendamentoParaPagar = agendamentoId;
    document.getElementById('valorPagamento').textContent = formatarMoeda(preco);
    document.getElementById('metodoPagamento').value = 'PIX';
    modalPagamento.show();
}

async function confirmarPagamento() {
    const metodo = document.getElementById('metodoPagamento').value;
    const btn = document.getElementById('btnConfirmarPagamento');
    const area = document.querySelector(`.pagamento-area[data-agendamento-id="${agendamentoParaPagar}"]`);
    const preco = area.dataset.preco;

    btn.disabled = true;
    btn.textContent = 'Registrando...';

    try {
        await apiRegistrarPagamento({
            agendamentoId: Number(agendamentoParaPagar),
            valor: Number(preco),
            metodo: metodo
        });
        modalPagamento.hide();
        area.innerHTML = `<span class="stamp stamp-pendente">Pagamento pendente</span>`;
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar pagamento';
    }
}

function abrirModalCancelar(id) {
    agendamentoParaCancelar = id;
    document.getElementById('motivoCancelamento').value = '';
    modalCancelar.show();
}

async function confirmarCancelamento() {
    const motivo = document.getElementById('motivoCancelamento').value.trim() || 'Cancelado pelo cliente';
    const btn = document.getElementById('btnConfirmarCancelamento');

    btn.disabled = true;
    btn.textContent = 'Cancelando...';

    try {
        await apiCancelarAgendamento(agendamentoParaCancelar, motivo);
        modalCancelar.hide();
        await carregarFuturos();
    } catch (err) {
        alert(err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Confirmar cancelamento';
    }
}

async function carregarFuturos() {
    const container = document.getElementById('listaFuturos');
    try {
        const agendamentos = await apiListarAgendamentosFuturos();
        renderLista(container, agendamentos, true, 'Você ainda não tem horários marcados. Que tal agendar um?');
    } catch (err) {
        container.innerHTML = `<div class="alert-barbearia alert-danger-custom p-3">${err.message}</div>`;
    }
}

async function carregarPassados() {
    const container = document.getElementById('listaPassados');
    try {
        const agendamentos = await apiListarAgendamentosPassados();
        renderLista(container, agendamentos, false, 'Seu histórico de atendimentos aparece aqui.');
    } catch (err) {
        container.innerHTML = `<div class="alert-barbearia alert-danger-custom p-3">${err.message}</div>`;
    }
}

function mostrarAba(aba) {
    const futurosBtn = document.getElementById('tabFuturosBtn');
    const passadosBtn = document.getElementById('tabPassadosBtn');
    const listaFuturos = document.getElementById('listaFuturos');
    const listaPassados = document.getElementById('listaPassados');

    const ativo = { color: 'var(--accent)', borderBottom: '2px solid var(--accent)' };
    const inativo = { color: 'var(--text-muted)', borderBottom: '2px solid transparent' };

    if (aba === 'futuros') {
        Object.assign(futurosBtn.style, ativo);
        Object.assign(passadosBtn.style, inativo);
        listaFuturos.classList.remove('d-none');
        listaPassados.classList.add('d-none');
    } else {
        Object.assign(passadosBtn.style, ativo);
        Object.assign(futurosBtn.style, inativo);
        listaPassados.classList.remove('d-none');
        listaFuturos.classList.add('d-none');
        if (!listaPassados.dataset.loaded) {
            carregarPassados();
            listaPassados.dataset.loaded = '1';
        }
    }
}

document.addEventListener('DOMContentLoaded', async () => {
    modalCancelar = new bootstrap.Modal(document.getElementById('modalCancelar'));
    document.getElementById('btnConfirmarCancelamento').addEventListener('click', confirmarCancelamento);

    modalPagamento = new bootstrap.Modal(document.getElementById('modalPagamento'));
    document.getElementById('btnConfirmarPagamento').addEventListener('click', confirmarPagamento);

    const usuario = getCurrentUser();
    if (usuario?.nome) {
        document.getElementById('userNome').textContent = usuario.nome;
    }

    await carregarFuturos();
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('listaFuturos').classList.remove('d-none');
});
