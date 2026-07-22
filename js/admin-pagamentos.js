/**
 * admin-pagamentos.js - Gestão de pagamentos (admin)
 */

let statusAtual = 'PENDENTE';
let pagamentoParaCancelar = null;
let modalCancelarPagamento = null;

const METODO_LABEL = {
    DINHEIRO: 'Dinheiro',
    CARTAO_CREDITO: 'Cartão de crédito',
    CARTAO_DEBITO: 'Cartão de débito',
    PIX: 'Pix',
    TRANSFERENCIA: 'Transferência'
};

function formatarMoedaPag(valor) {
    return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarDataPag(iso) {
    return new Date(iso).toLocaleDateString('pt-BR') + ' ' + new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function mostrarErroPag(msg) {
    const box = document.getElementById('alertBox');
    box.textContent = msg;
    box.classList.remove('d-none');
}

function criarLinhaPagamento(p) {
    const tr = document.createElement('tr');

    let acoes = '';
    if (p.status === 'PENDENTE') {
        acoes = `
            <button class="btn btn-brass btn-sm btn-confirmar" data-id="${p.id}">Confirmar</button>
            <button class="btn btn-danger-custom btn-sm btn-cancelar-pag" data-id="${p.id}">Cancelar</button>
        `;
    } else if (p.status === 'PAGO') {
        acoes = `<button class="btn btn-outline-brass btn-sm btn-reembolsar" data-id="${p.id}">Reembolsar</button>`;
    } else {
        acoes = '<span class="text-muted-custom">—</span>';
    }

    tr.innerHTML = `
        <td class="mono">#${p.id}</td>
        <td class="mono">Agendamento #${p.agendamentoId}</td>
        <td class="mono">${formatarMoedaPag(p.valor)}</td>
        <td>${METODO_LABEL[p.metodo] || p.metodo}</td>
        <td class="mono">${formatarDataPag(p.createdAt)}</td>
        <td class="d-flex gap-2">${acoes}</td>
    `;

    tr.querySelector('.btn-confirmar')?.addEventListener('click', () => confirmarPagamentoAdmin(p.id));
    tr.querySelector('.btn-cancelar-pag')?.addEventListener('click', () => abrirModalCancelarPagamento(p.id));
    tr.querySelector('.btn-reembolsar')?.addEventListener('click', () => reembolsarPagamentoAdmin(p.id));

    return tr;
}

async function carregarPagamentos(status) {
    statusAtual = status;
    const tbody = document.getElementById('tabelaPagamentos');
    tbody.innerHTML = '<tr><td colspan="6" class="text-muted-custom">Carregando...</td></tr>';

    try {
        const pagamentos = await adminApiListarPagamentosPorStatus(status);
        if (!pagamentos || pagamentos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-muted-custom">Nenhum pagamento nesse status.</td></tr>';
        } else {
            tbody.innerHTML = '';
            pagamentos
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .forEach(p => tbody.appendChild(criarLinhaPagamento(p)));
        }
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="6"><div class="alert-barbearia alert-danger-custom p-3">${err.message}</div></td></tr>`;
    }
}

async function confirmarPagamentoAdmin(id) {
    try {
        await adminApiConfirmarPagamento(id);
        await carregarPagamentos(statusAtual);
    } catch (err) {
        mostrarErroPag(err.message);
    }
}

function abrirModalCancelarPagamento(id) {
    pagamentoParaCancelar = id;
    document.getElementById('motivoCancelarPagamento').value = '';
    modalCancelarPagamento.show();
}

async function reembolsarPagamentoAdmin(id) {
    if (!confirm('Confirma o reembolso deste pagamento?')) return;
    try {
        await adminApiReembolsarPagamento(id);
        await carregarPagamentos(statusAtual);
    } catch (err) {
        mostrarErroPag(err.message);
    }
}

async function carregarAvisoAtrasados() {
    try {
        const atrasados = await adminApiListarPagamentosPendentesAntigos();
        const box = document.getElementById('avisoAtrasados');
        if (atrasados && atrasados.length > 0) {
            box.textContent = `⚠ ${atrasados.length} pagamento(s) pendente(s) há mais de 7 dias — vale dar uma olhada.`;
            box.classList.remove('d-none');
        }
    } catch (err) {
        // silencioso — não é crítico para a tela funcionar
    }
}

document.addEventListener('DOMContentLoaded', () => {
    exigirAdmin();

    modalCancelarPagamento = new bootstrap.Modal(document.getElementById('modalCancelarPagamento'));

    document.getElementById('btnConfirmarCancelarPagamento').addEventListener('click', async () => {
        const motivo = document.getElementById('motivoCancelarPagamento').value.trim() || 'Cancelado pelo admin';
        try {
            await adminApiCancelarPagamento(pagamentoParaCancelar, motivo);
            modalCancelarPagamento.hide();
            await carregarPagamentos(statusAtual);
        } catch (err) {
            mostrarErroPag(err.message);
        }
    });

    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            carregarPagamentos(btn.dataset.status);
        });
    });

    carregarPagamentos('PENDENTE');
    carregarAvisoAtrasados();
});
